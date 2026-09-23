import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  KeyRound, 
  AlertCircle, 
  ShieldCheck 
} from 'lucide-react';
import { verifyPin, saveAuthSession } from '../utils/authUtils';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: () => void;
  actionTitle?: string;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({
  isOpen,
  onClose,
  onUnlocked,
  actionTitle = 'แก้ไขข้อมูลในระบบ',
}) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('กรุณากรอกรหัสผ่านเจ้าหน้าที่');
      return;
    }

    if (verifyPin(pin)) {
      saveAuthSession('admin', true);
      onUnlocked();
      onClose();
      setPin('');
      setErrorMsg('');
    } else {
      setErrorMsg('รหัสผ่านไม่ถูกต้อง (รหัสเริ่มต้น: 1234)');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Lock className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">ต้องการสิทธิ์เจ้าหน้าที่</h3>
              <p className="text-[11px] text-emerald-100/80">ปลดล็อกเพื่อแก้ไขข้อมูล</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-white/15 text-emerald-100 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleUnlock} className="p-5 space-y-4">
          <div className="text-xs text-slate-600">
            การดำเนินการ <span className="font-semibold text-slate-900">"{actionTitle}"</span> ต้องใช้รหัสผ่านเจ้าหน้าที่คลังยา รพ.สต.บ้านท่าคล้อ เพื่อความปลอดภัยของข้อมูล
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รหัสผ่าน / PIN เจ้าหน้าที่
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="กรอกรหัส (ค่าเริ่มต้น: 1234)"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-hidden font-mono"
                autoFocus
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">รหัสเริ่มต้นสำหรับเจ้าหน้าที่คือ: 1234</p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ปลดล็อก</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
