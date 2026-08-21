'use client';

import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  Video,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  ExternalLink,
  BookOpen,
  Coffee,
  AlertCircle,
} from 'lucide-react';
import { TimetableSummary, TimetableEventItem } from '../types/dashboard.types';

interface PersonalTimetableCardProps {
  timetable: TimetableSummary;
  onNavigateToSchedule: () => void;
  onNavigateToExternalAccounts: () => void;
}

export default function PersonalTimetableCard({
  timetable,
  onNavigateToSchedule,
  onNavigateToExternalAccounts,
}: PersonalTimetableCardProps) {
  // Empty state when account not connected
  if (!timetable.hasData) {
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

  const { todayEvents, upcomingEvents, semesterName, totalSubjects, totalEvents } = timetable;

  // Determine the primary highlight session
  const hasTodayClass = todayEvents.length > 0;
  const primarySession: TimetableEventItem | undefined = hasTodayClass
    ? todayEvents[0]
    : upcomingEvents[0];

  const [activeTab, setActiveTab] = useState<'today' | 'upcoming'>(
    hasTodayClass ? 'today' : 'upcoming'
  );

  const displayList = activeTab === 'today' ? todayEvents : upcomingEvents;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between h-full relative overflow-hidden">
      {/* Decorative Accent Background */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0 shadow-xs">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-slate-900 text-sm sm:text-base tracking-tight leading-tight">
                  Thời Khóa Biểu & Lịch Học
                </h3>
                {semesterName && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 hidden sm:inline-block truncate max-w-[130px]">
                    {semesterName}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {totalSubjects} môn học • {totalEvents} buổi học
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToSchedule}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer shrink-0 pt-0.5"
          >
            <span>Chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hero Spotlight: Next Upcoming / Today Session */}
        {primarySession ? (
          <div className="mb-4">
            <div
              className={`p-4 rounded-2xl border transition-all ${
                hasTodayClass
                  ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white border-emerald-300/80 shadow-xs'
                  : 'bg-gradient-to-br from-slate-50 to-indigo-50/30 border-slate-200/90'
              }`}
            >
              {/* Badge & Shift Row */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  {hasTodayClass ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-xs animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      HÔM NAY CÓ TIẾT
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      📅 Buổi học kế tiếp: {primarySession.dayOfWeekStr} ({primarySession.date.split('-').reverse().slice(0, 2).join('/')})
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                  {primarySession.subjectCode}
                </span>
              </div>

              {/* Subject Title */}
              <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug line-clamp-1">
                {primarySession.subjectName}
              </h4>

              {/* Key Specs Bar: Time & Room */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-200/60 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-bold">
                    {primarySession.startTime} - {primarySession.endTime}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-700 truncate">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="font-bold font-mono truncate text-slate-800" title={primarySession.room}>
                    {primarySession.room || 'Học Trực Tuyến'}
                  </span>
                </div>
              </div>

              {/* Online Link Action if present */}
              {primarySession.onlineLink && (
                <div className="mt-2.5 pt-2 border-t border-emerald-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-emerald-600" /> Học trực tuyến
                  </span>
                  <a
                    href={primarySession.onlineLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs"
                  >
                    <span>Vào lớp</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl text-center mb-4">
            <div className="w-10 h-10 bg-white rounded-xl mx-auto flex items-center justify-center text-slate-400 mb-2 border border-slate-200/60">
              <Coffee className="w-5 h-5 text-amber-500" />
            </div>
            <h4 className="text-xs font-bold text-slate-700">Không có tiết học trong tuần này</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Chúc bạn có những ngày nghỉ ngơi hoặc tự ôn luyện hiệu quả!
            </p>
          </div>
        )}

        {/* Compact Upcoming List */}
        {upcomingEvents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                {hasTodayClass ? 'Các buổi học tiếp theo' : 'Lịch học trong tuần'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium font-mono">
                {upcomingEvents.length} buổi
              </span>
            </div>

            <div className="space-y-1.5">
              {upcomingEvents.slice(hasTodayClass ? 0 : 1, hasTodayClass ? 2 : 3).map((evt) => (
                <div
                  key={evt.id}
                  className="px-3 py-2 bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200/60 rounded-xl flex items-center justify-between gap-3 transition-colors text-xs"
                >
                  <div className="min-w-0 flex-1 flex items-center gap-2.5">
                    {/* Day Badge */}
                    <div className="px-2 py-0.5 bg-white border border-slate-200 rounded-md shrink-0 text-center font-mono font-bold text-[10px] text-slate-700">
                      {evt.dayOfWeekStr} {evt.date.split('-').reverse().slice(0, 2).join('/')}
                    </div>

                    {/* Subject Name */}
                    <span className="font-semibold text-slate-800 truncate" title={evt.subjectName}>
                      {evt.subjectName}
                    </span>
                  </div>

                  {/* Time & Room */}
                  <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-slate-500">
                    <span className="text-slate-700 font-bold">{evt.startTime}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600 truncate max-w-[70px] sm:max-w-[90px]" title={evt.room}>
                      {evt.room || 'Online'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-400 truncate">
          Tự động đồng bộ từ Cổng QLDTTX
        </span>
        <button
          type="button"
          onClick={onNavigateToSchedule}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
        >
          <span>Xem thời khóa biểu đầy đủ</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
