'use client';

import React from 'react';
import {
  Lock,
  User,
  UserPlus,
  Phone,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Zap,
  KeyRound,
} from 'lucide-react';
import { StudentLookupInfo } from './types';
import RegisterSuccessView from './RegisterSuccessView';

interface RegisterFormTabProps {
  regUsername: string;
  regPhone: string;
  regPassword: string;
  regNote: string;
  showRegPassword: boolean;
  regSuccessMsg: string;
  isAutoApproved: boolean;
  regError: string;
  isRegistering: boolean;
  isCheckingStudent: boolean;
  studentInfo: StudentLookupInfo | null;
  studentLookupError: string;
  onRegUsernameChange: (value: string) => void;
  onRegPhoneChange: (value: string) => void;
  onRegPasswordChange: (value: string) => void;
  onRegNoteChange: (value: string) => void;
  onToggleShowRegPassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onOpenForgotModal: () => void;
  onSwitchToLogin: () => void;
  onBackToLoginFromSuccess: () => void;
}

export default function RegisterFormTab({
  regUsername,
  regPhone,
  regPassword,
  regNote,
  showRegPassword,
  regSuccessMsg,
  isAutoApproved,
  regError,
  isRegistering,
  isCheckingStudent,
  studentInfo,
  studentLookupError,
  onRegUsernameChange,
  onRegPhoneChange,
  onRegPasswordChange,
  onRegNoteChange,
  onToggleShowRegPassword,
  onSubmit,
  onOpenForgotModal,
  onSwitchToLogin,
  onBackToLoginFromSuccess,
}: RegisterFormTabProps) {
  return (
    <div className="p-4 sm:p-7">
      {regSuccessMsg ? (
        <RegisterSuccessView
          regSuccessMsg={regSuccessMsg}
          isAutoApproved={isAutoApproved}
          regUsername={regUsername}
          studentInfo={studentInfo}
          onBackToLogin={onBackToLoginFromSuccess}
        />
      ) : (
        <form onSubmit={onSubmit} className="space-y-3 sm:space-y-3.5">
          {regError && (
            <div className="bg-rose-50 text-rose-700 p-3 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center gap-2 border border-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="leading-snug">{regError}</span>
            </div>
          )}

          {/* MSSV Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Mã Sinh Viên (MSSV) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={regUsername}
                onChange={(e) => onRegUsernameChange(e.target.value.toUpperCase())}
                className="block w-full pl-9 pr-9 py-2 sm:py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-sm sm:text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white uppercase"
                placeholder="Ví dụ: K25DTCN402"
                required
                disabled={isRegistering}
              />
              {isCheckingStudent && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                </div>
              )}
            </div>

            {/* Student Auto-Lookup Info Card */}
            {studentInfo && (
              <div className="mt-2 p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">{studentInfo.hoTen}</div>
                    <div className="text-[11px] text-slate-500">
                      Lớp: <b className="text-indigo-700">{studentInfo.maLop || 'Chưa rõ lớp'}</b>
                    </div>
                  </div>
                </div>
                <span className="self-start sm:self-center text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md shrink-0">
                  Đã xác nhận SV
                </span>
              </div>
            )}

            {studentLookupError && (
              <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex flex-col gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="leading-snug">{studentLookupError}</span>
                </div>
                {studentInfo?.hasPassword && (
                  <button
                    type="button"
                    onClick={onOpenForgotModal}
                    className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Lấy Lại Mật Khẩu Bằng Cổng QLHT</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* SĐT liên hệ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Số Điện Thoại Liên Hệ (Tùy chọn)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => onRegPhoneChange(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 sm:py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-sm sm:text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                placeholder="0912345678"
                disabled={isRegistering}
              />
            </div>
          </div>

          {/* QLHT Password field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mật Khẩu Cổng QLHT (qldttx.pttc1.edu.vn) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <input
                type={showRegPassword ? 'text' : 'password'}
                value={regPassword}
                onChange={(e) => onRegPasswordChange(e.target.value)}
                className="block w-full pl-9 pr-9 py-2 sm:py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-sm sm:text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                placeholder="Nhập đúng mật khẩu tài khoản Cổng QLHT"
                required
                disabled={isRegistering}
              />
              <button
                type="button"
                onClick={onToggleShowRegPassword}
                className="absolute inset-y-0 right-0 w-9 h-full flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showRegPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showRegPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ghi Chú (Tùy chọn)
            </label>
            <input
              type="text"
              value={regNote}
              onChange={(e) => onRegNoteChange(e.target.value)}
              className="block w-full px-3 py-2 sm:py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-sm sm:text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Lý do đăng ký, liên hệ..."
              disabled={isRegistering}
            />
          </div>

          {/* Mandatory QLHT Verification Banner */}
          <div className="p-2.5 sm:p-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-indigo-200/80 text-xs text-slate-700 flex items-start gap-2 shadow-2xs">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0 mt-0.5" />
            <span className="leading-snug">
              <strong className="text-indigo-900">Xác thực tự động qua QLHT:</strong> Bắt buộc nhập
              đúng mật khẩu đang sử dụng trên <strong>Cổng QLDTTX (qldttx.pttc1.edu.vn)</strong> để
              hệ thống xác thực, <strong>tự động kích hoạt & liên kết QLHT ngay lập tức</strong>.
            </span>
          </div>

          <button
            type="submit"
            disabled={isRegistering || Boolean(studentLookupError)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99] touch-manipulation"
          >
            {isRegistering ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-xs">Đang xác thực QLHT & kích hoạt...</span>
              </div>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Xác Thực & Kích Hoạt Tài Khoản</span>
              </>
            )}
          </button>

          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Đã có mật khẩu?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Đăng nhập ngay
              </button>
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
