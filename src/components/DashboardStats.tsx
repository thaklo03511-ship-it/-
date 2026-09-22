import React from 'react';
import { 
  Package, 
  Layers, 
  AlertTriangle, 
  Clock, 
  Filter,
  LayoutGrid,
  Table
} from 'lucide-react';
import { HerbCategory, StockSummaryStats, ViewFilter } from '../types';

interface DashboardStatsProps {
  stats: StockSummaryStats;
  currentFilter: ViewFilter;
  onFilterChange: (filter: ViewFilter) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: HerbCategory[];
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  currentFilter,
  onFilterChange,
  selectedCategory,
  onCategoryChange,
  categories,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="space-y-3.5 no-print">
      
      {/* 4 Stat KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Herb Medicines */}
        <button
          type="button"
          onClick={() => onFilterChange('all')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            currentFilter === 'all'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">ยาสมุนไพรทั้งหมด</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              {stats.totalHerbs}
            </span>
            <span className="text-xs text-slate-500">รายการ</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate">
            รวม {stats.totalLots} ล็อตการผลิต
          </p>
        </button>

        {/* Total Stock Volume */}
        <div className="p-3.5 sm:p-4 rounded-2xl border bg-white border-slate-200/80 shadow-2xs text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">ยอดคงเหลือรวม</span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-teal-800 tracking-tight">
              {stats.totalItemsInStock.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">หน่วย</span>
          </div>
          <p className="text-xs text-teal-700 mt-1 truncate">
            รวมทุกรายการและล็อตคงคลัง
          </p>
        </div>

        {/* Low Stock Alert */}
        <button
          type="button"
          onClick={() => onFilterChange('low-stock')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            currentFilter === 'low-stock'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">สต๊อกต่ำกว่าเกณฑ์</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              stats.lowStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${
              stats.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-800'
            }`}>
              {stats.lowStockCount}
            </span>
            <span className="text-xs text-slate-500">รายการ</span>
          </div>
          <p className="text-xs text-amber-700 mt-1 truncate">
            {stats.lowStockCount > 0 ? 'ต้องการจัดซื้อ/เบิกเพิ่ม' : 'ยอดสต๊อกเพียงพอทุกรายการ'}
          </p>
        </button>

        {/* Expiring / Expired Warning */}
        <button
          type="button"
          onClick={() => onFilterChange(stats.expiredCount > 0 ? 'expired' : 'expiring')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            currentFilter === 'expiring' || currentFilter === 'expired'
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">เตือนวันหมดอายุ</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              stats.expiringCount > 0 || stats.expiredCount > 0
                ? 'bg-rose-100 text-rose-700'
                : 'bg-slate-100 text-slate-500'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${
              stats.expiringCount > 0 || stats.expiredCount > 0 ? 'text-rose-600' : 'text-slate-800'
            }`}>
              {stats.expiringCount + stats.expiredCount}
            </span>
            <span className="text-xs text-slate-500">ล็อต</span>
          </div>
          <p className="text-xs text-rose-600 mt-1 truncate">
            {stats.expiredCount > 0
              ? `หมดอายุแล้ว ${stats.expiredCount} ล็อต`
              : stats.expiringCount > 0
                ? `ใกล้หมดอายุ ${stats.expiringCount} ล็อต (จ่ายก่อน)`
                : 'อายุยาทุกรายการปกติ'}
          </p>
        </button>

      </div>

      {/* Filter and View Mode Toolbar */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              currentFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({stats.totalHerbs})
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('low-stock')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              currentFilter === 'low-stock'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            สต๊อกต่ำ ({stats.lowStockCount})
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('expiring')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              currentFilter === 'expiring'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            ใกล้หมดอายุ ({stats.expiringCount})
          </button>

          {stats.expiredCount > 0 && (
            <button
              type="button"
              onClick={() => onFilterChange('expired')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                currentFilter === 'expired'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300'
              }`}
            >
              หมดอายุแล้ว ({stats.expiredCount})
            </button>
          )}
        </div>

        {/* Category Filter & View Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 pr-7 text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer appearance-none"
            >
              <option value="all">ทุกหมวดหมู่สมุนไพร</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Filter className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* View Mode Switcher (Grid vs Table) */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="มุมมองการ์ด (เหมาะกับมือถือ)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="มุมมองตาราง (เหมาะกับเดสก์ท็อป)"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
