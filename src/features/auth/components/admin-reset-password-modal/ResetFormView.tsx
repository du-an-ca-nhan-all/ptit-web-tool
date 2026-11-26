'use client';

import React from 'react';
import {
  KeyRound,
  RefreshCw,
  AlertCircle,
  Lock,
  User,
  Eye,
  EyeOff,
  Eraser,
  Dices,
} from 'lucide-react';
import type { ResetPasswordMode } from './types';

interface ResetFormViewProps {
  username: string;
  onUsernameChange: (value: string) => void;
  initialUsername: string;
  fullName: string;
  lop: string;
  mode: ResetPasswordMode;
  onModeChange: (mode: ResetPasswordMode) => void;
  customPassword: string;
  onCustomPasswordChange: (value: string) => void;
  showCustomPassword: boolean;
  onToggleShowCustomPassword: () => void;
  isLoading: boolean;
  isLookingUp: boolean;
  errorMsg: string;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function ResetFormView({
  username,
  onUsernameChange,
  initialUsername,
  fullName,
  lop,
  mode,
  onModeChange,
  customPassword,
  onCustomPasswordChange,
  showCustomPassword,
  onToggleShowCustomPassword,
  isLoading,
  isLookingUp,
  errorMsg,
  onSubmit,
  onClose,
}: ResetFormViewProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
            onChange={(e) => onUsernameChange(e.target.value.toUpperCase())}
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
            {lop && (
              <span className="font-mono bg-indigo-200/60 px-2 py-0.5 rounded text-[11px]">
                Lớp: {lop}
              </span>
            )}
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
            onClick={() => onModeChange('GENERATE')}
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
            onClick={() => onModeChange('CUSTOM')}
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
            onClick={() => onModeChange('CLEAR')}
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
              onChange={(e) => onCustomPasswordChange(e.target.value)}
              className="block w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-2xl bg-slate-50 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
              required
            />
            <button
              type="button"
              onClick={onToggleShowCustomPassword}
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
            Hệ thống sẽ làm trống trường mật khẩu của tài khoản. Sinh viên sẽ dùng tính năng{' '}
            <strong>Đăng Ký Tài Khoản</strong> để tự đặt lại mật khẩu mới.
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
  );
}
