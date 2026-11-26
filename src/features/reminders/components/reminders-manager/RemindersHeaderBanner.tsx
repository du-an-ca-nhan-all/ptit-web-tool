'use client';

import React from 'react';
import { Bell, BookOpen, Plus, Send, CalendarCheck, Users } from 'lucide-react';
import { ReminderType } from '../../types/reminder.types';

interface RemindersHeaderBannerProps {
  onOpenCreateModal: (prefillType?: ReminderType) => void;
}

export function RemindersHeaderBanner({ onOpenCreateModal }: RemindersHeaderBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-500/20">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-300 uppercase tracking-widest">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Hệ Thống Lịch Nhắc Hẹn & Báo Thức Telegram</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Bell className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 fill-amber-400/20 animate-bounce" />
            <span>Lịch Nhắc Hẹn Thông Minh</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Tạo lời nhắc cá nhân hoặc tạo nhắc hẹn theo môn học cho toàn bộ bạn học cùng lớp, môn, tổ.
            Hệ thống tự động đồng bộ vào lịch cá nhân và phát thông báo qua Telegram trước 3 ngày, 1 ngày, 5 giờ, 1 giờ...
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 text-emerald-300 font-medium">
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gửi Telegram tự động</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 text-blue-300 font-medium">
              <CalendarCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Hiển thị trên Lịch Học TKB</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 text-amber-300 font-medium">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Đồng bộ cùng lớp & tổ môn</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            onClick={() => onOpenCreateModal('PERSONAL')}
            className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nhắc Hẹn Cá Nhân</span>
          </button>

          <button
            onClick={() => onOpenCreateModal('COURSE')}
            className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            <span>+ Nhắc Hẹn Môn Học</span>
          </button>
        </div>
      </div>
    </div>
  );
}
