import React from 'react';
import { 
  FileText, 
  ArrowLeftRight, 
  Printer, 
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { HerbItem } from '../types';
import { getHerbTotalStock, getActiveLot, getExpiryStatus, formatDateThai, getLotBalance } from '../utils/stockUtils';

interface HerbTableViewProps {
  herbs: HerbItem[];
  onOpenCard: (herb: HerbItem) => void;
  onQuickTx: (herb: HerbItem) => void;
  onPrintSingle: (herb: HerbItem) => void;
}

export const HerbTableView: React.FC<HerbTableViewProps> = ({
  herbs,
  onOpenCard,
  onQuickTx,
  onPrintSingle,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600">
              <th className="py-3 px-3.5 text-center w-12">ลำดับ</th>
              <th className="py-3 px-3.5 min-w-[220px]">ชื่อยาสมุนไพร</th>
              <th className="py-3 px-3 hidden sm:table-cell">หมวดหมู่</th>
              <th className="py-3 px-3">ขนาดบรรจุ</th>
              <th className="py-3 px-3 font-mono">Lot.No</th>
              <th className="py-3 px-3">วันหมดอายุ</th>
              <th className="py-3 px-3 text-right">ราคา/หน่วย</th>
              <th className="py-3 px-3.5 text-right font-bold">คงเหลือ</th>
              <th className="py-3 px-3.5 text-center w-36">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {herbs.map((herb, index) => {
              const totalStock = getHerbTotalStock(herb);
              const activeLot = getActiveLot(herb);
              const isLowStock = totalStock <= herb.minStockAlert;
              const expStatus = activeLot ? getExpiryStatus(activeLot.expDate) : null;

              return (
                <tr 
                  key={herb.id} 
                  className={`hover:bg-slate-50/70 transition-colors ${
                    isLowStock ? 'bg-amber-50/20' : ''
                  }`}
                >
                  {/* Row index */}
                  <td className="py-3 px-3 text-center text-xs text-slate-400 font-mono">
                    {index + 1}
                  </td>

                  {/* Herb Name */}
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenCard(herb)}
                        className="font-semibold text-slate-900 hover:text-emerald-700 text-left transition-colors cursor-pointer"
                      >
                        {herb.name}
                      </button>
                      {isLowStock && (
                        <span 
                          className="inline-flex text-amber-600" 
                          title={`สต๊อกต่ำกว่าเกณฑ์ (${herb.minStockAlert} ${herb.defaultUnit})`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        </span>
                      )}
                    </div>
                    {herb.indications && (
                      <span className="text-xs text-slate-400 block truncate max-w-xs">
                        {herb.indications}
                      </span>
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-3 px-3 hidden sm:table-cell text-xs text-slate-500">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/50">
                      {herb.category}
                    </span>
                  </td>

                  {/* Packaging */}
                  <td className="py-3 px-3 text-xs text-slate-600">
                    {activeLot?.packaging || herb.defaultPackaging || '-'}
                  </td>

                  {/* Lot.No */}
                  <td className="py-3 px-3 font-mono text-xs text-slate-800">
                    {activeLot?.lotNo ? activeLot.lotNo : '-'}
                  </td>

                  {/* Exp Date with status */}
                  <td className="py-3 px-3 text-xs">
                    {activeLot?.expDate && expStatus ? (
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${expStatus.badgeClass}`}>
                        {formatDateThai(activeLot.expDate)}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Unit price */}
                  <td className="py-3 px-3 text-right text-xs font-mono text-slate-700">
                    {activeLot?.unitPrice && activeLot.unitPrice > 0 ? `${activeLot.unitPrice} ฿` : '-'}
                  </td>

                  {/* Balance */}
                  <td className="py-3 px-3.5 text-right">
                    <span className={`font-bold font-heading text-base ${
                      isLowStock ? 'text-amber-600' : 'text-emerald-700'
                    }`}>
                      {totalStock.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">
                      {herb.defaultUnit}
                    </span>
                  </td>

                  {/* Action buttons */}
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onQuickTx(herb)}
                        className="px-2 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                        title="บันทึกรับ-จ่าย"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5 inline mr-1" />
                        รับ/จ่าย
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenCard(herb)}
                        className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        title="เปิดดู Stock Card"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onPrintSingle(herb)}
                        className="p-1 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                        title="พิมพ์ Stock Card"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
