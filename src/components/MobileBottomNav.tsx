import React from 'react';
import { 
  Package, 
  AlertTriangle, 
  Menu, 
  ArrowLeftRight,
  FileDown
} from 'lucide-react';
import { ViewFilter } from '../types';

interface MobileBottomNavProps {
  currentFilter: ViewFilter;
  onFilterChange: (filter: ViewFilter) => void;
  lowStockCount: number;
  expiringCount: number;
  onOpenQuickTx: () => void;
  onToggleSidebar?: () => void;
  onOpenRequisitionModal?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentFilter,
  onFilterChange,
  lowStockCount,
  onOpenQuickTx,
  onToggleSidebar,
  onOpenRequisitionModal,
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 flex items-center justify-around shadow-lg no-print">
      {/* Menu / Sidebar button */}
      {onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5 text-emerald-700" />
          <span className="text-[10px] font-semibold text-emerald-800">เมนูหลัก</span>
        </button>
      )}

      {/* All Herbs */}
      <button
        type="button"
        onClick={() => onFilterChange('all')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
          currentFilter === 'all' ? 'text-emerald-700 font-semibold' : 'text-slate-500'
        }`}
      >
        <Package className="w-5 h-5" />
        <span className="text-[10px]">ทั้งหมด</span>
      </button>

      {/* Center Floating Quick Transaction Button */}
      <button
        type="button"
        onClick={onOpenQuickTx}
        className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/40 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
        title="บันทึกรับ-จ่ายด่วน"
      >
        <ArrowLeftRight className="w-5 h-5" />
      </button>

      {/* Low Stock Warning */}
      <button
        type="button"
        onClick={() => onFilterChange('low-stock')}
        className={`relative flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
          currentFilter === 'low-stock' ? 'text-amber-600 font-semibold' : 'text-slate-500'
        }`}
      >
        <AlertTriangle className="w-5 h-5" />
        <span className="text-[10px]">สต๊อกต่ำ</span>
        {lowStockCount > 0 && (
          <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
            {lowStockCount}
          </span>
        )}
      </button>

      {/* Requisition Slip (PDF) */}
      {onOpenRequisitionModal && (
        <button
          type="button"
          onClick={onOpenRequisitionModal}
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-teal-700 hover:text-teal-900 transition-colors cursor-pointer"
          title="สร้างใบเบิกยา PDF"
        >
          <FileDown className="w-5 h-5 text-teal-700" />
          <span className="text-[10px] font-medium">ใบเบิก</span>
        </button>
      )}
    </div>
  );
};
