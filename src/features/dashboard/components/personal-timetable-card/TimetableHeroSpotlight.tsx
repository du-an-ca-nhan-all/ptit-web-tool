'use client';

import React from 'react';
import { Clock, MapPin, Video, ExternalLink, Coffee } from 'lucide-react';
import { TimetableEventItem } from '../../types/dashboard.types';
import { clampPercentage, formatShortDate } from './utils';

interface TimetableHeroSpotlightProps {
  primarySession: TimetableEventItem | undefined;
  hasTodayClass: boolean;
}

export function TimetableHeroSpotlight({
  primarySession,
  hasTodayClass,
}: TimetableHeroSpotlightProps) {
  if (!primarySession) {
    return (
      <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl text-center mb-4">
        <div className="w-10 h-10 bg-white rounded-xl mx-auto flex items-center justify-center text-slate-400 mb-2 border border-slate-200/60">
          <Coffee className="w-5 h-5 text-amber-500" />
        </div>
        <h4 className="text-xs font-bold text-slate-700">Không có tiết học trong tuần này</h4>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Chúc bạn có những ngày nghỉ ngơi hoặc tự ôn luyện hiệu quả!
        </p>
      </div>
    );
  }

  return (
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
                📅 Buổi học kế tiếp: {primarySession.dayOfWeekStr} ({formatShortDate(primarySession.date)})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {primarySession.sessionNumber && primarySession.subjectProgress && (
              <span
                className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700"
                title={`Buổi thứ ${primarySession.sessionNumber} trên tổng ${primarySession.subjectProgress.total} buổi của môn này`}
              >
                Buổi {primarySession.sessionNumber}/{primarySession.subjectProgress.total}
              </span>
            )}
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
              {primarySession.subjectCode}
            </span>
          </div>
        </div>

        {/* Subject Title */}
        <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug line-clamp-1">
          {primarySession.subjectName}
        </h4>

        {/* Subject Session Progress Bar */}
        {primarySession.subjectProgress && (
          <div className="mt-2.5 pt-2 border-t border-slate-200/60">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-500 font-medium">Tiến độ môn:</span>
              <span className="font-mono text-slate-700 font-bold">
                <b className="text-emerald-700">Đã học {primarySession.subjectProgress.completed}</b>/
                {primarySession.subjectProgress.total} buổi{' '}
                <span className="text-slate-400 font-normal">
                  (Còn {primarySession.subjectProgress.remaining})
                </span>
              </span>
            </div>
            <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${clampPercentage(primarySession.subjectProgress.percentage)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Key Specs Bar: Time & Room */}
        <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-200/60 text-xs">
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
  );
}
