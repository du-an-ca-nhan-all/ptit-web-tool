'use client';

import React from 'react';
import { CalendarDays, ArrowRight, BookOpen } from 'lucide-react';

interface TimetableEmptyStateProps {
  onNavigateToExternalAccounts: () => void;
}

export function TimetableEmptyState({
  onNavigateToExternalAccounts,
}: TimetableEmptyStateProps) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shadow-xs">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">
                Thời Khóa Biểu & Lịch Học
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                Cổng QLDTTX (PTTC1)
              </span>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
            Chưa liên kết
          </span>
        </div>

        <div className="py-8 text-center flex flex-col items-center">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-3 shadow-xs">
            <BookOpen className="w-7 h-7 text-emerald-600" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Chưa có dữ liệu Thời khóa biểu</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
            Kết nối tài khoản Cổng QLDTTX để tự động cập nhật lịch học theo tuần và nhận thông báo nhắc tiết học.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onNavigateToExternalAccounts}
        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold rounded-2xl transition-all shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
      >
        <span>Kết Nối Cổng QLDTTX Ngay</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
