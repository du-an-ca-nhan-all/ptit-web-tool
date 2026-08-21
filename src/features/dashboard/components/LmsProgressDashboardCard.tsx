'use client';

import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  ExternalLink,
  Award,
  AlertCircle,
  Sparkles,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { LmsDashboardSummary, LmsCourseHighlightItem } from '../types/dashboard.types';

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
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between h-full relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-36 h-36 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

        <div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200/60 flex items-center justify-center shadow-xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">
                  Tiến Độ Học Tập LMS
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  Cổng LMS PTTC1 (lms.pttc1.edu.vn)
                </span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
              Chưa liên kết
            </span>
          </div>

          <div className="py-8 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mb-3 shadow-xs">
              <GraduationCap className="w-7 h-7 text-sky-600" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Chưa liên kết Hệ thống LMS</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Kết nối tài khoản LMS để theo dõi tiến độ hoàn thành bài giảng, bài tập và điểm quá trình trực tiếp trên Dashboard.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToExternalAccounts}
          className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white text-xs font-bold rounded-2xl transition-all shadow-sm shadow-sky-600/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          <span>Liên Kết Tài Khoản LMS Ngay</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const {
    totalCourses,
    completedCourses,
    inProgressCourses,
    notStartedCourses,
    completedActivities,
    dueActivities,
    totalActivities,
    overallProgressPercent,
    highlightCourses,
    lastSyncAt,
    isCachedDb,
    syncWarning,
  } = summary;

  // Motivational message and color theme based on overall progress
  const getProgressMotivation = (percent: number) => {
    if (percent >= 100) {
      return {
        text: 'Xuất sắc! Đã hoàn thành 100% tất cả hoạt động',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        barColor: 'from-emerald-500 to-teal-600',
      };
    }
    if (percent >= 75) {
      return {
        text: 'Tiến độ rất tốt! Hãy tiếp tục duy trì nhé',
        badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
        barColor: 'from-sky-500 to-indigo-600',
      };
    }
    if (percent >= 40) {
      return {
        text: 'Đang học tập. Hãy dành thời gian xem tiếp bài giảng',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        barColor: 'from-indigo-500 to-blue-600',
      };
    }
    return {
      text: 'Cần tăng tốc! Còn nhiều bài giảng & bài tập chưa hoàn thành',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      barColor: 'from-amber-500 to-orange-500',
    };
  };

  const motivation = getProgressMotivation(overallProgressPercent);

  // Format sync date
  const syncDateDisplay = (() => {
    if (!lastSyncAt) return 'Đã đồng bộ';
    try {
      const d = new Date(lastSyncAt);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return 'Đã đồng bộ';
    }
  })();

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
        {highlightCourses && highlightCourses.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-orange-500" />
                Môn học cần hoàn thành & tiến độ
              </span>
              <span className="text-[10px] text-slate-400 font-medium font-mono">
                {highlightCourses.length} môn
              </span>
            </div>

            <div className="space-y-2">
              {highlightCourses.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200/60 rounded-xl transition-all text-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 font-mono font-bold text-[10px] text-slate-700 shrink-0">
                        {c.courseCode || 'MÔN HỌC'}
                      </span>
                      <span className="font-bold text-slate-800 truncate" title={c.courseName}>
                        {c.courseName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {c.grade && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
                          QT: {c.grade}
                        </span>
                      )}
                      <span
                        className={`font-mono font-bold text-[11px] ${
                          c.progressPercent === 100 ? 'text-emerald-600' : 'text-sky-600'
                        }`}
                      >
                        {c.progressPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Course Mini Progress Bar */}
                  <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        c.progressPercent === 100
                          ? 'bg-emerald-500'
                          : c.progressPercent >= 50
                          ? 'bg-sky-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.max(3, c.progressPercent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                    <span>
                      {c.completedActivities}/{c.totalActivities > 0 ? c.totalActivities : '--'} hoạt động
                    </span>
                    {c.progressPercent === 100 ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Đã xong
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        Còn {Math.max(0, c.totalActivities - c.completedActivities)} bài
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-400 truncate" title={syncWarning || undefined}>
          {isCachedDb ? `Đã lưu đệm (${syncDateDisplay})` : `Đồng bộ lúc ${syncDateDisplay}`}
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
