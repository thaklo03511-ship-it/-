import React, { useRef, useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  HardDrive, 
  Calendar,
  Layers,
  ArrowDownToLine,
  Info,
  FolderTree,
  BarChart3,
  FileText,
  ShieldAlert
} from 'lucide-react';
import { HerbItem } from '../types';
import { 
  exportStockSummaryCSV, 
  exportStockTransactionsCSV, 
  exportJSONBackup,
  exportWarehouseStructureCSV,
  exportInventoryValuationCSV,
  exportRiskAndReorderCSV,
  downloadExecutiveReportHTML,
  downloadHerbStockImportTemplate,
  parseRealStockCSV
} from '../utils/stockUtils';

interface ExportBackupModalProps {
  herbs: HerbItem[];
  onClose: () => void;
  onImportData: (data: HerbItem[]) => void;
  onResetData: () => void;
  onClearAllHistory?: () => void;
}

export const ExportBackupModal: React.FC<ExportBackupModalProps> = ({
  herbs,
  onClose,
  onImportData,
  onResetData,
  onClearAllHistory,
}) => {
  const [copiedNotification, setCopiedNotification] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvStockInputRef = useRef<HTMLInputElement>(null);

  const totalLots = herbs.reduce((acc, h) => acc + h.lots.length, 0);
  const totalTransactions = herbs.reduce((acc, h) => {
    return acc + h.lots.reduce((lAcc, l) => lAcc + (l.transactions?.length || 0), 0);
  }, 0);

  const handleExportSummaryCSV = () => {
    exportStockSummaryCSV(herbs);
    showNotice('ส่งออกไฟล์ CSV สรุปสต๊อกเรียบร้อยแล้ว');
  };

  const handleExportLedgerCSV = () => {
    exportStockTransactionsCSV(herbs);
    showNotice('ส่งออกไฟล์ CSV ประวัติรับ-จ่ายเรียบร้อยแล้ว');
  };

  const handleExportJSON = () => {
    exportJSONBackup(herbs);
    showNotice('ดาวน์โหลดไฟล์สำรองข้อมูล JSON เรียบร้อยแล้ว');
  };

  const showNotice = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(''), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json) && json.length > 0) {
          onImportData(json);
          showNotice(`นำเข้าข้อมูลสำเร็จแล้ว (${json.length} รายการ)`);
          setTimeout(onClose, 1200);
        } else {
          alert('โครงสร้างไฟล์ JSON ไม่ถูกต้องสำหรับระบบ Stock Card');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ กรุณาตรวจสอบว่าเป็นไฟล์ JSON ที่ถูกต้อง');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCsvStockFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = parseRealStockCSV(text, herbs);
        if (result.successCount > 0) {
          onImportData(result.updatedHerbs);
          let msg = `นำเข้าสต๊อกยาจริงสำเร็จ ${result.successCount} รายการ`;
          if (result.errors.length > 0) {
            msg += ` (พบข้อผิดพลาด ${result.errors.length} รายการ)`;
          }
          showNotice(msg);
          alert(`นำเข้าสต๊อกยาจริงสำเร็จเรียบร้อยแล้ว (${result.successCount} รายการ)${result.errors.length > 0 ? '\n\nหมายเหตุ:\n' + result.errors.slice(0, 5).join('\n') : ''}`);
          setTimeout(onClose, 800);
        } else {
          alert('ไม่พบรายการยาที่สามารถนำเข้าได้ กรุณาตรวจสอบว่าใช้ไฟล์แบบฟอร์มที่ถูกต้อง:\n' + (result.errors[0] || ''));
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการประมวลผลไฟล์ CSV กรุณาตรวจสอบไฟล์');
      }
    };
    reader.readAsText(file);
    if (csvStockInputRef.current) csvStockInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-base">
                ส่งออก CSV และสำรองข้อมูลสต๊อก (Data Backup)
              </h3>
              <p className="text-xs text-slate-500">
                ดาวน์โหลดไฟล์ข้อมูลเก็บไว้ในเครื่องคอมพิวเตอร์ของคุณแบบออฟไลน์
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notice */}
        {copiedNotification && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{copiedNotification}</span>
          </div>
        )}

        {/* Content body */}
        <div className="p-4 sm:p-6 space-y-4">
          
          {/* Overview badges */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div>
              <span className="text-[11px] text-slate-500 block">ยาสมุนไพรในระบบ</span>
              <span className="text-base font-bold text-slate-800">{herbs.length} รายการ</span>
            </div>
            <div className="border-x border-slate-200">
              <span className="text-[11px] text-slate-500 block">ล็อตการผลิต</span>
              <span className="text-base font-bold text-slate-800">{totalLots} ล็อต</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">ประวัติรับ-จ่าย</span>
              <span className="text-base font-bold text-emerald-700">{totalTransactions} รายการ</span>
            </div>
          </div>

          {/* Option 1: Current Stock Summary CSV */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h4 className="font-semibold text-slate-900 text-sm">
                  1. ส่งออกไฟล์ CSV สรุปยอดสต๊อกคงเหลือปัจจุบัน
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                รวมรายชื่อยาสมุนไพรทุกล็อต, วันหมดอายุ, ยอดยกมา, ยอดรับ-จ่ายสะสม, ยอดคงเหลือ, มูลค่าคงเหลือ (บาท) และสถานที่เก็บ (รองรับภาษาไทยใน Microsoft Excel)
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportSummaryCSV}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด CSV</span>
            </button>
          </div>

          {/* Option 2: Transaction Movement Ledger CSV */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h4 className="font-semibold text-slate-900 text-sm">
                  2. ส่งออกไฟล์ CSV ประวัติการเคลื่อนไหว รับ-จ่าย ทั้งหมด
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                บันทึกบัญชีคุมสต๊อกการ์ดย้อนหลังทุกรายการ (วัน เดือน ปี, ยกมา, รับใหม่, จ่าย, คงเหลือ, ผู้เบิก/ผู้จ่าย และหมายเหตุ) เหมาะสำหรับรายงานประจำเดือน
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportLedgerCSV}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด Ledger CSV</span>
            </button>
          </div>

          {/* Option 3: Warehouse Location Structure CSV */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-teal-300 bg-white hover:bg-teal-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <FolderTree className="w-4 h-4 text-teal-600" />
                <h4 className="font-semibold text-slate-900 text-sm">
                  3. ส่งออกโครงสร้างผังคลังและสถานที่จัดเก็บ (Warehouse Layout CSV)
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                จำแนกโซนจัดเก็บ A-E, ชั้นวาง, ช่องจัดเก็บ, อุณหภูมิควบคุม, สถานะความจุ และมูลค่าคงเหลือประจำจุด
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                exportWarehouseStructureCSV(herbs);
                showNotice('ดาวน์โหลดผังโครงสร้างคลังยาสมุนไพร CSV สำเร็จ');
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด ผังคลัง CSV</span>
            </button>
          </div>

          {/* Option 4: Category Valuation & Executive Summary */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold text-slate-900 text-sm">
                  4. สรุปมูลค่าคลังแยกตามหมวดหมู่ &amp; รายงานผู้บริหาร
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                รายงานมูลค่าสินทรัพย์ยาแยกตามหมวดหมู่ พร้อมรายงานสรุปทางการ (HTML / PDF) พร้อมสั่งพิมพ์
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  exportInventoryValuationCSV(herbs);
                  showNotice('ส่งออกสรุปมูลค่าคลัง CSV สำเร็จ');
                }}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>มูลค่า CSV</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadExecutiveReportHTML(herbs);
                  showNotice('ดาวน์โหลดเอกสารรายงานผู้บริหารเรียบร้อย');
                }}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>รายงานสรุป (HTML)</span>
              </button>
            </div>
          </div>

          {/* Option 3: Full JSON System Backup & Restore */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-indigo-600" />
                <h4 className="font-semibold text-slate-900 text-sm">
                  3. สำรองข้อมูลระบบแบบสมบูรณ์ (Full JSON Backup & Restore)
                </h4>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              สำรองโครงสร้างข้อมูลทั้งหมดเพื่อนำไปเปิดในเครื่องอื่น หรือเก็บสำรองป้องกันข้อมูลสูญหาย
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportJSON}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลด JSON Backup</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>นำเข้าไฟล์สำรอง (Restore)</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>

          {/* Option 4: Real Stock CSV Batch Import & Template */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <h4 className="font-semibold text-emerald-950 text-sm">
                  4. นำเข้าสต๊อกยาจริงผ่านไฟล์ CSV / Excel (Batch Real Stock Import)
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                แนะนำสำหรับยาจริง
              </span>
            </div>
            <p className="text-xs text-emerald-900/80 leading-relaxed">
              ดาวน์โหลดแบบฟอร์ม 41 รายการสมุนไพรไปกรอกเลขที่ Lot, วันหมดอายุ และจำนวนรับเข้าจริงใน Excel แล้วอัปโหลดกลับเข้ามาในระบบได้ทันที
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => downloadHerbStockImportTemplate(herbs)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>ดาวน์โหลดแบบฟอร์ม CSV สต๊อกยาจริง</span>
              </button>

              <button
                type="button"
                onClick={() => csvStockInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>นำเข้าไฟล์ CSV สต๊อกยาจริง</span>
              </button>
              <input
                type="file"
                ref={csvStockInputRef}
                onChange={handleCsvStockFileChange}
                accept=".csv"
                className="hidden"
              />
            </div>
          </div>

          {/* Option 5: Reset All Histories, Lots, and Stock to 0 */}
          {onClearAllHistory && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <h4 className="font-semibold text-rose-950 text-sm">
                    5. ลบประวัติ, Lot.No, วันหมดอายุ, ขนาดบรรจุ, ราคา/หน่วย เป็น 0 (เพื่อเริ่มระบบจริง)
                  </h4>
                </div>
              </div>
              <p className="text-xs text-rose-800/80 leading-relaxed">
                ล้างประวัติรับ-จ่าย, เลขที่ Lot, วันหมดอายุ, ขนาดบรรจุ และราคาต่อหน่วยให้ว่างเปล่าเป็น 0 ทันที โดยรายชื่อยาสมุนไพร 41 ชนิดและข้อมูลพื้นฐานจะยังคงอยู่ครบถ้วน เพื่อให้พร้อมสำหรับเริ่มใช้งานระบบจริง
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClearAllHistory();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ยืนยันลบประวัติและข้อมูลล็อตเป็น 0 (เริ่มระบบจริง)</span>
                </button>
              </div>
            </div>
          )}

          {/* Reset button note */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onResetData();
                onClose();
              }}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>คืนค่าข้อมูลเริ่มต้น 41 รายการสมุนไพรตามเอกสาร</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              ปิด
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
