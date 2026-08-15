import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  X,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  User,
  Eye,
  EyeOff,
  Eraser,
  Dices,
} from 'lucide-react';

interface AdminResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUsername?: string;
  initialFullName?: string;
  initialClass?: string;
  onSuccess?: () => void;
}

export default function AdminResetPasswordModal({
  isOpen,
  onClose,
  initialUsername = '',
  initialFullName = '',
  initialClass = '',
  onSuccess,
}: AdminResetPasswordModalProps) {
  const [username, setUsername] = useState(initialUsername);
  const [fullName, setFullName] = useState(initialFullName);
  const [lop, setLop] = useState(initialClass);
  const [mode, setMode] = useState<'GENERATE' | 'CUSTOM' | 'CLEAR'>('GENERATE');
  const [customPassword, setCustomPassword] = useState('');
  const [showCustomPassword, setShowCustomPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Result state after reset
  const [resetResult, setResetResult] = useState<{
    username: string;
    fullName?: string;
    lop?: string;
    mode: string;
    newPassword?: string | null;
    message: string;
  } | null>(null);

  const [hasCopied, setHasCopied] = useState(false);

  // Student lookup state if username is changed
  const [isLookingUp, setIsLookingUp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUsername(initialUsername);
      setFullName(initialFullName);
      setLop(initialClass);
      setMode('GENERATE');
      setCustomPassword('');
      setErrorMsg('');
      setResetResult(null);
      setHasCopied(false);
    }
  }, [isOpen, initialUsername, initialFullName, initialClass]);

  // Lookup student info when username changes (and not pre-filled)
  useEffect(() => {
    const clean = username.trim().toUpperCase();
    if (!clean || clean.length < 3 || initialFullName) return;

    const timer = setTimeout(async () => {
      setIsLookingUp(true);
      try {
        const res = await fetch(`/api/auth/register?username=${encodeURIComponent(clean)}`);
        const data = await res.json();
        if (res.ok && data.found && data.student) {
          setFullName(data.student.hoTen);
          setLop(data.student.maLop || '');
        }
      } catch (err) {
        // ignore
      } finally {
        setIsLookingUp(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, initialFullName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Vui lòng nhập Mã sinh viên / Tên đăng nhập');
      return;
    }

    if (mode === 'CUSTOM') {
      if (!customPassword || customPassword.length < 6) {
        setErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự');
        return;
      }
    }

    setIsLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username: username.trim(),
          mode,
          newPassword: mode === 'CUSTOM' ? customPassword.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResetResult({
          username: data.username,
          fullName: data.fullName || fullName,
          lop: data.lop || lop,
          mode: data.mode,
          newPassword: data.newPassword,
          message: data.message,
        });
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(data.error || 'Lỗi khi đặt lại mật khẩu');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ khi thực hiện reset mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (resetResult?.newPassword) {
      navigator.clipboard.writeText(resetResult.newPassword);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Đặt Lại Mật Khẩu Người Dùng
              </h3>
              <p className="text-xs text-slate-400">
                Chức năng dành riêng cho Quản trị viên hệ thống
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {resetResult ? (
            /* ================= SUCCESS VIEW ================= */
            <div className="flex flex-col items-center justify-center py-2 text-center gap-5">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-lg font-black text-slate-800">
                  {resetResult.mode === 'CLEAR' ? 'Đã Xóa Mật Khẩu' : 'Đặt Lại Mật Khẩu Thành Công!'}
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-sm">
                  {resetResult.message}
                </p>
              </div>

              {/* Target User Info Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 w-full text-left text-xs space-y-1.5 font-medium text-slate-600">
                <div className="flex justify-between items-center">
                  <span>Mã Sinh Viên / User:</span>
                  <b className="font-mono text-sm text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {resetResult.username}
                  </b>
                </div>
                {resetResult.fullName && (
                  <div className="flex justify-between items-center">
                    <span>Họ và Tên:</span>
                    <b className="text-slate-900">{resetResult.fullName}</b>
                  </div>
                )}
                {resetResult.lop && (
                  <div className="flex justify-between items-center">
                    <span>Lớp:</span>
                    <b className="text-indigo-600 font-bold">{resetResult.lop}</b>
                  </div>
                )}
              </div>

              {/* New Password Box */}
              {resetResult.newPassword && (
                <div className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex flex-col gap-2.5">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider text-left">
                    Mật Khẩu Mới Của Người Dùng:
                  </div>
                  <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-emerald-300 shadow-inner">
                    <span className="font-mono text-base font-black text-emerald-700 tracking-wider">
                      {resetResult.newPassword}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      {hasCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã Sao Chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-700 text-left">
                    💡 Hãy copy mật khẩu này và gửi lại cho sinh viên để họ có thể đăng nhập ngay.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 w-full mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetResult(null);
                    setCustomPassword('');
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors cursor-pointer"
                >
                  Reset Cho Người Khác
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Hoàn Tất
                </button>
              </div>
            </div>
          ) : (
            /* ================= FORM VIEW ================= */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Target User */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Mã Sinh Viên / Tên Đăng Nhập <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toUpperCase())}
                    className="block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-2xl bg-slate-50 text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                    placeholder="Ví dụ: K25DTCN402"
                    required
                    disabled={isLoading || Boolean(initialUsername)}
                  />
                  {isLookingUp && (
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                      <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Display Student info if available */}
                {(fullName || lop) && (
                  <div className="mt-2 p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs flex items-center justify-between text-indigo-900">
                    <span className="font-bold">{fullName || username}</span>
                    {lop && <span className="font-mono bg-indigo-200/60 px-2 py-0.5 rounded text-[11px]">Lớp: {lop}</span>}
                  </div>
                )}
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Chọn Phương Thức Reset:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('GENERATE')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      mode === 'GENERATE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Dices className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ngẫu Nhiên</span>
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">
                      Tự tạo mk ngẫu nhiên 8 ký tự an toàn
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('CUSTOM')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      mode === 'CUSTOM'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Lock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Tùy Chỉnh</span>
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">
                      Admin tự nhập mật khẩu mong muốn
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('CLEAR')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      mode === 'CLEAR'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Eraser className="w-3.5 h-3.5 text-amber-600" />
                      <span>Xóa Mật Khẩu</span>
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">
                      Xóa mk để SV tự đăng ký kích hoạt lại
                    </span>
                  </button>
                </div>
              </div>

              {/* Custom Password Input */}
              {mode === 'CUSTOM' && (
                <div className="animate-in fade-in">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Nhập Mật Khẩu Mới <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCustomPassword ? 'text' : 'password'}
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      className="block w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-2xl bg-slate-50 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomPassword(!showCustomPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCustomPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Notice for Clear mode */}
              {mode === 'CLEAR' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Hệ thống sẽ làm trống trường mật khẩu của tài khoản. Sinh viên sẽ dùng tính năng <strong>Đăng Ký Tài Khoản</strong> để tự đặt lại mật khẩu mới.
                  </span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Xác Nhận Đặt Lại</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
