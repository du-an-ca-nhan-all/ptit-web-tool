'use client';

import React from 'react';
import { CheckCircle2, ArrowRight, Zap, Sparkles, Clock } from 'lucide-react';
import { StudentLookupInfo } from './types';

interface RegisterSuccessViewProps {
  regSuccessMsg: string;
  isAutoApproved: boolean;
  regUsername: string;
  studentInfo: StudentLookupInfo | null;
  onBackToLogin: () => void;
}

export default function RegisterSuccessView({
  regSuccessMsg,
  isAutoApproved,
  regUsername,
  studentInfo,
  onBackToLogin,
}: RegisterSuccessViewProps) {
  return (
    <div className="flex flex-col items-center justify-center py-2 text-center gap-3 sm:gap-4">
      <div
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xs ${
          isAutoApproved
            ? 'bg-gradient-to-br from-amber-400 to-emerald-500 text-white shadow-emerald-500/20'
            : 'bg-emerald-100 text-emerald-600'
        }`}
      >
        {isAutoApproved ? (
          <Zap className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
        ) : (
          <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
        )}
      </div>
      <div>
        <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight flex items-center justify-center gap-1.5">
          {isAutoApproved ? (
            <>
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Kích Hoạt Tự Động Thành Công!</span>
            </>
          ) : (
            <span>Gửi Yêu Cầu Thành Công!</span>
          )}
        </h3>
        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-sm">
          {regSuccessMsg}
        </p>
      </div>

      <div className="p-3 sm:p-3.5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 text-xs text-slate-600 text-left w-full space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Mã SV:</span>
          <b className="text-slate-900 font-mono text-sm">{regUsername}</b>
        </div>
        {studentInfo?.hoTen && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Họ tên:</span>
            <b className="text-slate-900">{studentInfo.hoTen}</b>
          </div>
        )}
        {studentInfo?.maLop && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Lớp:</span>
            <b className="text-indigo-700 font-bold">{studentInfo.maLop}</b>
          </div>
        )}
        <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
          <span className="text-slate-500">Trạng thái:</span>
          {isAutoApproved ? (
            <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              Đã kích hoạt & Liên kết QLHT
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-bold text-[11px] text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-md">
              <Clock className="w-3 h-3 text-amber-600" />
              Chờ Admin duyệt
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onBackToLogin}
        className={`w-full py-3 text-white font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-all shadow-md cursor-pointer active:scale-[0.99] touch-manipulation flex items-center justify-center gap-2 ${
          isAutoApproved
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25'
            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
        }`}
      >
        <span>{isAutoApproved ? 'Đăng Nhập Ngay' : 'Quay Lại Màn Hình Đăng Nhập'}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
