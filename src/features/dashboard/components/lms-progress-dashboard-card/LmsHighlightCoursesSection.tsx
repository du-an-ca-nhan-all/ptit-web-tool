'use client';

import React from 'react';
import { CheckCircle2, Flame } from 'lucide-react';
import { LmsCourseHighlightItem } from '../../types/dashboard.types';

interface LmsHighlightCoursesSectionProps {
  highlightCourses?: LmsCourseHighlightItem[];
}

export function LmsHighlightCoursesSection({
  highlightCourses,
}: LmsHighlightCoursesSectionProps) {
  if (!highlightCourses || highlightCourses.length === 0) {
    return null;
  }

  return (
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
  );
}
