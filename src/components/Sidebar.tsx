import React from 'react';
import {
  ArrowLeftRight,
  PlusCircle,
  FileDown,
  Building2,
  Printer,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Package,
  Layers,
  AlertTriangle,
  Clock,
  LayoutGrid,
  Table,
  CheckCircle2,
  X,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { ViewFilter, HerbCategory, StockSummaryStats } from '../types';
import { AuthRole } from '../utils/authUtils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  // Primary Action triggers
  onOpenQuickTx: () => void;
  onOpenAddHerb: () => void;
  onOpenRequisitionModal: () => void;
  onOpenInventoryReport: () => void;
  onOpenPrintView: () => void;
  onOpenExportModal: () => void;
  onExportCSV: () => void;
  onResetData: () => void;
  onClearAllHistory?: () => void;
  // Filters & Stats
  stats: StockSummaryStats;
  currentFilter: ViewFilter;
  onFilterChange: (filter: ViewFilter) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: HerbCategory[];
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  // Auth & Security
  authRole?: AuthRole;
  onLockScreen?: () => void;
  onOpenChangePin?: () => void;
  onOpenUnlock?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onOpenQuickTx,
  onOpenAddHerb,
  onOpenRequisitionModal,
  onOpenInventoryReport,
  onOpenPrintView,
  onOpenExportModal,
  onExportCSV,
  onResetData,
  onClearAllHistory,
  stats,
  currentFilter,
  onFilterChange,
  selectedCategory,
  onCategoryChange,
  categories,
  viewMode,
  onViewModeChange,
  isCollapsed = false,
  onToggleCollapse,
  authRole = 'admin',
  onLockScreen,
  onOpenChangePin,
  onOpenUnlock,
}) => {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200/90 shadow-xl lg:shadow-none transition-all duration-300 ease-in-out lg:static lg:z-10 no-print ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'w-72 lg:w-64 xl:w-72'}`}
      >
        {/* Sidebar Header / Brand */}
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-bold text-slate-900 text-sm tracking-tight truncate">คลังยาสมุนไพร</h2>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-emerald-100 text-emerald-800">
                    รพ.สต.
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate font-medium">รพ.สต.บ้านท่าคล้อ</p>
              </div>
            )}
          </div>

          {/* Close for mobile, toggle for desktop */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden cursor-pointer"
              title="ปิดเมนู"
            >
              <X className="w-5 h-5" />
            </button>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                title={isCollapsed ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {/* Section 1: Quick Primary Operations */}
          <div>
            {!isCollapsed && (
              <div className="px-2 mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">การทำงานหลัก</span>
              </div>
            )}

            <div className="space-y-1.5">
              {/* Button 1: Quick Transaction */}
              <button
                id="btn-sidebar-quick-tx"
                type="button"
                onClick={() => {
                  onOpenQuickTx();
                  onClose();
                }}
                className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:from-emerald-800 active:to-teal-800 shadow-sm transition-all cursor-pointer ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
                title="บันทึก รับ - จ่ายยาสมุนไพร"
              >
                <ArrowLeftRight className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                {!isCollapsed && <span className="truncate">บันทึก รับ - จ่าย</span>}
              </button>

              {/* Button 2: Add Herb */}
              <button
                id="btn-sidebar-add-herb"
                type="button"
                onClick={() => {
                  onOpenAddHerb();
                  onClose();
                }}
                className={`w-full group flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs sm:text-sm text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-colors cursor-pointer ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
                title="เพิ่มยาสมุนไพรรายการใหม่"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600 shrink-0 transition-transform group-hover:scale-110" />
                {!isCollapsed && <span className="truncate">เพิ่มยาใหม่</span>}
              </button>

              {/* Button 3: Requisition Slip (PDF) */}
              <button
                id="btn-sidebar-requisition"
                type="button"
                onClick={() => {
                  onOpenRequisitionModal();
                  onClose();
                }}
                className={`w-full group flex items-center gap-3 px-3 py-2 rounded-xl font-semibold text-xs sm:text-sm text-teal-900 bg-teal-50/80 hover:bg-teal-100 border border-teal-200/90 shadow-2xs transition-colors cursor-pointer ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
                title="สร้างใบเบิกยาทางการ & ดาวน์โหลด PDF ล็อกหน้า"
              >
                <FileDown className="w-4 h-4 text-teal-700 shrink-0 transition-transform group-hover:scale-110" />
                {!isCollapsed && (
                  <div className="flex items-center justify-between w-full truncate">
                    <span className="truncate">ใบเบิกยา (PDF)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-200/70 text-teal-900 font-bold shrink-0">
                      PDF
                    </span>
                  </div>
                )}
              </button>

              {/* Button 4: Inventory Report & Warehouse */}
              <button
                id="btn-sidebar-inventory-report"
                type="button"
                onClick={() => {
                  onOpenInventoryReport();
                  onClose();
                }}
                className={`w-full group flex items-center gap-3 px-3 py-2 rounded-xl font-semibold text-xs sm:text-sm text-indigo-900 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200/80 shadow-2xs transition-colors cursor-pointer ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
                title="รายงานสรุปมูลค่าคลัง & ผังจัดเก็บ"
              >
                <Building2 className="w-4 h-4 text-indigo-700 shrink-0 transition-transform group-hover:scale-110" />
                {!isCollapsed && <span className="truncate">รายงาน &amp; ผังคลัง</span>}
              </button>

              {/* Button 5: Print Stock Cards (PDF 4 Slots) */}
              <button
                id="btn-sidebar-print-view"
                type="button"
                onClick={() => {
                  onOpenPrintView();
                  onClose();
                }}
                className={`w-full group flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs sm:text-sm text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-colors cursor-pointer ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
                title="พิมพ์บัตรสต๊อกการ์ด 4 ช่อง/หน้า & ดาวน์โหลด PDF"
              >
                <Printer className="w-4 h-4 text-indigo-600 shrink-0 transition-transform group-hover:scale-110" />
                {!isCollapsed && (
                  <div className="flex items-center justify-between w-full truncate">
                    <span className="truncate">พิมพ์ Stock Card</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold shrink-0">
                      4 ช่อง
                    </span>
                  </div>
                )}
              </button>

              {/* Button 6: Export CSV & Backup */}
              <button
                id="btn-sidebar-export-backup"
                type="button"
                onClick={() => {
                  onOpenExportModal();
                  onClose();
                }}
                className={`w-full group flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs sm:text-sm text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 shadow-2xs transition-colors cursor-pointer ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
                title="ส่งออกไฟล์ CSV และสำรองข้อมูล"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0 transition-transform group-hover:scale-110" />
                {!isCollapsed && <span className="truncate">ส่งออก CSV / สำรอง</span>}
              </button>
            </div>
          </div>

          {/* Section 2: Filters & Views */}
          {!isCollapsed && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="px-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">ตัวกรองสถานะ</span>
              </div>

              {/* Filter Buttons */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => onFilterChange('all')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    currentFilter === 'all'
                      ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${currentFilter === 'all' ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                    <span>ยาทั้งหมด</span>
                  </div>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {stats.totalHerbs}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onFilterChange('low-stock')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    currentFilter === 'low-stock'
                      ? 'bg-amber-50 text-amber-800 font-bold border border-amber-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>สต๊อกต่ำกว่าเกณฑ์</span>
                  </div>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                    stats.lowStockCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {stats.lowStockCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onFilterChange('expiring')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    currentFilter === 'expiring'
                      ? 'bg-rose-50 text-rose-800 font-bold border border-rose-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-rose-500" />
                    <span>ใกล้หมดอายุ (&lt;90 วัน)</span>
                  </div>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                    stats.expiringCount > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {stats.expiringCount}
                  </span>
                </button>

                {stats.expiredCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onFilterChange('expired')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      currentFilter === 'expired'
                        ? 'bg-rose-100 text-rose-900 font-bold border border-rose-300'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                      <span>หมดอายุแล้ว</span>
                    </div>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-rose-200 text-rose-900 font-bold">
                      {stats.expiredCount}
                    </span>
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 px-2 block">
                  หมวดหมู่ยา
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">ทุกหมวดหมู่ ({stats.totalHerbs} ชนิด)</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 px-2 block">
                  รูปแบบการแสดงผล
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => onViewModeChange('grid')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>การ์ด</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewModeChange('table')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>ตาราง</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Extra Utilities */}
          {!isCollapsed && (
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 px-2 block">
                เครื่องมือสำรอง &amp; รีเซ็ต
              </span>

              <button
                type="button"
                onClick={onExportCSV}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-left"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>ดาวน์โหลดสรุป CSV ด่วน</span>
              </button>

              <button
                type="button"
                onClick={onResetData}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-left"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>รีเซ็ตค่าเริ่มต้น (41 รายการ)</span>
              </button>

              {onClearAllHistory && (
                <button
                  type="button"
                  onClick={onClearAllHistory}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-left font-medium"
                  title="ลบประวัติรับ-จ่าย เลขที่ Lot วันหมดอายุ ขนาดบรรจุ และราคาต่อหน่วยเป็น 0 ทั้งหมดเพื่อเริ่มระบบจริง"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                  <span>ล้างประวัติ &amp; Lot เป็น 0 (เริ่มระบบจริง)</span>
                </button>
              )}
            </div>
          )}

          {/* Section 4: Security & Lock */}
          {!isCollapsed && (
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 px-2 block">
                ความปลอดภัย &amp; รหัสผ่าน
              </span>

              {authRole === 'admin' ? (
                <div className="mx-1 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>สิทธิ์เจ้าหน้าที่ (แก้ไขได้)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {onOpenChangePin && (
                      <button
                        type="button"
                        onClick={onOpenChangePin}
                        className="py-1 px-2 rounded-lg bg-white hover:bg-slate-50 border border-emerald-200 text-slate-700 font-medium text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <KeyRound className="w-3 h-3 text-emerald-600" />
                        <span>เปลี่ยนรหัส</span>
                      </button>
                    )}
                    {onLockScreen && (
                      <button
                        type="button"
                        onClick={onLockScreen}
                        className="py-1 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Lock className="w-3 h-3" />
                        <span>ล็อกหน้าจอ</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mx-1 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-800 font-semibold">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>โหมดดูข้อมูลอย่างเดียว</span>
                  </div>
                  <p className="text-[10px] text-amber-700 leading-tight">
                    ป้องกันบุคคลภายนอกแก้ไขข้อมูล ต้องใช้รหัสผ่านเจ้าหน้าที่เพื่อปลดล็อก
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {onOpenUnlock && (
                      <button
                        type="button"
                        onClick={onOpenUnlock}
                        className="py-1 px-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Unlock className="w-3 h-3" />
                        <span>ปลดล็อก</span>
                      </button>
                    )}
                    {onLockScreen && (
                      <button
                        type="button"
                        onClick={onLockScreen}
                        className="py-1 px-2 rounded-lg bg-white hover:bg-slate-50 border border-amber-200 text-slate-700 font-medium text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Lock className="w-3 h-3 text-slate-500" />
                        <span>ล็อกระบบ</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        {!isCollapsed && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-[11px] text-slate-500 shrink-0">
            <div className="flex items-center justify-between">
              <span>ฐานข้อมูลในเครื่อง</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3 h-3" /> ออนไลน์
              </span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
