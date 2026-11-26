'use client';

import React from 'react';
import {
  BookOpen,
  Clock,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { LmsDashboardSummary } from '../types/dashboard.types';
import { formatSyncDate, getProgressMotivation } from './lms-progress-dashboard-card/utils';
import { LmsUnconfiguredCard } from './lms-progress-dashboard-card/LmsUnconfiguredCard';
import { LmsHighlightCoursesSection } from './lms-progress-dashboard-card/LmsHighlightCoursesSection';

interface LmsProgressDashboardCardProps {
  summary: LmsDashboardSummary;
  onNavigateToLms: () => void;
  onNavigateToExternalAccounts: () => void;
}

export default function LmsProgressDashboardCard({
  summary,
  onNavigateToLms,
  onNavigateToExternalAccounts,
}: LmsProgressDashboardCardProps) {
  // Empty state when LMS not configured
  if (!summary.isConfigured) {
    return (
      <LmsUnconfiguredCard
        onNavigateToExternalAccounts={onNavigateToExternalAccounts}
      />
    );
  }

  const {
    totalCourses,
    completedCourses,
    completedActivities,
    dueActivities,
    totalActivities,
    overallProgressPercent,
    highlightCourses,
    lastSyncAt,
    syncWarning,
  } = summary;

  const motivation = getProgressMotivation(overallProgressPercent);
  const syncDateDisplay = formatSyncDate(lastSyncAt);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between h-full relative overflow-hidden group">
      {/* Decorative Accent Background */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200/60 flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-slate-900 text-sm sm:text-base tracking-tight leading-tight">
                  Tiến Độ Học Tập LMS
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  Moodle PTTC1
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {totalCourses} môn học • {completedActivities}/{totalActivities > 0 ? totalActivities : completedActivities} hoạt động
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToLms}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1 cursor-pointer shrink-0 pt-0.5"
          >
            <span>Chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Overall Progress Hero Bar */}
        <div className="bg-gradient-to-br from-sky-50/70 via-indigo-50/40 to-white p-4 rounded-2xl border border-sky-100 mb-4 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              Tổng tiến độ hoàn thành
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                {overallProgressPercent}
              </span>
              <span className="text-xs font-bold text-sky-600">%</span>
            </div>
          </div>

          {/* Progress Track */}
          <div className="w-full bg-slate-200/80 h-3 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${motivation.barColor} transition-all duration-500 shadow-xs`}
              style={{ width: `${Math.max(4, Math.min(100, overallProgressPercent))}%` }}
            />
          </div>

          {/* Status Message */}
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 gap-2">
            <span className="truncate font-medium text-slate-700">
              {motivation.text}
            </span>
            <span className="font-mono font-bold text-sky-700 shrink-0">
              {completedActivities} / {totalActivities > 0 ? totalActivities : completedActivities}
            </span>
          </div>
        </div>

        {/* 4-Stat Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs mb-4">
          {/* Total Courses */}
          <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="font-mono font-bold text-slate-800 text-sm sm:text-base">
              {totalCourses}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Tổng môn học</div>
          </div>

          {/* Completed Courses */}
          <div className="p-2 bg-emerald-50/60 border border-emerald-100 rounded-xl">
            <div className="font-mono font-bold text-emerald-700 text-sm sm:text-base">
              {completedCourses}/{totalCourses}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium">Hoàn thành 100%</div>
          </div>

          {/* Completed Activities */}
          <div className="p-2 bg-sky-50/60 border border-sky-100 rounded-xl">
            <div className="font-mono font-bold text-sky-700 text-sm sm:text-base">
              {completedActivities}
            </div>
            <div className="text-[10px] text-sky-600 font-medium">Bài đã xem</div>
          </div>

          {/* Due Activities */}
          <div className="p-2 bg-amber-50/60 border border-amber-100 rounded-xl">
            <div className="font-mono font-bold text-amber-700 text-sm sm:text-base">
              {dueActivities}
            </div>
            <div className="text-[10px] text-amber-600 font-medium">Cần làm tiếp</div>
          </div>
        </div>

        {/* In-Progress / Spotlight Courses */}
        <LmsHighlightCoursesSection highlightCourses={highlightCourses} />
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500 font-medium truncate inline-flex items-center gap-1" title={syncWarning || undefined}>
          <Clock className="w-3 h-3 text-sky-600 shrink-0" />
          <span>Kéo cuối:</span>
          <strong className="font-mono text-slate-900">{syncDateDisplay}</strong>
        </span>
        <div className="flex items-center gap-2">
          <a
            href="https://lms.pttc1.edu.vn/my/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 hover:underline"
            title="Mở cổng LMS PTTC1 trong tab mới"
          >
            <span>Mở LMS</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            type="button"
            onClick={onNavigateToLms}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
          >
            <span>Xem khóa học</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
