import React, { useState } from 'react';
import { 
  X, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Lock 
} from 'lucide-react';
import { verifyPin, updatePin } from '../utils/authUtils';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast: (msg: string) => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
}) => {
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!verifyPin(currentPin)) {
      setErrorMsg('รหัสผ่านปัจจุบันไม่ถูกต้อง');
      return;
    }

    if (newPin.trim().length < 4) {
      setErrorMsg('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 หลัก/ตัวอักษร');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMsg('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    const res = updatePin(newPin);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        onSuccessToast('เปลี่ยนรหัสผ่านเข้าระบบสำเร็จเรียบร้อยแล้ว');
        onClose();
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setSuccess(false);
      }, 1000);
    } else {
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการบันทึกรหัสผ่านใหม่');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <KeyRound className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">เปลี่ยนรหัสผ่านเข้าระบบ</h3>
              <p className="text-xs text-emerald-100/80">คลังยาสมุนไพร รพ.สต.บ้านท่าคล้อ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/15 text-emerald-100 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {success ? (
            <div className="py-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-800">เปลี่ยนรหัสผ่านสำเร็จ</h4>
              <p className="text-xs text-slate-500">รหัสผ่านใหม่ของคุณมีผลในระบบเรียบร้อยแล้ว</p>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผ่านปัจจุบัน *
                </label>
                <input
                  type="password"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  placeholder="กรอกรหัสเดิม (รหัสเริ่มต้น: 1234)"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-hidden font-mono"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผ่านใหม่ (อย่างน้อย 4 หลัก) *
                </label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-hidden font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ยืนยันรหัสผ่านใหม่อีกครั้ง *
                </label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-hidden font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  บันทึกรหัสผ่านใหม่
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
