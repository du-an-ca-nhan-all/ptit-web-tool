'use client';

import React from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { StudentLookupInfo } from './types';

interface ForgotPasswordFormProps {
  username: string;
  onUsernameChange: (value: string) => void;
  qlhtPassword: string;
  onQlhtPasswordChange: (value: string) => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  defaultUsername: string;
  isLoading: boolean;
  isCheckingStudent: boolean;
  studentInfo: StudentLookupInfo | null;
  studentLookupError: string;
  errorMsg: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ForgotPasswordForm({
  username,
  onUsernameChange,
  qlhtPassword,
  onQlhtPasswordChange,
  showPassword,
  onToggleShowPassword,
  defaultUsername,
  isLoading,
  isCheckingStudent,
  studentInfo,
  studentLookupError,
  errorMsg,
  onClose,
  onSubmit,
}: ForgotPasswordFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* How it works info card */}
      <div className="p-3.5 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl text-xs text-slate-700 space-y-1.5 shadow-2xs">
        <div className="font-bold flex items-center gap-1.5 text-blue-900">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Cách thức khôi phục mật khẩu tự động:</span>
        </div>
        <p className="text-slate-600 text-[11.5px] leading-relaxed">
          Nhập đúng <strong>Mã sinh viên</strong> và <strong>Mật khẩu Cổng QLDTTX (QLHT)</strong>. Hệ thống sẽ kiểm tra trực tiếp với cổng trường. Nếu chính xác, mật khẩu đăng nhập EduSync của bạn sẽ <strong>tự động được đặt thành mật khẩu QLHT</strong> ngay lập tức.
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
            onChange={(e) => onUsernameChange(e.target.value.toUpperCase())}
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
            onChange={(e) => onQlhtPasswordChange(e.target.value)}
            placeholder="Nhập mật khẩu đang dùng trên Cổng QLHT..."
            className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            disabled={isLoading}
            required
            autoFocus={Boolean(defaultUsername)}
          />
          <button
            type="button"
            onClick={onToggleShowPassword}
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
  );
}
