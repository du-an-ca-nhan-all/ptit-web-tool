import React from 'react';
import {
  Clock,
  MapPin,
  ExternalLink,
  Video,
  User,
  CalendarCheck,
} from 'lucide-react';
import { TimetableCalendarEvent } from '../../server/studentTimetableServerService';
import { SubjectProgressItem } from '../../utils/timetableProgress';
import { SUBJECT_COLOR_PALETTES, WEEKDAYS } from './constants';
import { MonthGridDay, SessionNumberInfo } from './types';

interface MonthDesktopViewProps {
  monthGridDays: MonthGridDay[];
  selectedDay: string;
  todayIso: string;
  selectedDayEvents: TimetableCalendarEvent[];
  eventSessionNumberMap: Map<string, SessionNumberInfo>;
  subjectProgressMap: Map<string, SubjectProgressItem>;
  onSelectDay: (dateStr: string) => void;
  onSelectEvent: (ev: TimetableCalendarEvent) => void;
}

export default function MonthDesktopView({
  monthGridDays,
  selectedDay,
  todayIso,
  selectedDayEvents,
  eventSessionNumberMap,
  subjectProgressMap,
  onSelectDay,
  onSelectEvent,
}: MonthDesktopViewProps) {
  return (
    <div className="hidden md:grid md:grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Month Grid (3 cols on desktop) */}
      <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-xs font-bold text-slate-600 py-3">
          {WEEKDAYS.map((wd) => (
            <div key={wd.num} className={wd.num === 8 ? 'text-rose-600' : ''}>
              <span>{wd.label}</span>
            </div>
          ))}
        </div>

        {/* Calendar Days Cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
          {monthGridDays.map((dayItem) => {
            const hasEvents = dayItem.events.length > 0;
            const isToday = dayItem.isToday;
            const isSelected = dayItem.dateStr === selectedDay;

            return (
              <div
                key={dayItem.dateStr}
                onClick={() => onSelectDay(dayItem.dateStr)}
                className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors cursor-pointer relative ${
                  !dayItem.isCurrentMonth
                    ? 'bg-slate-50/40 text-slate-300'
                    : isSelected
                    ? 'bg-indigo-50/50 ring-2 ring-indigo-500/50 inset-0 z-10'
                    : 'hover:bg-slate-50/80 text-slate-800'
                }`}
              >
                {/* Day Number & Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-rose-500 text-white shadow-xs'
                        : isSelected
                        ? 'bg-indigo-600 text-white'
                        : ''
                    }`}
                  >
                    {dayItem.date.getDate()}
                  </span>

                  {hasEvents && (
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded-md">
                      {dayItem.events.length} ca
                    </span>
                  )}
                </div>

                {/* Events list in cell */}
                <div className="flex flex-col gap-1 mt-1.5 overflow-hidden">
                  {dayItem.events.slice(0, 2).map((ev) => {
                    const pal = SUBJECT_COLOR_PALETTES[ev.colorIndex % SUBJECT_COLOR_PALETTES.length];
                    return (
                      <button
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(ev);
                        }}
                        className={`text-left text-[11px] p-1 rounded-lg border font-medium truncate flex items-center gap-1 transition ${pal.pill} ${pal.hover}`}
                        title={`${ev.subjectName} (${ev.startTime} - ${ev.endTime}) - ${ev.room}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pal.dot}`} />
                        <span className="font-mono text-[10px] font-bold shrink-0">{ev.startTime}</span>
                        <span className="truncate">{ev.subjectName}</span>
                      </button>
                    );
                  })}

                  {dayItem.events.length > 2 && (
                    <div className="text-[10px] font-bold text-slate-400 pl-1">
                      +{dayItem.events.length - 2} ca học khác...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side Details Panel for Selected Day */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Lịch Học Ngày
              </h3>
              <div className="text-xs font-bold text-indigo-600 font-mono">
                {new Date(selectedDay).toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>

          {selectedDay === todayIso && (
            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold rounded-full animate-pulse">
              Hôm nay
            </span>
          )}
        </div>

        {/* Session cards for the day */}
        {selectedDayEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <CalendarCheck className="w-8 h-8 text-slate-300" />
            <p className="text-xs font-medium text-slate-500">Không có lịch học vào ngày này</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px] pr-1">
            {selectedDayEvents.map((ev) => {
              const pal = SUBJECT_COLOR_PALETTES[ev.colorIndex % SUBJECT_COLOR_PALETTES.length];
              const sessionInfo = eventSessionNumberMap.get(ev.id);
              const subProg = subjectProgressMap.get(ev.subjectCode);

              return (
                <div
                  key={ev.id}
                  className={`p-3.5 rounded-2xl border ${pal.bg} ${pal.accentBorder} border-l-4 flex flex-col gap-2 shadow-2xs`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-black leading-tight">
                      {ev.subjectName}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {sessionInfo && (
                        <span
                          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700"
                          title={`Buổi thứ ${sessionInfo.current} trên tổng ${sessionInfo.total} buổi của môn này`}
                        >
                          Buổi {sessionInfo.current}/{sessionInfo.total}
                        </span>
                      )}
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white/80 border border-slate-200">
                        {ev.subjectCode}
                      </span>
                    </div>
                  </div>

                  {/* Subject Progress Mini Bar */}
                  {subProg && (
                    <div className="bg-white/80 rounded-xl p-2 border border-slate-200/60 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-600">
                        <span>
                          Tiến độ môn: <b className="text-emerald-700">Đã học {subProg.stats.completed}</b>/{subProg.stats.total}
                        </span>
                        <span className={subProg.isFinished ? 'text-emerald-700 font-bold' : 'text-amber-700 font-semibold'}>
                          {subProg.isFinished ? '✓ Đã xong' : `Còn ${subProg.stats.remaining} buổi (${subProg.stats.percentage}%)`}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200/80 rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-1 rounded-full transition-all ${subProg.isFinished ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                          style={{ width: `${Math.min(100, Math.max(0, subProg.stats.percentage))}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-1 text-[11px] opacity-90">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                      <span className="font-mono">{ev.startTime} - {ev.endTime}</span>
                      <span className="text-[10px] font-normal">({ev.periodStr})</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                      <span className="font-semibold">{ev.room}</span>
                      {ev.group && <span>• Tổ: {ev.group}</span>}
                    </div>

                    {ev.lecturer && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span>GV: {ev.lecturer}</span>
                      </div>
                    )}

                    {ev.onlineLink && (
                      <a
                        href={ev.onlineLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:underline"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Vào Lớp Học Online</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
