'use client';

import React from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  User,
  Video,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  CalendarDays,
  ExternalLink,
} from 'lucide-react';
import { TimetableSummary } from '../types/dashboard.types';

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
  if (!timetable.hasData) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Thời Khóa Biểu & Lịch Học
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Chưa đồng bộ
            </span>
          </div>

          <div className="py-6 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-2.5">
              <CalendarDays className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Chưa có dữ liệu Thời khóa biểu</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Kết nối tài khoản Cổng QLDTTX để tự động cập nhật lịch học theo tuần và nhận thông báo nhắc tiết học.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToExternalAccounts}
          className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-2xl transition-colors border border-emerald-200 flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          <span>Đồng Bộ Thời Khóa Biểu Ngay</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const { todayEvents, upcomingEvents, semesterName, totalSubjects, totalEvents } = timetable;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">
                  Thời Khóa Biểu & Lịch Học
                </h3>
                {semesterName && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline-block truncate max-w-[140px]">
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
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Section 1: Today's Classes */}
        <div className="mb-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-emerald-500" />
              Lịch học hôm nay
            </span>
            {todayEvents.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {todayEvents.length} tiết học
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium">Nghỉ học</span>
            )}
          </div>

          {todayEvents.length > 0 ? (
            <div className="space-y-2">
              {todayEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white border border-emerald-200/80 rounded-2xl"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                      {evt.subjectCode}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      {evt.periodStr || `Tiết ${evt.startTime}`}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{evt.subjectName}</h4>

                  <div className="flex items-center justify-between text-xs text-slate-600 mt-2 pt-1.5 border-t border-emerald-100">
                    <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {evt.startTime} - {evt.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span className="font-bold text-slate-800">{evt.room || 'Phòng học trực tuyến'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-center">
              <p className="text-xs font-bold text-slate-700">Hôm nay không có lịch học</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Chúc bạn có một ngày nghỉ ngơi hoặc ôn tập hiệu quả!
              </p>
            </div>
          )}
        </div>

        {/* Section 2: Upcoming Next Classes */}
        {upcomingEvents.length > 0 && (
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Các buổi học sắp tới
            </span>
            <div className="space-y-2">
              {upcomingEvents.slice(0, 2).map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 bg-slate-50/90 hover:bg-slate-100 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {evt.dayOfWeekStr} ({evt.date.split('-').reverse().slice(0, 2).join('/')})
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {evt.startTime} - {evt.endTime}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-800 truncate">{evt.subjectName}</h5>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-bold text-slate-700 font-mono block">
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
        <span className="text-[11px] text-slate-400 truncate">Lịch học tự động cập nhật</span>
        <button
          type="button"
          onClick={onNavigateToSchedule}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-800 hover:underline cursor-pointer"
        >
          <span>Xem thời khóa biểu tuần</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
