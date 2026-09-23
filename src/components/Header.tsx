import React from 'react';
import { 
  Leaf, 
  Search,
  Menu,
  ArrowLeftRight,
  PlusCircle,
  FileDown,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { HerbItem } from '../types';
import { AuthRole } from '../utils/authUtils';

interface HeaderProps {
  herbs: HerbItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenQuickTx: () => void;
  onOpenAddHerb?: () => void;
  onOpenRequisitionModal?: () => void;
  onToggleSidebar?: () => void;
  authRole?: AuthRole;
  onLockScreen?: () => void;
  onOpenChangePin?: () => void;
  onOpenUnlock?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenQuickTx,
  onOpenAddHerb,
  onOpenRequisitionModal,
  onToggleSidebar,
  authRole = 'admin',
  onLockScreen,
  onOpenChangePin,
  onOpenUnlock,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs no-print">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between py-2.5 sm:py-3 gap-3">
          
          {/* Left: Mobile hamburger + Brand Title */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 lg:hidden cursor-pointer"
                title="เปิดแถบเมนูหลัก"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-sm shadow-emerald-200 shrink-0">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                    คลังยาสมุนไพร รพ.สต.บ้านท่าคล้อ
                  </h1>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline-block">
                    Stock Card
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal hidden sm:block">
                  ระบบควบคุมและบันทึกสต๊อกการ์ดยาสมุนไพร 41 รายการมาตรฐาน • รพ.สต.บ้านท่าคล้อ
                </p>
              </div>
            </div>
          </div>

          {/* Right: Search Bar & Fast Shortcut */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl justify-end">
            {/* Search Input */}
            <div className="relative w-full max-w-xs sm:max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ค้นหาชื่อยา, รหัส, Lot.No..."
                className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-slate-800 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Record Action Button on Top Bar */}
            <button
              type="button"
              onClick={onOpenQuickTx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
              title="บันทึก รับ-จ่ายยาสมุนไพรด่วน"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span className="hidden sm:inline">รับ - จ่าย</span>
            </button>

            {/* Security / Auth Status & Lock Button */}
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
              {authRole === 'admin' ? (
                <>
                  <button
                    type="button"
                    onClick={onOpenChangePin}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors hidden sm:flex items-center gap-1 text-xs cursor-pointer"
                    title="เปลี่ยนรหัสผ่านเจ้าหน้าที่"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden md:inline text-[11px] font-medium text-slate-600">รหัสผ่าน</span>
                  </button>

                  <button
                    type="button"
                    onClick={onLockScreen}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all cursor-pointer"
                    title="ล็อกหน้าจอทันทีเพื่อป้องกันผู้อื่นแก้ไขข้อมูล"
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">ล็อกระบบ</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onOpenUnlock}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-all cursor-pointer animate-pulse"
                  title="คลิกเพื่อป้อนรหัสผ่านปลดล็อกสิทธิ์แก้ไขข้อมูล"
                >
                  <Unlock className="w-3.5 h-3.5 text-amber-600" />
                  <span>ปลดล็อกแก้ไข</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
