'use client';

import React from 'react';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { TimetableEventItem } from '../types/dashboard.types';
import { PersonalTimetableCardProps } from './personal-timetable-card/types';
import { TimetableEmptyState } from './personal-timetable-card/TimetableEmptyState';
import { TimetableHeroSpotlight } from './personal-timetable-card/TimetableHeroSpotlight';
import { TimetableUpcomingList } from './personal-timetable-card/TimetableUpcomingList';
import { TimetableSubjectsProgress } from './personal-timetable-card/TimetableSubjectsProgress';

export default function PersonalTimetableCard({
  timetable,
  onNavigateToSchedule,
  onNavigateToExternalAccounts,
}: PersonalTimetableCardProps) {
  // Empty state when account not connected
  if (!timetable.hasData) {
    return (
      <TimetableEmptyState
        onNavigateToExternalAccounts={onNavigateToExternalAccounts}
      />
    );
  }

  const { todayEvents, upcomingEvents, semesterName, totalSubjects, totalEvents } = timetable;

  // Determine the primary highlight session
  const hasTodayClass = todayEvents.length > 0;
  const primarySession: TimetableEventItem | undefined = hasTodayClass
    ? todayEvents[0]
    : upcomingEvents[0];

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
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 font-medium">
                <span>{totalSubjects} môn</span>
                <span>•</span>
                {timetable.completedEvents !== undefined ? (
                  <span>
                    Đã học: <strong className="text-emerald-700">{timetable.completedEvents}</strong>/{totalEvents} buổi
                    <span className="ml-1 text-[10px] font-bold text-indigo-700 font-mono bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
                      {timetable.progressPercentage}%
                    </span>
                  </span>
                ) : (
                  <span>{totalEvents} buổi học</span>
                )}
              </div>
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
        <TimetableHeroSpotlight
          primarySession={primarySession}
          hasTodayClass={hasTodayClass}
        />

        {/* Compact Upcoming List */}
        <TimetableUpcomingList
          upcomingEvents={upcomingEvents}
          hasTodayClass={hasTodayClass}
        />

        {/* Subjects Progress List on Dashboard */}
        <TimetableSubjectsProgress
          subjectsProgress={timetable.subjectsProgress}
          onNavigateToSchedule={onNavigateToSchedule}
        />
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
