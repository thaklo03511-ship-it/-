import React from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  X, 
  CheckCircle, 
  ShieldAlert, 
  Package, 
  Info 
} from 'lucide-react';
import { HerbItem } from '../types';
import { getHerbTotalStock } from '../utils/stockUtils';

interface DeleteHerbModalProps {
  isOpen: boolean;
  herb: HerbItem | null;
  onClose: () => void;
  onConfirmDelete: (herb: HerbItem) => void;
}

export const DeleteHerbModal: React.FC<DeleteHerbModalProps> = ({
  isOpen,
  herb,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !herb) return null;

  const totalStock = getHerbTotalStock(herb);
  const isZeroStock = totalStock === 0;
  const lotCount = herb.lots.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn no-print">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center gap-2.5 text-rose-700">
            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-base">
                ยืนยันการลบรายการยา
              </h3>
              <p className="text-xs text-rose-700">
                {isZeroStock ? 'ลบยาที่ไม่ได้ใช้ (สต๊อก 0)' : 'นำรายการยาออกจากระบบคลัง'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          
          {/* Herb Details Card */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                {herb.category}
              </span>
              {herb.code && (
                <span className="text-xs font-mono text-slate-400">
                  รหัส: {herb.code}
                </span>
              )}
            </div>

            <h4 className="font-bold text-slate-900 text-base leading-snug">
              {herb.name}
            </h4>

            {herb.indications && (
              <p className="text-xs text-slate-500 line-clamp-2">
                สรรพคุณ: {herb.indications}
              </p>
            )}

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">ยอดคงเหลือในระบบ:</span>
              <span className={`font-bold font-heading text-sm ${
                isZeroStock ? 'text-slate-500' : 'text-amber-600'
              }`}>
                {totalStock.toLocaleString()} {herb.defaultUnit || 'หน่วย'}
              </span>
            </div>
          </div>

          {/* Condition Notification */}
          {isZeroStock ? (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">
                  ยานี้มียอดสต๊อกคงเหลือ 0 (ไม่ได้ใช้แล้ว)
                </strong>
                <span>
                  ท่านสามารถลบรายการยานี้ออกจากระบบได้อย่างปลอดภัย เพื่อลดความสับสนและไม่ให้แสดงในรายการบัตรสต๊อกการ์ด
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">
                  คำเตือน: ยังมียอดสต๊อกคงเหลือ {totalStock.toLocaleString()} {herb.defaultUnit}
                </strong>
                <span>
                  ยารายการนี้มีข้อมูล {lotCount} ล็อต หากยืนยันลบ ข้อมูลประวัติการรับ-จ่ายทั้งหมดของยานี้จะถูกลบออกจากเครื่องทันที
                </span>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500 text-center">
            คุณแน่ใจหรือไม่ว่าต้องการลบรายการยานี้ออกจากระบบ?
          </p>
        </div>

        {/* Modal Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => onConfirmDelete(herb)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>ยืนยันลบรายการยานี้</span>
          </button>
        </div>
      </div>
    </div>
  );
};
