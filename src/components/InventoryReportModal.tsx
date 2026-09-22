import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  BarChart3, 
  FileText, 
  Download, 
  Printer, 
  ExternalLink, 
  ShieldAlert, 
  Layers, 
  Package, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  X, 
  FileSpreadsheet, 
  FolderTree, 
  Coins, 
  TrendingUp, 
  Warehouse,
  ArrowDownToLine,
  ChevronRight,
  HardDrive,
  Info,
  Filter,
  ArrowUpDown,
  ExternalLink as LinkIcon
} from 'lucide-react';
import { HerbItem } from '../types';
import { 
  calculateCategoryValuations, 
  calculateStorageHierarchy, 
  calculateRiskAudit,
  getActiveLot,
  getHerbTotalStock,
  getLotBalance,
  getExpiryStatus,
  exportInventoryValuationCSV,
  exportWarehouseStructureCSV,
  exportAllHerbsDirectoryCSV,
  exportRiskAndReorderCSV,
  exportWarehouseHierarchyJSON,
  exportAllHerbsJSON,
  downloadExecutiveReportHTML,
  openExecutiveReportInNewTab,
  exportStockSummaryCSV,
  exportStockTransactionsCSV,
  formatDateThai,
  printStockCardsDirect,
  downloadStockCardPDF
} from '../utils/stockUtils';

interface InventoryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  herbs: HerbItem[];
  onSelectHerb?: (herbId: string) => void;
}

type TabType = 'valuation' | 'structure' | 'risk' | 'downloads';

