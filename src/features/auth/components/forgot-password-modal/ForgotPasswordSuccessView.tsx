'use client';

import React from 'react';
import { CheckCircle2, ArrowRight, Sparkles, Zap } from 'lucide-react';
import type { ForgotPasswordSuccessResult } from './types';

interface ForgotPasswordSuccessViewProps {
  successResult: ForgotPasswordSuccessResult;
  onApplyAndLogin: () => void;
}

export function ForgotPasswordSuccessView({
  successResult,
  onApplyAndLogin,
}: ForgotPasswordSuccessViewProps) {
  return (
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
          <span className="text-slate-500">Mật khẩu EduSync mới:</span>
          <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
            Trùng khớp Mật khẩu Cổng QLHT
          </span>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onApplyAndLogin}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-all shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <span>Đăng Nhập Ngay Với Mật Khẩu Này</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
