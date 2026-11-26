'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { TimetableEventItem } from '../../types/dashboard.types';
import { formatShortDate } from './utils';

interface TimetableUpcomingListProps {
  upcomingEvents: TimetableEventItem[];
  hasTodayClass: boolean;
}

export function TimetableUpcomingList({
  upcomingEvents,
  hasTodayClass,
}: TimetableUpcomingListProps) {
  if (upcomingEvents.length === 0) {
    return null;
  }

  return (
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
                {evt.dayOfWeekStr} {formatShortDate(evt.date)}
              </div>

              {/* Subject Name */}
              <span className="font-semibold text-slate-800 truncate" title={evt.subjectName}>
                {evt.subjectName}
              </span>
            </div>

            {/* Progress Badge, Time & Room */}
            <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-slate-500">
              {evt.sessionNumber && evt.subjectProgress && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white text-indigo-700 border border-slate-200 shrink-0"
                  title={`Buổi thứ ${evt.sessionNumber}/${evt.subjectProgress.total} - Đã học ${evt.subjectProgress.completed} buổi`}
                >
                  B.{evt.sessionNumber}/{evt.subjectProgress.total}
                </span>
              )}
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
  );
}