export const InventoryReportModal: React.FC<InventoryReportModalProps> = ({
  isOpen,
  onClose,
  herbs,
  onSelectHerb,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('valuation');
  const [herbSearch, setHerbSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'stockDesc' | 'stockAsc' | 'valueDesc' | 'expAsc'>('code');
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);
  const [isGeneratingStockCardPdf, setIsGeneratingStockCardPdf] = useState(false);

  const showNotification = (msg: string) => {
    setDownloadSuccessMsg(msg);
    setTimeout(() => {
      setDownloadSuccessMsg(null);
    }, 4000);
  };

  // Unique categories
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    herbs.forEach(h => {
      if (h.category) set.add(h.category);
    });
    return Array.from(set);
  }, [herbs]);

  // Calculations
  const { categories, grandTotalValue, grandTotalUnits, grandTotalLots } = useMemo(() => {
    return calculateCategoryValuations(herbs);
  }, [herbs]);

  const hierarchy = useMemo(() => {
    return calculateStorageHierarchy(herbs);
  }, [herbs]);

  const risk = useMemo(() => {
    return calculateRiskAudit(herbs);
  }, [herbs]);

  // Filtered and sorted flat list of all herbs (No shelves, no cabinets, no treatment rooms)
  const filteredHerbs = useMemo(() => {
    return herbs.filter(herb => {
      // Search filter across name, code, commonName, category, indications, lot numbers
      if (herbSearch.trim()) {
        const q = herbSearch.toLowerCase();
        const matchName = herb.name.toLowerCase().includes(q);
        const matchCommon = (herb.commonName || '').toLowerCase().includes(q);
        const matchCode = (herb.code || '').toLowerCase().includes(q);
        const matchCategory = herb.category.toLowerCase().includes(q);
        const matchIndication = (herb.indications || '').toLowerCase().includes(q);
        const matchLot = herb.lots.some(l => l.lotNo.toLowerCase().includes(q));

        if (!matchName && !matchCommon && !matchCode && !matchCategory && !matchIndication && !matchLot) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== 'all' && herb.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const balance = getHerbTotalStock(herb);
        const hasExpired = herb.lots.some(l => getLotBalance(l) > 0 && getExpiryStatus(l.expDate).status === 'expired');
        const hasCritical = herb.lots.some(l => getLotBalance(l) > 0 && getExpiryStatus(l.expDate).status === 'critical');
        const isLowStock = balance <= herb.minStockAlert;

        if (statusFilter === 'expired' && !hasExpired) return false;
        if (statusFilter === 'expiring' && !hasCritical) return false;
        if (statusFilter === 'low-stock' && !isLowStock) return false;
        if (statusFilter === 'normal' && (hasExpired || hasCritical || isLowStock)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'th');
      if (sortBy === 'code') return (a.code || '').localeCompare(b.code || '');
      if (sortBy === 'stockDesc') return getHerbTotalStock(b) - getHerbTotalStock(a);
      if (sortBy === 'stockAsc') return getHerbTotalStock(a) - getHerbTotalStock(b);
      if (sortBy === 'valueDesc') {
        const valA = a.lots.reduce((sum, l) => sum + getLotBalance(l) * (l.unitPrice || 0), 0);
        const valB = b.lots.reduce((sum, l) => sum + getLotBalance(l) * (l.unitPrice || 0), 0);
        return valB - valA;
      }
      if (sortBy === 'expAsc') {
        const activeA = getActiveLot(a) || a.lots[0];
        const activeB = getActiveLot(b) || b.lots[0];
        const expA = activeA?.expDate || '9999-99-99';
        const expB = activeB?.expDate || '9999-99-99';
        return expA.localeCompare(expB);
      }
      return 0;
    });
  }, [herbs, herbSearch, categoryFilter, statusFilter, sortBy]);

  // Aggregate metrics for filtered list
  const { filteredUnits, filteredValue, filteredLotsCount } = useMemo(() => {
    let units = 0;
    let value = 0;
    let lots = 0;
    filteredHerbs.forEach(h => {
      units += getHerbTotalStock(h);
      lots += h.lots.length;
      value += h.lots.reduce((sum, l) => sum + getLotBalance(l) * (l.unitPrice || 0), 0);
    });
    return { filteredUnits: units, filteredValue: value, filteredLotsCount: lots };
  }, [filteredHerbs]);

  if (!isOpen) return null;

  const todayThai = formatDateThai(new Date().toISOString().slice(0, 10));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white px-5 sm:px-7 py-4.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Building2 className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-prompt">
                  รายงานสรุปและทะเบียนรายชื่อยาสมุนไพรทั้งหมด
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-700/80 text-emerald-100 border border-emerald-500/40">
                  GSP &amp; FEFO Standard
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-0.5">
                ข้อมูล ณ วันที่ {todayThai} | สรุปมูลค่าคลัง ทะเบียนรายชื่อยาสมุนไพรทุกรายการ และศูนย์ดาวน์โหลดไฟล์
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                openExecutiveReportInNewTab(herbs);
                showNotification('เปิดเอกสารสรุปรายงานทางการในแท็บใหม่เรียบร้อยแล้ว');
              }}
              title="พิมพ์รายงานทางการ (Print / PDF)"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์รายงาน PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg hover:bg-white/15 text-emerald-100 hover:text-white flex items-center justify-center transition-colors"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 sm:px-7 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex space-x-1 sm:space-x-2 py-2">
            <button
              onClick={() => setActiveTab('valuation')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'valuation'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>สรุปภาพรวม &amp; มูลค่าคลัง</span>
            </button>

            <button
              onClick={() => setActiveTab('structure')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'structure'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>รายชื่อยาสมุนไพรทั้งหมด ({herbs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('risk')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'risk'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>วิเคราะห์ความเสี่ยง &amp; FEFO</span>
              {(risk.lowStockHerbs.length > 0 || risk.criticalLots.length > 0 || risk.expiredLots.length > 0) && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('downloads')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'downloads'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>ศูนย์ดาวน์โหลดไฟล์รายงาน</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                ใหม่
              </span>
            </button>
          </div>

          <div className="hidden lg:flex items-center text-xs text-slate-500 gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>คำนวณข้อมูลแบบเรียลไทม์ตามล็อตคงเหลือ</span>
          </div>
        </div>

        {/* Download Success Banner */}
        {downloadSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center justify-between text-xs sm:text-sm text-emerald-800 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{downloadSuccessMsg}</span>
            </div>
            <button 
              onClick={() => setDownloadSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 bg-slate-50/50">
          
          {/* TAB 1: VALUATION & EXECUTIVE SUMMARY */}
          {activeTab === 'valuation' && (
            <div className="space-y-6">
              {/* Metric Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">มูลค่าคลังรวม</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Coins className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900 font-prompt">
                    {grandTotalValue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-500">บาท</span>
                  </div>
                  <p className="mt-1 text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    คำนวณจากราคาต้นทุนล็อตคงเหลือ
                  </p>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">ยาสมุนไพรในคลัง</span>
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900 font-prompt">
                    {herbs.length} <span className="text-sm font-normal text-slate-500">รายการ</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    รวมทั้งสิ้น {grandTotalLots} ล็อตการผลิต
                  </p>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">จำนวนหน่วยบรรจุรวม</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900 font-prompt">
                    {grandTotalUnits.toLocaleString()} <span className="text-sm font-normal text-slate-500">หน่วย</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    ครอบคลุม {herbs.length} รายการยาในระบบคลัง
                  </p>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">มูลค่าเสี่ยงอายุยา</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-amber-700 font-prompt">
                    {risk.totalValueAtRisk.toLocaleString('th-TH', { minimumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-500">บาท</span>
                  </div>
                  <p className="mt-1 text-xs text-amber-600">
                    {risk.criticalLots.length} ล็อตใกล้หมดอายุ, {risk.expiredLots.length} หมดอายุ
                  </p>
                </div>
              </div>

              {/* Category Valuation Table Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base font-prompt flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-emerald-600" />
                      สรุปมูลค่าและปริมาณแยกตามหมวดหมู่ยาสมุนไพร
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      แสดงสัดส่วนมูลค่าสต๊อก ปริมาณคงเหลือ และสถานะความเสี่ยงในแต่ละหมวดหมู่
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      exportInventoryValuationCSV(herbs);
                      showNotification('ดาวน์โหลดไฟล์ CSV สรุปมูลค่าคลังแยกตามหมวดหมู่เรียบร้อยแล้ว');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ดาวน์โหลดสรุปหมวดหมู่ (.CSV)</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">ลำดับ</th>
                        <th className="py-3 px-4">หมวดหมู่ยาสมุนไพร</th>
                        <th className="py-3 px-4 text-center">จำนวนยา</th>
                        <th className="py-3 px-4 text-center">จำนวนล็อต</th>
                        <th className="py-3 px-4 text-right">ยอดคงเหลือ</th>
                        <th className="py-3 px-4 text-right">มูลค่ารวม (บาท)</th>
                        <th className="py-3 px-4 w-32">สัดส่วนมูลค่า</th>
                        <th className="py-3 px-4 text-center">สต๊อกต่ำ</th>
                        <th className="py-3 px-4 text-center">ใกล้หมดอายุ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categories.map((cat, idx) => (
                        <tr key={cat.category} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {cat.category}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-600">
                            {cat.herbCount} รายการ
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500">
                            {cat.lotCount} ล็อต
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-slate-700">
                            {cat.totalUnits.toLocaleString()} หน่วย
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-700">
                            {cat.totalValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-2 rounded-full" 
                                  style={{ width: `${Math.min(100, Math.max(2, cat.percentageValue))}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-medium text-slate-500 w-10 text-right">
                                {cat.percentageValue.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {cat.lowStockCount > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                {cat.lowStockCount}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {cat.expiringCount > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                                {cat.expiringCount}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-emerald-50/70 border-t-2 border-emerald-600 text-xs sm:text-sm font-bold text-slate-900">
                      <tr>
                        <td colSpan={2} className="py-3 px-4 text-center">
                          รวมทั้งสิ้น
                        </td>
                        <td className="py-3 px-4 text-center">{herbs.length} รายการ</td>
                        <td className="py-3 px-4 text-center">{grandTotalLots} ล็อต</td>
                        <td className="py-3 px-4 text-right">{grandTotalUnits.toLocaleString()} หน่วย</td>
                        <td className="py-3 px-4 text-right text-emerald-800 font-bold">
                          {grandTotalValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                        </td>
                        <td className="py-3 px-4 text-slate-500">100%</td>
                        <td className="py-3 px-4 text-center text-amber-800 font-bold">
                          {categories.reduce((a, c) => a + c.lowStockCount, 0)}
                        </td>
                        <td className="py-3 px-4 text-center text-rose-800 font-bold">
                          {categories.reduce((a, c) => a + c.expiringCount, 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALL HERBAL MEDICINES DIRECTORY (รายชื่อยาสมุนไพรทั้งหมด) */}
          {activeTab === 'structure' && (
            <div className="space-y-5">
              {/* Filter & Control Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อยา, ชื่อสามัญ, รหัสยา, สรรพคุณ หรือ Lot.No..."
                      value={herbSearch}
                      onChange={(e) => setHerbSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                    />
                    {herbSearch && (
                      <button 
                        onClick={() => setHerbSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                        title="ล้างคำค้นหา"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filters & Sorting */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Category Dropdown */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="py-2 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value="all">ทุกหมวดหมู่ ({herbs.length})</option>
                        {allCategories.map(cat => (
                          <option key={cat} value={cat}>
                            {cat} ({herbs.filter(h => h.category === cat).length})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="py-2 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value="all">ทุกสถานะ</option>
                        <option value="normal">ปกติ</option>
                        <option value="expiring">ใกล้หมดอายุ (&le; 30 วัน)</option>
                        <option value="low-stock">สต๊อกต่ำกว่าเกณฑ์</option>
                        <option value="expired">มีล็อตหมดอายุ</option>
                      </select>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="py-2 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value="code">เรียงตาม: รหัสยา</option>
                        <option value="name">เรียงตาม: ชื่อยา (ก-ฮ)</option>
                        <option value="stockDesc">ยอดคงเหลือ: มาก &rarr; น้อย</option>
                        <option value="stockAsc">ยอดคงเหลือ: น้อย &rarr; มาก</option>
                        <option value="valueDesc">มูลค่าสต๊อก: สูง &rarr; ต่ำ</option>
                        <option value="expAsc">วันหมดอายุ: ใกล้สุดก่อน</option>
                      </select>
                    </div>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex items-center gap-2 shrink-0 justify-end">
                    <button
                      onClick={() => {
                        exportWarehouseStructureCSV(herbs);
                        showNotification('ดาวน์โหลดไฟล์ CSV รายชื่อยาสมุนไพรทั้งหมดเรียบร้อยแล้ว');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                      title="ส่งออกรายชื่อยาเป็นไฟล์ Excel/CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>รายชื่อยา (.CSV)</span>
                    </button>
                    <button
                      onClick={() => {
                        exportWarehouseHierarchyJSON(herbs);
                        showNotification('ดาวน์โหลด JSON รายชื่อยาสมุนไพรเรียบร้อยแล้ว');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      title="ส่งออกรายชื่อยาเป็นไฟล์ JSON"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      <span>(.JSON)</span>
                    </button>
                  </div>
                </div>

                {/* Sub-summary banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-3">
                    <span>แสดง <strong>{filteredHerbs.length}</strong> จาก <strong>{herbs.length}</strong> รายการ</span>
                    <span className="text-slate-300">|</span>
                    <span>รวม <strong>{filteredLotsCount}</strong> ล็อตการผลิต</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>ยอดคงเหลือรวม: <strong className="text-slate-900">{filteredUnits.toLocaleString()}</strong> หน่วย</span>
                    <span>มูลค่ารวม: <strong className="text-emerald-700">{filteredValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</strong></span>
                  </div>
                </div>
              </div>

              {/* All Herbal Medicines Directory Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-3 w-10 text-center">#</th>
                        <th className="py-3 px-3 w-20 text-center">รหัสยา</th>
                        <th className="py-3 px-4 min-w-[200px]">ชื่อยาสมุนไพร / ชื่อสามัญ</th>
                        <th className="py-3 px-3 min-w-[130px]">หมวดหมู่</th>
                        <th className="py-3 px-4 min-w-[180px]">สรรพคุณ / ข้อบ่งใช้</th>
                        <th className="py-3 px-3 min-w-[110px]">ขนาดบรรจุ</th>
                        <th className="py-3 px-3 min-w-[130px]">Lot หลัก / หมดอายุ</th>
                        <th className="py-3 px-3 text-center min-w-[75px]">จำนวนล็อต</th>
                        <th className="py-3 px-3 text-right min-w-[100px]">ยอดคงเหลือ</th>
                        <th className="py-3 px-3 text-right min-w-[90px]">ราคา/หน่วย</th>
                        <th className="py-3 px-3 text-right min-w-[110px]">มูลค่ารวม</th>
                        <th className="py-3 px-3 text-center min-w-[90px]">สถานะ</th>
                        {onSelectHerb && <th className="py-3 px-3 text-center w-24">สต๊อกการ์ด</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredHerbs.map((herb, idx) => {
                        const activeLot = getActiveLot(herb) || herb.lots[0];
                        const totalStock = getHerbTotalStock(herb);
                        const exp = getExpiryStatus(activeLot?.expDate || '');
                        const totalVal = herb.lots.reduce((sum, l) => sum + (getLotBalance(l) * (l.unitPrice || 0)), 0);

                        const hasExpired = herb.lots.some(l => getLotBalance(l) > 0 && getExpiryStatus(l.expDate).status === 'expired');
                        const hasCritical = herb.lots.some(l => getLotBalance(l) > 0 && getExpiryStatus(l.expDate).status === 'critical');
                        const isLowStock = totalStock <= herb.minStockAlert;

                        return (
                          <tr 
                            key={herb.id} 
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="py-3 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                            
                            {/* Code */}
                            <td className="py-3 px-3 text-center">
                              <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                                {herb.code || '-'}
                              </span>
                            </td>

                            {/* Name & Common Name */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 font-prompt text-sm">
                                {herb.name}
                              </div>
                              {herb.commonName && herb.commonName !== herb.name && (
                                <div className="text-[11px] text-slate-500 font-normal">
                                  {herb.commonName}
                                </div>
                              )}
                            </td>

                            {/* Category */}
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                {herb.category}
                              </span>
                            </td>

                            {/* Indications */}
                            <td className="py-3 px-4 text-slate-600 text-xs leading-relaxed max-w-[240px]">
                              <p className="line-clamp-2" title={herb.indications}>
                                {herb.indications || '-'}
                              </p>
                            </td>

                            {/* Packaging */}
                            <td className="py-3 px-3 text-slate-600 text-xs font-medium">
                              {activeLot?.packaging || herb.defaultPackaging || '-'}
                            </td>

                            {/* Active Lot & Expiry */}
                            <td className="py-3 px-3">
                              <div className="font-mono text-xs font-semibold text-slate-800">
                                {activeLot?.lotNo || '-'}
                              </div>
                              {activeLot?.expDate && (
                                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                  <span>{formatDateThai(activeLot.expDate)}</span>
                                  {exp.status === 'expired' && (
                                    <span className="text-[10px] px-1 py-0.2 rounded bg-rose-100 text-rose-800 font-bold">หมดอายุ</span>
                                  )}
                                  {exp.status === 'critical' && (
                                    <span className="text-[10px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">&le;30ว.</span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Total Lots count */}
                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {herb.lots.length} ล็อต
                              </span>
                            </td>

                            {/* Total Balance */}
                            <td className="py-3 px-3 text-right">
                              <div className={`font-bold text-sm ${isLowStock ? 'text-rose-600' : 'text-slate-900'}`}>
                                {totalStock.toLocaleString()}
                              </div>
                              <div className="text-[11px] text-slate-500 font-normal">
                                {herb.defaultUnit}
                              </div>
                            </td>

                            {/* Unit Price */}
                            <td className="py-3 px-3 text-right text-slate-700 text-xs">
                              {(activeLot?.unitPrice || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                            </td>

                            {/* Total Valuation */}
                            <td className="py-3 px-3 text-right font-bold text-emerald-700 text-xs sm:text-sm font-prompt">
                              {totalVal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3 text-center">
                              {hasExpired ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  มีล็อตหมดอายุ
                                </span>
                              ) : hasCritical ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  เร่งจ่าย FEFO
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                                  สต๊อกต่ำ
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  ปกติ
                                </span>
                              )}
                            </td>

                            {/* Action: Open Stock Card Detail */}
                            {onSelectHerb && (
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => onSelectHerb(herb.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 text-xs font-medium transition-colors"
                                  title="เปิดดูและบันทึก Stock Card"
                                >
                                  <span>สต๊อกการ์ด</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-emerald-600 text-xs sm:text-sm font-bold text-slate-900">
                      <tr>
                        <td colSpan={onSelectHerb ? 7 : 6} className="py-3 px-4 text-center">
                          รวมทั้งสิ้น ({filteredHerbs.length} รายการที่แสดง)
                        </td>
                        <td className="py-3 px-3 text-center text-emerald-800">
                          {filteredLotsCount} ล็อต
                        </td>
                        <td className="py-3 px-3 text-right text-slate-900">
                          {filteredUnits.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500">-</td>
                        <td className="py-3 px-3 text-right text-emerald-800 font-bold">
                          {filteredValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                        </td>
                        <td colSpan={onSelectHerb ? 2 : 1} className="py-3 px-3 text-center text-slate-500">
                          100%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {filteredHerbs.length === 0 && (
                  <div className="p-12 text-center text-slate-500">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">ไม่พบรายการยาสมุนไพรที่ค้นหา</p>
                    <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองหมวดหมู่และสถานะ</p>
                    <button
                      onClick={() => {
                        setHerbSearch('');
                        setCategoryFilter('all');
                        setStatusFilter('all');
                      }}
                      className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  </div>
                )}
              </div>

              {/* GSP Guidelines Note */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-5 text-xs sm:text-sm text-emerald-900">
                <div className="flex items-start gap-3">
                  <Warehouse className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="font-bold text-emerald-950 font-prompt">
                      มาตรฐานการจัดเก็บยาสมุนไพรในคลัง (Good Storage Practice: GSP)
                    </h5>
                    <p className="text-emerald-800 leading-relaxed">
                      1. ควบคุมอุณหภูมิห้องจัดเก็บไม่เกิน 25-30°C และความชื้นสัมพัทธ์ไม่เกิน 60% เพื่อรักษาคุณค่าสารสำคัญของสมุนไพร<br />
                      2. จัดเรียงยาตามหลัก <strong>FEFO (First Expire, First Out)</strong> ยาที่หมดอายุก่อนให้อยู่ด้านหน้าเพื่อความปลอดภัยของผู้ป่วย<br />
                      3. ป้องกันแสงแดดส่องถึงโดยตรง โดยเฉพาะยาน้ำมัน ชาชง และสมุนไพรแห้ง<br />
                      4. แยกกลุ่มยาใช้ภายนอกออกจากยารับประทานอย่างชัดเจนตามหมวดหมู่ เพื่อป้องกันการหยิบใช้ยาผิดพลาด
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RISK & FEFO AUDIT */}
          {activeTab === 'risk' && (
            <div className="space-y-6">
              {/* Risk Top Summary */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-prompt flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    รายงานวิเคราะห์ความเสี่ยงด้านอายุยาและสินค้าขาดคลัง
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ตรวจสอบรายการยาที่หมดอายุ, ใกล้หมดอายุเร่งด่วนตามหลัก FEFO และรายการที่ต้องออกใบสั่งซื้อ
                  </p>
                </div>
                <button
                  onClick={() => {
                    exportRiskAndReorderCSV(herbs);
                    showNotification('ดาวน์โหลดไฟล์ CSV ตรวจสอบความเสี่ยงอายุยา & สต๊อกต่ำเรียบร้อยแล้ว');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลดรายงานความเสี่ยง (.CSV)</span>
                </button>
              </div>

              {/* 1. Expired Items (if any) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-rose-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-sm font-prompt">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>1. รายการยาที่หมดอายุแล้ว (Expired - ต้องกักกันและจำหน่ายออก)</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-rose-200 text-rose-900 rounded-full">
                    {risk.expiredLots.length} รายการ
                  </span>
                </div>

                {risk.expiredLots.length === 0 ? (
                  <div className="p-6 text-center text-emerald-700 text-xs sm:text-sm font-medium flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ยอดเยี่ยม! ไม่มียาสมุนไพรค้างคลังที่หมดอายุในระบบ</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px]">
                        <tr>
                          <th className="py-2.5 px-4">ชื่อยาสมุนไพร</th>
                          <th className="py-2.5 px-4">Lot.No</th>
                          <th className="py-2.5 px-4">วันหมดอายุ</th>
                          <th className="py-2.5 px-4 text-center">เลยกำหนด</th>
                          <th className="py-2.5 px-4 text-right">ยอดคงเหลือ</th>
                          <th className="py-2.5 px-4 text-right">มูลค่าสูญเสีย</th>
                          <th className="py-2.5 px-4">ขนาดบรรจุ</th>
                          <th className="py-2.5 px-4">มาตรการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {risk.expiredLots.map((item, idx) => {
                          const matchingHerb = herbs.find(h => h.name === item.herbName);
                          const pack = matchingHerb?.defaultPackaging || '-';
                          return (
                          <tr key={`exp-${idx}`} className="bg-rose-50/30">
                            <td className="py-2 px-4 font-semibold text-rose-950">{item.herbName}</td>
                            <td className="py-2 px-4 font-mono text-xs">{item.lotNo}</td>
                            <td className="py-2 px-4 text-rose-700 font-medium">{formatDateThai(item.expDate)}</td>
                            <td className="py-2 px-4 text-center text-rose-800 font-bold">{item.daysOverdue} วัน</td>
                            <td className="py-2 px-4 text-right font-bold">{item.balance}</td>
                            <td className="py-2 px-4 text-right font-bold text-rose-700">{item.totalValue.toFixed(2)} ฿</td>
                            <td className="py-2 px-4 text-slate-600">{pack}</td>
                            <td className="py-2 px-4 text-rose-800 text-xs">กักกันสินค้าทันที</td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 2. Critical FEFO Lots (<= 30 days) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-amber-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm font-prompt">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>2. รายการยาใกล้หมดอายุเร่งด่วน &le; 30 วัน (Critical - ต้องเร่งจ่ายตามหลัก FEFO)</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">
                    {risk.criticalLots.length} รายการ
                  </span>
                </div>

                {risk.criticalLots.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs sm:text-sm">
                    ไม่มียาใกล้หมดอายุในระยะ 30 วัน
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px]">
                        <tr>
                          <th className="py-2.5 px-4">ชื่อยาสมุนไพร</th>
                          <th className="py-2.5 px-4">Lot.No</th>
                          <th className="py-2.5 px-4">วันหมดอายุ</th>
                          <th className="py-2.5 px-4 text-center">คงเหลืออีก</th>
                          <th className="py-2.5 px-4 text-right">ยอดคงเหลือ</th>
                          <th className="py-2.5 px-4 text-right">มูลค่าเสี่ยง</th>
                          <th className="py-2.5 px-4">ขนาดบรรจุ</th>
                          <th className="py-2.5 px-4">การจัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {risk.criticalLots.map((item, idx) => {
                          const matchingHerb = herbs.find(h => h.name === item.herbName);
                          const pack = matchingHerb?.defaultPackaging || '-';
                          return (
                          <tr key={`crit-${idx}`} className="hover:bg-amber-50/40">
                            <td className="py-2 px-4 font-semibold text-slate-900">{item.herbName}</td>
                            <td className="py-2 px-4 font-mono text-xs">{item.lotNo}</td>
                            <td className="py-2 px-4 text-amber-800 font-medium">{formatDateThai(item.expDate)}</td>
                            <td className="py-2 px-4 text-center text-amber-800 font-bold">{item.daysRemaining} วัน</td>
                            <td className="py-2 px-4 text-right font-bold text-slate-900">{item.balance}</td>
                            <td className="py-2 px-4 text-right font-bold text-amber-700">{item.totalValue.toFixed(2)} ฿</td>
                            <td className="py-2 px-4 text-slate-600">{pack}</td>
                            <td className="py-2 px-4 text-amber-800 text-xs font-medium">ติดสติกเกอร์เร่งจ่าย FEFO</td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 3. Low Stock Reorder Recommendations */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm font-prompt">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>3. รายการยาสต๊อกต่ำกว่าเกณฑ์ขั้นต่ำ (Re-order Alert &amp; Shortage List)</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200 text-slate-800 rounded-full">
                    {risk.lowStockHerbs.length} รายการ
                  </span>
                </div>

                {risk.lowStockHerbs.length === 0 ? (
                  <div className="p-6 text-center text-emerald-700 text-xs sm:text-sm font-medium flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>สต๊อกยาสมุนไพรทุกรายการอยู่ในเกณฑ์ปลอดภัยและเพียงพอ</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px]">
                        <tr>
                          <th className="py-2.5 px-4">ชื่อยาสมุนไพร</th>
                          <th className="py-2.5 px-4">หมวดหมู่</th>
                          <th className="py-2.5 px-4 text-right">สต๊อกปัจจุบัน</th>
                          <th className="py-2.5 px-4 text-right">เกณฑ์ขั้นต่ำ</th>
                          <th className="py-2.5 px-4 text-right">จำนวนที่ขาด</th>
                          <th className="py-2.5 px-4 text-right font-bold text-emerald-700">แนะนำสั่งซื้อ</th>
                          <th className="py-2.5 px-4">ขนาดบรรจุ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {risk.lowStockHerbs.map((item, idx) => {
                          const matchingHerb = herbs.find(h => h.name === item.herbName);
                          const pack = matchingHerb?.defaultPackaging || '-';
                          return (
                          <tr key={`ls-${idx}`} className="hover:bg-slate-50">
                            <td className="py-2 px-4 font-semibold text-slate-900">{item.herbName}</td>
                            <td className="py-2 px-4 text-slate-500 text-xs">{item.category}</td>
                            <td className="py-2 px-4 text-right font-bold text-rose-600">
                              {item.currentStock} {item.unit}
                            </td>
                            <td className="py-2 px-4 text-right text-slate-600">
                              {item.minAlert} {item.unit}
                            </td>
                            <td className="py-2 px-4 text-right font-medium text-amber-700">
                              {item.shortage} {item.unit}
                            </td>
                            <td className="py-2 px-4 text-right font-bold text-emerald-700">
                              +{item.suggestedReorder} {item.unit}
                            </td>
                            <td className="py-2 px-4 text-slate-600">{pack}</td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DOWNLOAD CENTER */}
          {activeTab === 'downloads' && (
            <div className="space-y-6">
              <div className="bg-emerald-900 text-white p-5 rounded-2xl shadow-sm border border-emerald-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold font-prompt text-white flex items-center gap-2">
                      <ArrowDownToLine className="w-5 h-5 text-emerald-300" />
                      ศูนย์ดาวน์โหลดไฟล์รายงานและโครงสร้างคลังยาสมุนไพร
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
                      ส่งออกข้อมูลเป็นไฟล์ Excel/CSV, เอกสารทางการสำหรับพิมพ์/PDF หรือไฟล์โครงสร้าง JSON ครบถ้วนทุกมิติ
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        openExecutiveReportInNewTab(herbs);
                        showNotification('เปิดพิมพ์รายงานทางการในแท็บใหม่แล้ว');
                      }}
                      className="px-4 py-2 rounded-lg bg-white text-emerald-900 font-bold text-xs sm:text-sm shadow-xs hover:bg-emerald-50 transition-colors flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4 text-emerald-800" />
                      <span>พิมพ์รายงานฉบับเต็ม</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Download Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 1. Official Executive Report HTML */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/60 transition-all group">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-base font-prompt">
                      1. เอกสารรายงานสรุปทางการ (HTML / PDF)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      รายงานผลการบริหารคลังยาสมุนไพรฉบับสมบูรณ์ พร้อมตราส่วนหัวและช่องลงนามสำหรับเภสัชกร/หัวหน้างาน รองรับการพิมพ์หรือบันทึก PDF ทันที
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => {
                        downloadExecutiveReportHTML(herbs);
                        showNotification('ดาวน์โหลดไฟล์ HTML สรุปรายงานทางการเรียบร้อยแล้ว');
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลดไฟล์</span>
                    </button>
                    <button
                      onClick={() => {
                        openExecutiveReportInNewTab(herbs);
                        showNotification('เปิดรายงานทางการในหน้าต่างใหม่');
                      }}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="เปิดในแท็บใหม่"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 2. All Herbs Directory CSV */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/60 transition-all group">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <FolderTree className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-base font-prompt">
                      2. รายชื่อยาสมุนไพรทั้งหมด (CSV)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      ทะเบียนรายชื่อยาสมุนไพรทั้งหมดในคลัง พร้อมรหัสยา, หมวดหมู่, สรรพคุณ, ขนาดบรรจุ, ล็อตหลัก, วันหมดอายุ, ยอดคงเหลือ และมูลค่าสต๊อก
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        exportWarehouseStructureCSV(herbs);
                        showNotification('ดาวน์โหลดไฟล์ CSV ทะเบียนรายชื่อยาสมุนไพรทั้งหมดเรียบร้อยแล้ว');
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลดรายชื่อยา (.CSV)</span>
                    </button>
                  </div>
                </div>

                {/* 3. Valuation by Category CSV */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/60 transition-all group">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-base font-prompt">
                      3. สรุปมูลค่าคลังแยกตามหมวดหมู่ (CSV)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      รายงานทางการเงินสรุปยอดมูลค่าสินค้าคงคลัง สัดส่วนร้อยละ จำนวนล็อต และสถิติจุดเตือนในแต่ละหมวดหมู่
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        exportInventoryValuationCSV(herbs);
                        showNotification('ดาวน์โหลดไฟล์ CSV รายงานมูลค่าคลังเรียบร้อยแล้ว');
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลดรายงานมูลค่า (.CSV)</span>
                    </button>
                  </div>
                </div>

                {/* 4. Risk & Re-order Audit CSV */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/60 transition-all group">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-base font-prompt">
                      4. ตรวจสอบความเสี่ยงอายุยา &amp; สต๊อกต่ำ (CSV)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      รายการยาที่ต้องเร่งเบิกจ่ายตามหลัก FEFO ยาหมดอายุที่ต้องกักกัน และรายการที่แนะนำให้ออกใบสั่งซื้อ
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        exportRiskAndReorderCSV(herbs);
                        showNotification('ดาวน์โหลดไฟล์ CSV รายงานความเสี่ยงและสั่งซื้อเรียบร้อยแล้ว');
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลดตรวจสอบความเสี่ยง (.CSV)</span>
                    </button>
                  </div>
                </div>

                {/* 5. Complete Inventory Balance CSV */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/60 transition-all group">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-base font-prompt">
                      5. บัญชียอดคงเหลือยาสมุนไพรทุกรายการ (CSV)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      รายละเอียดครบทุกรายการยาและทุกล็อต ทั้งราคา ยอดรับ ยอดจ่าย ยอดคงเหลือ และสรรพคุณ
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        exportStockSummaryCSV(herbs);
                        showNotification('ดาวน์โหลดไฟล์ CSV บัญชียอดคงเหลือเรียบร้อยแล้ว');
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลดยอดคงเหลือ (.CSV)</span>
                    </button>
                  </div>
                </div>

                {/* 6. Complete Warehouse JSON Schema */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/60 transition-all group">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-base font-prompt">
                      6. ฐานข้อมูลรายชื่อยาสมุนไพรทั้งหมด (JSON)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      ไฟล์ข้อมูลทะเบียนรายชื่อยาสมุนไพรทั้งหมดในคลัง พร้อมข้อมูลล็อตการผลิตและสรุปมูลค่าในรูปแบบ JSON ครบถ้วน
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        exportWarehouseHierarchyJSON(herbs);
                        showNotification('ดาวน์โหลดไฟล์ JSON ทะเบียนรายชื่อยาสมุนไพรเรียบร้อยแล้ว');
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลดรายชื่อยา (.JSON)</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Printable Stock Cards Section */}
              <div className="bg-slate-100/80 rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-indigo-700 flex items-center justify-center shadow-xs">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm font-prompt">
                      ต้องการพิมพ์แบบฟอร์มบัตรสต๊อกการ์ด (Stock Card 4 ช่อง/หน้า A4 แนวนอน)?
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      ดาวน์โหลดเป็นไฟล์ PDF ล็อกตำแหน่งตาราง 100% ป้องกันการเคลื่อน หรือสั่งพิมพ์ผ่านเบราว์เซอร์
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={async () => {
                      setIsGeneratingStockCardPdf(true);
                      showNotification('กำลังแปลงและสร้างไฟล์ PDF บัตรสต๊อกการ์ด 4 ช่อง/หน้า (ป้องกันการเคลื่อน)...');
                      const ok = await downloadStockCardPDF(herbs, true);
                      setIsGeneratingStockCardPdf(false);
                      if (ok) {
                        showNotification('ดาวน์โหลดไฟล์ PDF บัตรสต๊อกการ์ด 4 ช่อง/หน้า สำเร็จแล้ว');
                      } else {
                        showNotification('เกิดข้อผิดพลาดในการสร้าง PDF กรุณาสั่งพิมพ์ผ่านเบราว์เซอร์');
                      }
                    }}
                    disabled={isGeneratingStockCardPdf}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingStockCardPdf ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>ดาวน์โหลด PDF (4 ช่อง/หน้า)</span>
                  </button>
                  <button
                    onClick={() => {
                      printStockCardsDirect(herbs, true);
                      showNotification('กำลังเปิดหน้าต่างพิมพ์บัตรสต๊อกการ์ด 4 ช่อง/หน้า');
                    }}
                    className="px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>พิมพ์ผ่านเบราว์เซอร์</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-3.5 flex items-center justify-between text-xs text-slate-500">
          <div>
            <span>รายการสมุนไพรทั้งหมด: <strong>{herbs.length}</strong> รายการ</span>
            <span className="mx-2">|</span>
            <span>จุดจัดเก็บ: <strong>{hierarchy.length}</strong> แห่ง</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
