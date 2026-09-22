import React from 'react';
import { 
  FileText, 
  ArrowLeftRight, 
  Calendar, 
  AlertTriangle, 
  Tag, 
  Boxes,
  Printer,
  ChevronRight,
  Info
} from 'lucide-react';
import { HerbItem } from '../types';
import { getHerbTotalStock, getActiveLot, getExpiryStatus, formatDateThai, getLotBalance } from '../utils/stockUtils';

interface HerbCardProps {
  herb: HerbItem;
  onOpenCard: (herb: HerbItem) => void;
  onQuickTx: (herb: HerbItem) => void;
  onPrintSingle: (herb: HerbItem) => void;
}

export const HerbCard: React.FC<HerbCardProps> = ({
  herb,
  onOpenCard,
  onQuickTx,
  onPrintSingle,
}) => {
  const totalStock = getHerbTotalStock(herb);
  const activeLot = getActiveLot(herb);
  const isLowStock = totalStock <= herb.minStockAlert;
  const activeLotBalance = activeLot ? getLotBalance(activeLot) : 0;
  const expiryInfo = activeLot ? getExpiryStatus(activeLot.expDate) : null;

  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
      isLowStock 
        ? 'border-amber-200/90 hover:border-amber-300' 
        : 'border-slate-200/90 hover:border-emerald-300'
    }`}>
      {/* Card Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60 truncate max-w-[180px]">
            {herb.category}
          </span>
          {isLowStock && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
              <AlertTriangle className="w-3 h-3" /> สต๊อกต่ำ
            </span>
          )}
        </div>

        {/* Medicine Name */}
        <h3 
          onClick={() => onOpenCard(herb)}
          className="font-heading font-semibold text-base sm:text-lg text-slate-900 leading-snug cursor-pointer hover:text-emerald-700 transition-colors line-clamp-2"
          title={herb.name}
        >
          {herb.name}
        </h3>

        {/* Indications or notes */}
        {herb.indications && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-1 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{herb.indications}</span>
          </p>
        )}
      </div>

      {/* Card Body: Lot Info & Stock Balance */}
      <div className="px-4 py-3 bg-slate-50/70 border-y border-slate-100 space-y-2.5">
        {/* Active Lot details */}
        {activeLot ? (
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Lot.No:</span>
              <span className="font-mono font-medium text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {activeLot.lotNo || '-'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">วันหมดอายุ:</span>
              {activeLot.expDate ? (
                <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium border ${expiryInfo?.badgeClass}`}>
                  {formatDateThai(activeLot.expDate)}
                </span>
              ) : (
                <span className="text-slate-400 text-[11px]">-</span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">ขนาดบรรจุ:</span>
              <span className="font-medium text-slate-800">
                {activeLot.packaging || herb.defaultPackaging || '-'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">ราคา/หน่วย:</span>
              <span className="font-medium text-slate-800">
                {activeLot.unitPrice && activeLot.unitPrice > 0 ? `${activeLot.unitPrice} บาท` : '-'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic text-center py-2">
            ยังไม่มีข้อมูลล็อตการผลิต
          </p>
        )}

        {/* Stock Balance Highlight */}
        <div className="pt-2 border-t border-slate-200/60 flex items-end justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">
              ยอดคงเหลือรวม
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold font-heading ${
                isLowStock ? 'text-amber-600' : 'text-emerald-700'
              }`}>
                {totalStock.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">
                {herb.defaultUnit || 'หน่วย'}
              </span>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-400">
            <span>เกณฑ์เตือน: {herb.minStockAlert} {herb.defaultUnit}</span>
            {herb.lots.length > 1 && (
              <span className="block text-slate-500 font-medium">
                ({herb.lots.length} ล็อต)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="p-3 bg-white rounded-b-xl flex items-center justify-between gap-1.5">
        <button
          type="button"
          onClick={() => onQuickTx(herb)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600" />
          <span>รับ / จ่าย</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenCard(herb)}
          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-slate-600" />
          <span>ดูบัตรสต๊อก</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => onPrintSingle(herb)}
          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="พิมพ์ Stock Card ของสมุนไพรนี้"
        >
          <Printer className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
