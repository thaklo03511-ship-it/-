import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  KeyRound, 
  Building2, 
  AlertCircle, 
  FileText, 
  RotateCcw,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { 
  verifyPin, 
  saveAuthSession, 
  isUsingDefaultPin, 
  resetPinToDefault, 
  AuthRole 
} from '../utils/authUtils';

interface LoginScreenProps {
  onSuccess: (role: AuthRole) => void;
  hospitalName?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSuccess,
  hospitalName = 'รพ.สต.บ้านท่าคล้อ'
}) => {
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const usingDefault = isUsingDefaultPin();

  useEffect(() => {
    // Focus input on load
    inputRef.current?.focus();
  }, []);

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleLoginAsAdmin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!pin.trim()) {
      triggerError('กรุณากรอกรหัสผ่านเข้าระบบ');
      inputRef.current?.focus();
      return;
    }

    if (verifyPin(pin)) {
      saveAuthSession('admin', rememberMe);
      onSuccess('admin');
    } else {
      triggerError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      setPin('');
      inputRef.current?.focus();
    }
  };

  const handleLoginAsViewer = () => {
    saveAuthSession('viewer', rememberMe);
    onSuccess('viewer');
  };

  const handleNumClick = (digit: string) => {
    if (pin.length < 12) {
      setPin(prev => prev + digit);
      setErrorMsg('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const handleResetPin = () => {
    resetPinToDefault();
    setShowResetConfirm(false);
    setResetSuccess(true);
    setPin('1234');
    setTimeout(() => setResetSuccess(false), 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Decorative glow elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Hospital Branding Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-900/50 mb-3 border border-emerald-400/30">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-medium mb-2 backdrop-blur-xs">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>กระทรวงสาธารณสุข • {hospitalName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-prompt">
            คลังยาสมุนไพร {hospitalName}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/80 mt-1 font-normal">
            ระบบจัดการ Stock Card และบันทึกรับ-จ่ายเวชภัณฑ์สมุนไพร
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-7">
          
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>รหัสผ่านเข้าใช้งานระบบ</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ป้อนรหัสผ่านเพื่อปลดล็อกสิทธิ์บันทึกและแก้ไขข้อมูล
              </p>
            </div>
          </div>

          {/* Reset success notification */}
          {resetSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-900/40 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>รีเซ็ตรหัสผ่านกลับเป็น <strong>1234</strong> เรียบร้อยแล้ว สามารถกดเข้าสู่ระบบได้ทันที</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginAsAdmin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                รหัสผ่าน / PIN เจ้าหน้าที่
              </label>
              <div className={`relative ${isShaking ? 'animate-shake' : ''}`}>
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  ref={inputRef}
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="กรอกรหัสผ่าน (ค่าเริ่มต้น: 1234)"
                  className="w-full pl-10 pr-11 py-3 bg-slate-800/90 border border-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 rounded-xl text-center text-lg sm:text-xl font-mono tracking-widest text-white placeholder:text-slate-500 placeholder:text-sm placeholder:tracking-normal transition-all outline-hidden"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  title={showPin ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {errorMsg && (
                <div className="mt-2 text-rose-400 text-xs flex items-center gap-1.5 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Numeric Keypad for fast tablet/touch access */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleNumClick(digit)}
                  className="py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 active:bg-emerald-700 text-base font-semibold text-slate-100 transition-colors border border-slate-700 cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="py-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors border border-slate-700/60 cursor-pointer"
              >
                ล้าง (C)
              </button>
              <button
                type="button"
                onClick={() => handleNumClick('0')}
                className="py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 active:bg-emerald-700 text-base font-semibold text-slate-100 transition-colors border border-slate-700 cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="py-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors border border-slate-700/60 cursor-pointer"
              >
                ⌫ ลบ
              </button>
            </div>

            {/* Remember Me & Info */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                <span>จดจำการเข้าสู่ระบบในเครื่องนี้</span>
              </label>

              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-slate-400 hover:text-emerald-300 transition-colors underline decoration-slate-600 cursor-pointer"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>

            {/* Main Login Button (Staff / Admin with edit rights) */}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 text-white font-semibold text-sm sm:text-base shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer group"
            >
              <span>เข้าสู่ระบบ (เจ้าหน้าที่คลังยา)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          {/* Read-Only Option */}
          <div className="mt-4 pt-4 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={handleLoginAsViewer}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              title="เข้าใช้งานในโหมดตรวจดูข้อมูลอย่างเดียว โดยไม่สามารถแก้ไขสต๊อกยาได้"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>เข้าดูข้อมูลอย่างเดียว (Read-Only / ผู้ตรวจการ)</span>
            </button>
          </div>

          {/* Default PIN reminder */}
          {usingDefault && (
            <div className="mt-4 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-[11px] text-emerald-300 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong>รหัสผ่านเริ่มต้นสำหรับเจ้าหน้าที่:</strong> <span className="font-mono bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-200 font-bold">1234</span>
                <span className="text-emerald-400/80 block mt-0.5">ท่านสามารถเปลี่ยนรหัสผ่านใหม่ได้ตลอดเวลาในแถบเมนูด้านบน</span>
              </div>
            </div>
          )}
        </div>

        {/* Security Footer Note */}
        <div className="text-center mt-5 text-xs text-slate-400">
          <p>ระบบรักษาความปลอดภัยข้อมูลเวชภัณฑ์สมุนไพร เพื่อป้องกันบุคคลภายนอกแก้ไขสต๊อก</p>
          <p className="text-[11px] text-slate-400 mt-1">
            มาตรฐานการจัดการคลังยา รพ.สต.บ้านท่าคล้อ
          </p>
        </div>
      </div>

      {/* Forgot PIN / Reset Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-slate-100">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">ต้องการรีเซ็ตรหัสผ่านใช่หรือไม่?</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              รหัสผ่านเข้าใช้งานจะถูกรีเซ็ตกลับเป็นรหัสเริ่มต้นของโรงพยาบาลคือ <strong className="text-emerald-400 font-mono">1234</strong>
            </p>
            <div className="flex items-center gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleResetPin}
                className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
              >
                ยืนยันรีเซ็ตเป็น 1234
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
