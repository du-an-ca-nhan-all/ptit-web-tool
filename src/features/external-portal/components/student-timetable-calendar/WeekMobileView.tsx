import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { TimetableCalendarEvent } from '../../server/studentTimetableServerService';
import { SubjectProgressItem } from '../../utils/timetableProgress';
import { SUBJECT_COLOR_PALETTES } from './constants';
import { SessionNumberInfo, WeekGridDay } from './types';

interface WeekMobileViewProps {
  weekDays: WeekGridDay[];
  eventSessionNumberMap: Map<string, SessionNumberInfo>;
  subjectProgressMap: Map<string, SubjectProgressItem>;
  onSelectEvent: (ev: TimetableCalendarEvent) => void;
}

export default function WeekMobileView({
  weekDays,
  eventSessionNumberMap,
  subjectProgressMap,
  onSelectEvent,
}: WeekMobileViewProps) {
  return (
    <div className="block md:hidden space-y-2.5">
      {weekDays.map((dayItem) => {
        const isToday = dayItem.isToday;
        const hasEvents = dayItem.events.length > 0;

        return (
          <div
            key={dayItem.dateStr}
            className={`bg-white rounded-2xl p-3.5 border transition-all ${
              isToday
                ? 'border-indigo-400 bg-indigo-50/20 ring-2 ring-indigo-500/20 shadow-xs'
                : 'border-slate-200 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black ${isToday ? 'text-indigo-600' : 'text-slate-800'}`}>
                  {dayItem.weekday}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {dayItem.dayNum}/{dayItem.date.getMonth() + 1}/{dayItem.date.getFullYear()}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {isToday && (
                  <span className="px-2 py-0.2 bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold rounded-full">
                    Hôm nay
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    hasEvents
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {hasEvents ? `${dayItem.events.length} ca` : 'Trống'}
                </span>
              </div>
            </div>

            {hasEvents ? (
              <div className="mt-2.5 flex flex-col gap-2">
                {dayItem.events.map((ev) => {
                  const pal = SUBJECT_COLOR_PALETTES[ev.colorIndex % SUBJECT_COLOR_PALETTES.length];
                  const sessionInfo = eventSessionNumberMap.get(ev.id);
                  const subProg = subjectProgressMap.get(ev.subjectCode);

                  return (
                    <div
                      key={ev.id}
                      onClick={() => onSelectEvent(ev)}
                      className={`p-3 rounded-xl border ${pal.bg} ${pal.accentBorder} border-l-4 flex flex-col gap-1.5 active:scale-98 transition cursor-pointer`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="text-xs font-black text-slate-900 leading-snug">
                          {ev.subjectName}
                        </h4>
                        <div className="flex items-center gap-1 shrink-0">
                          {sessionInfo && (
                            <span
                              className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200"
                              title={`Buổi ${sessionInfo.current}/${sessionInfo.total}`}
                            >
                              Buổi {sessionInfo.current}/{sessionInfo.total}
                            </span>
                          )}
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/80 border border-slate-200">
                            {ev.subjectCode}
                          </span>
                        </div>
                      </div>

                      {subProg && (
                        <div className="flex items-center justify-between text-[10px] font-mono bg-white/60 px-2 py-0.5 rounded border border-slate-200/50">
                          <span>
                            Đã học: <b className="text-emerald-700">{subProg.stats.completed}</b>/{subProg.stats.total} buổi
                          </span>
                          <span className={subProg.isFinished ? 'text-emerald-700 font-bold' : 'text-amber-700 font-semibold'}>
                            {subProg.isFinished ? '✓ Đã xong' : `Còn ${subProg.stats.remaining} (${subProg.stats.percentage}%)`}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-700">
                        <div className="flex items-center gap-1 font-bold">
                          <Clock className="w-3 h-3 text-indigo-600" />
                          <span>{ev.startTime} - {ev.endTime}</span>
                        </div>
                        <div className="flex items-center gap-1 truncate text-slate-600">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span className="truncate">{ev.room}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="pt-2 text-center text-[11px] text-slate-400 italic">
                Không có ca học
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
