'use client';

import React from 'react';
import { UserCheck, ArrowRightLeft } from 'lucide-react';
import { LoginUser } from '../../types';

interface ImpersonationBannerProps {
  currentUser: LoginUser | null;
  isRevertingImpersonate: boolean;
  onRevertImpersonate: () => void;
}

export default function ImpersonationBanner({
  currentUser,
  isRevertingImpersonate,
  onRevertImpersonate,
}: ImpersonationBannerProps) {
  if (!currentUser?.impersonatedBy) return null;

  return (
    <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white px-4 md:px-8 py-2.5 flex items-center justify-between shadow-lg z-30 shrink-0 border-b border-purple-500/30 animate-in slide-in-from-top duration-200">
      <div className="flex items-center gap-3 text-xs md:text-sm font-semibold flex-wrap">
        <div className="flex items-center gap-1.5 bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full font-bold text-xs uppercase tracking-wider border border-amber-400/40">
          <UserCheck className="w-3.5 h-3.5 text-amber-300" />
          Chế Độ Giả Lập
        </div>
        <span>
          Đang đăng nhập với tư cách: <strong className="text-yellow-200 font-bold">{currentUser.fullName || currentUser.username}</strong> ({currentUser.username})
        </span>
        <span className="text-purple-300 hidden sm:inline">•</span>
        <span className="text-purple-300 text-xs hidden sm:inline">
          Admin gốc: <strong className="text-white font-mono">{currentUser.impersonatedBy}</strong>
        </span>
      </div>

      <button
        onClick={onRevertImpersonate}
        disabled={isRevertingImpersonate}
        className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
        title="Quay lại tài khoản quản trị viên ban đầu"
      >
        {isRevertingImpersonate ? (
          <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
        ) : (
          <ArrowRightLeft className="w-3.5 h-3.5" />
        )}
        <span>Trở Về Tài Khoản Admin</span>
      </button>
    </div>
  );
}
