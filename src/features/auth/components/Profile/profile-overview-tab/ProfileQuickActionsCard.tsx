'use client';

import React from 'react';
import {
  Calendar,
  Award,
  LogOut,
  ChevronRight,
  CalendarDays,
  Globe,
  BookOpen,
} from 'lucide-react';
import { ProfileQuickActionsCardProps } from './types';

export function ProfileQuickActionsCard({
  hasExamSchedule,
  onNavigateTab,
  onSelectSubTab,
  onLogout,
}: ProfileQuickActionsCardProps) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-2.5 sm:gap-3">
      <h4 className="font-black text-slate-800 text-xs sm:text-sm mb-1">Truy Cập Nhanh</h4>

      <button
        onClick={() => onSelectSubTab('SCHEDULE')}
        className="w-full p-2.5 sm:p-3 bg-slate-50 hover:bg-indigo-50 active:scale-98 border border-slate-200 rounded-xl sm:rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CalendarDays className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-700 truncate">Xem Lịch Học & Thời Khóa Biểu</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-1" />
      </button>

      <button
        onClick={() => onSelectSubTab('GRADES')}
        className="w-full p-2.5 sm:p-3 bg-slate-50 hover:bg-indigo-50 active:scale-98 border border-slate-200 rounded-xl sm:rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Award className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-700 truncate">Xem Điểm & Bảng Điểm Học Tập</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-1" />
      </button>

      <button
        onClick={() => onSelectSubTab('LMS')}
        className="w-full p-2.5 sm:p-3 bg-slate-50 hover:bg-sky-50 active:scale-98 border border-slate-200 rounded-xl sm:rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700 group-hover:text-sky-700 truncate">Học Tập & Tiến Độ LMS</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0 ml-1" />
      </button>

      <button
        onClick={() => onSelectSubTab('EXTERNAL_ACCOUNTS')}
        className="w-full p-2.5 sm:p-3 bg-slate-50 hover:bg-indigo-50 active:scale-98 border border-slate-200 rounded-xl sm:rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-700 truncate">Liên Kết Cổng Đào Tạo & LMS</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-1" />
      </button>

      {hasExamSchedule && onNavigateTab && (
        <button
          onClick={() => onNavigateTab('personal_schedule')}
          className="w-full p-2.5 sm:p-3 bg-slate-50 hover:bg-blue-50 active:scale-98 border border-slate-200 rounded-xl sm:rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700 truncate">Xem Toàn Bộ Lịch Thi</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 ml-1" />
        </button>
      )}

      <button
        onClick={onLogout}
        className="w-full p-2.5 sm:p-3 bg-rose-50 hover:bg-rose-100 active:scale-98 border border-rose-200 rounded-xl sm:rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer text-rose-700 mt-1"
      >
        <div className="flex items-center gap-2.5">
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold">Đăng Xuất Khỏi Hệ Thống</span>
        </div>
      </button>
    </div>
  );
}
