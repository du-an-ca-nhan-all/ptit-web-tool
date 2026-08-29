'use client';

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  X,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';

export interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUsername?: string;
  onSuccess?: (username: string, newPassword?: string) => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  defaultUsername = '',
  onSuccess,
}: ForgotPasswordModalProps) {
  const [username, setUsername] = useState(defaultUsername);
  const [qlhtPassword, setQlhtPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [studentLookupError, setStudentLookupError] = useState('');
  const [isCheckingStudent, setIsCheckingStudent] = useState(false);
  const [studentInfo, setStudentInfo] = useState<{
    maSV: string;
    hoTen: string;
    maLop?: string | null;
  } | null>(null);

  const [successResult, setSuccessResult] = useState<{
    username: string;
    fullName?: string;
    lop?: string | null;
    message: string;
  } | null>(null);

  // Sync default username on modal open
  useEffect(() => {
    if (isOpen) {
      setUsername(defaultUsername || '');
      setQlhtPassword('');
      setShowPassword(false);
      setErrorMsg('');
      setStudentLookupError('');
      setSuccessResult(null);
    }
  }, [isOpen, defaultUsername]);

  // Debounced lookup for student name and class
  useEffect(() => {
    const clean = username.trim().toUpperCase();
    if (!clean || clean.length < 3) {
      setStudentInfo(null);
      setStudentLookupError('');
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingStudent(true);
      setStudentLookupError('');
      try {
        const res = await fetch(`/api/auth/register?username=${encodeURIComponent(clean)}`);
        const data = await res.json();
        if (res.ok && data.found && data.student) {
          setStudentInfo(data.student);
          setStudentLookupError('');
        } else {
          setStudentInfo(null);
          setStudentLookupError(data.error || 'Mã sinh viên không tồn tại trong danh sách sinh viên trường.');
        }
      } catch {
        setStudentInfo(null);
      } finally {
        setIsCheckingStudent(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toUpperCase();
    const cleanPassword = qlhtPassword.trim();

    if (!cleanUsername) {
      setErrorMsg('Vui lòng nhập Mã sinh viên');
      return;
    }

    if (!cleanPassword) {
      setErrorMsg('Vui lòng nhập mật khẩu Cổng QLHT');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessResult(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          qlhtPassword: cleanPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessResult({
          username: cleanUsername,
          fullName: data.fullName || studentInfo?.hoTen,
          lop: data.lop || studentInfo?.maLop,
          message: data.message,
        });
      } else {
        setErrorMsg(data.error || 'Xác thực mật khẩu QLHT thất bại. Vui lòng kiểm tra lại.');
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setErrorMsg(err.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyAndLogin = () => {
    if (onSuccess && successResult) {
      onSuccess(successResult.username, qlhtPassword);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-xs shadow-inner">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Quên Mật Khẩu Tài Khoản
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white border border-white/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                  Xác Thực QLHT
                </span>
              </div>
              <p className="text-xs text-sky-200 mt-0.5">
                Tự động khôi phục mật khẩu thông qua Cổng Quản Lý Học Tập
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full cursor-pointer transition disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {!successResult ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* How it works info card */}
              <div className="p-3.5 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl text-xs text-slate-700 space-y-1.5 shadow-2xs">
                <div className="font-bold flex items-center gap-1.5 text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Cách thức khôi phục mật khẩu tự động:</span>
                </div>
                <p className="text-slate-600 text-[11.5px] leading-relaxed">
                  Nhập đúng <strong>Mã sinh viên</strong> và <strong>Mật khẩu Cổng QLDTTX (QLHT)</strong>. Hệ thống sẽ kiểm tra trực tiếp với cổng trường. Nếu chính xác, mật khẩu đăng nhập portal của bạn sẽ <strong>tự động được đặt thành mật khẩu QLHT</strong> ngay lập tức.
                </p>
              </div>

              {/* MSSV Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Mã Sinh Viên (MSSV) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: K25DTCN402"
                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-sm font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase"
                    disabled={isLoading}
                    required
                    autoFocus={!defaultUsername}
                  />
                  {isCheckingStudent && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Student verified banner */}
                {studentInfo && (
                  <div className="mt-2 p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs flex items-center justify-between gap-1.5 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 truncate">{studentInfo.hoTen}</div>
                        {studentInfo.maLop && (
                          <div className="text-[11px] text-slate-500">
                            Lớp: <b className="text-indigo-700">{studentInfo.maLop}</b>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md shrink-0">
                      Đã xác thực SV
                    </span>
                  </div>
                )}

                {studentLookupError && (
                  <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="leading-snug">{studentLookupError}</span>
                  </div>
                )}
              </div>

              {/* QLHT Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Mật Khẩu Cổng QLHT (QLDTTX) <span className="text-rose-500">*</span>
                  </label>
                  <a
                    href="https://qldttx.pttc1.edu.vn/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    <span>Mở qldttx.pttc1.edu.vn</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={qlhtPassword}
                    onChange={(e) => setQlhtPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đang dùng trên Cổng QLHT..."
                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    disabled={isLoading}
                    required
                    autoFocus={Boolean(defaultUsername)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 w-10 h-full flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Mật khẩu bạn sử dụng để đăng nhập vào trang Quản Lý Đào Tạo Từ Xa của Học viện.
                </p>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Xác thực thất bại:</strong>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              {/* Form Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !username.trim() || !qlhtPassword.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang kiểm tra với Cổng QLHT...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <span>Xác Thực & Đặt Lại Mật Khẩu</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Success State */
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start gap-3">
                <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-emerald-950 text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Đặt Lại Mật Khẩu Thành Công!</span>
                  </h4>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    {successResult.message}
                  </p>
                </div>
              </div>

              {/* Information Card */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Mã sinh viên:</span>
                  <b className="text-slate-900 font-mono text-sm">{successResult.username}</b>
                </div>
                {successResult.fullName && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Họ và tên:</span>
                    <b className="text-slate-900">{successResult.fullName}</b>
                  </div>
                )}
                {successResult.lop && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Lớp:</span>
                    <b className="text-indigo-700 font-bold">{successResult.lop}</b>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
                  <span className="text-slate-500">Mật khẩu portal mới:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    Trùng khớp Mật khẩu Cổng QLHT
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleApplyAndLogin}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-all shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <span>Đăng Nhập Ngay Với Mật Khẩu Này</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
