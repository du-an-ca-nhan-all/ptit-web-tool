import React from 'react';
import { Clock, MapPin, ListFilter } from 'lucide-react';
import { TimetableCalendarEvent } from '../../server/studentTimetableServerService';
import { SubjectProgressItem } from '../../utils/timetableProgress';
import { SUBJECT_COLOR_PALETTES } from './constants';
import { SessionNumberInfo } from './types';

interface AgendaViewProps {
  filteredEvents: TimetableCalendarEvent[];
  todayIso: string;
  eventSessionNumberMap: Map<string, SessionNumberInfo>;
  subjectProgressMap: Map<string, SubjectProgressItem>;
  onSelectEvent: (ev: TimetableCalendarEvent) => void;
}

export default function AgendaView({
  filteredEvents,
  todayIso,
  eventSessionNumberMap,
  subjectProgressMap,
  onSelectEvent,
}: AgendaViewProps) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-indigo-600" />
          <span>Danh Sách Lịch Học ({filteredEvents.length} ca học)</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredEvents.map((ev) => {
          const pal = SUBJECT_COLOR_PALETTES[ev.colorIndex % SUBJECT_COLOR_PALETTES.length];
          const sessionInfo = eventSessionNumberMap.get(ev.id);
          const subProg = subjectProgressMap.get(ev.subjectCode);
          const isToday = ev.date === todayIso;

          return (
            <div
              key={ev.id}
              onClick={() => onSelectEvent(ev)}
              className={`p-3.5 sm:p-4 rounded-2xl border ${pal.bg} ${pal.accentBorder} border-l-4 flex flex-col justify-between gap-2.5 sm:gap-3 shadow-2xs hover:shadow-sm active:scale-98 transition cursor-pointer`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] sm:text-xs font-mono font-bold text-indigo-600 bg-white/90 px-2 py-0.5 rounded-lg border border-slate-200">
                    {ev.dayOfWeekStr}, {new Date(ev.date).toLocaleDateString('vi-VN')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {sessionInfo && (
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white text-indigo-700 border border-indigo-200 shadow-2xs"
                        title={`Buổi ${sessionInfo.current} trên tổng ${sessionInfo.total} buổi`}
                      >
                        Buổi {sessionInfo.current}/{sessionInfo.total}
                      </span>
                    )}
                    {isToday && (
                      <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                        Hôm nay
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-xs font-black text-slate-800 leading-snug">
                  {ev.subjectName}
                </h4>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Mã: {ev.subjectCode} • Nhóm: {ev.group}
                </div>

                {/* Subject Progress Bar */}
                {subProg && (
                  <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-600">
                      <span>
                        Đã học: <b className="text-emerald-700">{subProg.stats.completed}</b>/{subProg.stats.total} buổi
                      </span>
                      <span className={subProg.isFinished ? 'text-emerald-700 font-bold' : 'text-amber-700 font-semibold'}>
                        {subProg.isFinished ? '✓ Đã xong' : `Còn ${subProg.stats.remaining} (${subProg.stats.percentage}%)`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/70 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-1 rounded-full transition-all ${subProg.isFinished ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                        style={{ width: `${Math.min(100, Math.max(0, subProg.stats.percentage))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1 text-[11px] text-slate-700">
                <div className="flex items-center gap-1.5 font-bold font-mono">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{ev.startTime} - {ev.endTime} ({ev.periodStr})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">{ev.room}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
