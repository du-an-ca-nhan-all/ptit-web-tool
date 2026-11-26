'use client';

import React from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { AuthMode } from './types';

interface LoginHeaderProps {
  mode: AuthMode;
  onSelectLogin: () => void;
  onSelectRegister: () => void;
}

export default function LoginHeader({
  mode,
  onSelectLogin,
  onSelectRegister,
}: LoginHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 px-4 py-5 sm:p-6 text-center text-white relative overflow-hidden">
      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-2.5 sm:mb-3 backdrop-blur-md border border-white/10 text-sky-400 shadow-inner">
        {mode === 'LOGIN' ? (
          <LogIn className="w-6 h-6 sm:w-7 sm:h-7" />
        ) : (
          <UserPlus className="w-6 h-6 sm:w-7 sm:h-7" />
        )}
      </div>
      <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
        PTIT Portal & Quản Lý Thi
      </h1>
      <p className="text-slate-300 mt-0.5 sm:mt-1 text-xs">
        {mode === 'LOGIN'
          ? 'Đăng nhập vào hệ thống để tra cứu và quản lý'
          : 'Đăng ký kích hoạt tài khoản sinh viên'}
      </p>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-1 bg-white/10 p-1 rounded-xl sm:rounded-2xl mt-3.5 sm:mt-4 border border-white/10 text-xs font-bold">
        <button
          type="button"
          onClick={onSelectLogin}
          className={`py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all cursor-pointer active:scale-[0.98] ${
            mode === 'LOGIN'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Đăng Nhập
        </button>
        <button
          type="button"
          onClick={onSelectRegister}
          className={`py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all cursor-pointer active:scale-[0.98] ${
            mode === 'REGISTER'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Đăng Ký Tài Khoản
        </button>
      </div>
    </div>
  );
}
