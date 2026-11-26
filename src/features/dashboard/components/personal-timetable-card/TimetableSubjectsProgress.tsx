'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { TimetableSubjectProgressSummary } from '../../types/dashboard.types';
import { clampPercentage } from './utils';

interface TimetableSubjectsProgressProps {
  subjectsProgress?: TimetableSubjectProgressSummary[];
  onNavigateToSchedule: () => void;
}

export function TimetableSubjectsProgress({
  subjectsProgress,
  onNavigateToSchedule,
}: TimetableSubjectsProgressProps) {
  if (!subjectsProgress || subjectsProgress.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-3 border-t border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
          <span>Tiến độ từng môn ({subjectsProgress.length} môn)</span>
        </span>
        <button
          type="button"
          onClick={onNavigateToSchedule}
          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
        >
          Xem chi tiết
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {subjectsProgress.map((sub) => (
          <div
            key={sub.subjectCode}
            onClick={onNavigateToSchedule}
            className="p-2.5 rounded-xl bg-slate-50/90 hover:bg-indigo-50/50 border border-slate-200/70 hover:border-indigo-200 transition-all cursor-pointer group flex flex-col justify-between gap-1.5 shadow-2xs"
            title={`Nhấn để mở lịch môn ${sub.subjectName}`}
          >
            <div className="flex items-start justify-between gap-1.5">
              <span className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                {sub.subjectName}
              </span>
              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-white px-1.5 py-0.2 rounded border border-slate-200 shrink-0">
                {sub.percentage}%
              </span>
            </div>

            <div className="w-full bg-slate-200/80 rounded-full h-1 overflow-hidden">
              <div
                className={`h-1 rounded-full transition-all ${sub.isFinished ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                style={{ width: `${clampPercentage(sub.percentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>
                Đã học: <b className="text-emerald-700">{sub.completed}</b>/{sub.total}
              </span>
              <span className={sub.isFinished ? 'text-emerald-700 font-bold' : 'text-amber-700 font-semibold'}>
                {sub.isFinished ? '✓ Hoàn thành' : `Còn ${sub.remaining} buổi`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
