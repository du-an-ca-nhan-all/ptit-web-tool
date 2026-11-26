'use client';

import React from 'react';
import {
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
} from 'lucide-react';

interface LoginFormTabProps {
  username: string;
  password: string;
  showPassword: boolean;
  error: string;
  isLoading: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onToggleShowPassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onOpenForgotModal: () => void;
  onSwitchToRegister: () => void;
}

export default function LoginFormTab({
  username,
  password,
  showPassword,
  error,
  isLoading,
  onUsernameChange,
  onPasswordChange,
  onToggleShowPassword,
  onSubmit,
  onOpenForgotModal,
  onSwitchToRegister,
}: LoginFormTabProps) {
  return (
    <div className="p-4 sm:p-7">
      {error && (
        <div className="bg-rose-50 text-rose-700 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl text-xs font-bold mb-4 sm:mb-5 flex items-center gap-2.5 border border-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3.5 sm:space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 sm:mb-1.5 uppercase tracking-wider">
            Mã Sinh Viên / Tên Đăng Nhập
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 sm:py-2.5 border border-slate-300 rounded-xl sm:rounded-2xl bg-slate-50 text-sm sm:text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all uppercase"
              placeholder="Ví dụ: K25DTCN402 hoặc admin"
              disabled={isLoading}
              autoCapitalize="characters"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1 sm:mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Mật Khẩu
            </label>
            <button
              type="button"
              onClick={onOpenForgotModal}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
            >
              <KeyRound className="w-3 h-3" />
              <span>Quên mật khẩu?</span>
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="block w-full pl-10 pr-10 py-2.5 sm:py-2.5 border border-slate-300 rounded-xl sm:rounded-2xl bg-slate-50 text-sm sm:text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              placeholder="Nhập mật khẩu..."
              disabled={isLoading}
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
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl sm:rounded-2xl transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/30 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/25 active:scale-[0.99] touch-manipulation mt-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Đăng Nhập</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="pt-3.5 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-500">
            Chưa kích hoạt mật khẩu?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-blue-600 font-bold hover:underline cursor-pointer inline-flex items-center gap-0.5"
            >
              Đăng ký kích hoạt ngay
            </button>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px]">
            <button
              type="button"
              onClick={onOpenForgotModal}
              className="text-blue-600 font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <KeyRound className="w-3 h-3" />
              <span>Quên mật khẩu EduSync (QLHT)</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
