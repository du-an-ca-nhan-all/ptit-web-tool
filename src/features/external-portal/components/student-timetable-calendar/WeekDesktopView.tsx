import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { TimetableCalendarEvent } from '../../server/studentTimetableServerService';
import { SubjectProgressItem } from '../../utils/timetableProgress';
import { SUBJECT_COLOR_PALETTES } from './constants';
import { SessionNumberInfo, WeekGridDay } from './types';

interface WeekDesktopViewProps {
  weekDays: WeekGridDay[];
  eventSessionNumberMap: Map<string, SessionNumberInfo>;
  subjectProgressMap: Map<string, SubjectProgressItem>;
  onSelectEvent: (ev: TimetableCalendarEvent) => void;
}

export default function WeekDesktopView({
  weekDays,
  eventSessionNumberMap,
  subjectProgressMap,
  onSelectEvent,
}: WeekDesktopViewProps) {
  return (
    <div className="hidden md:grid md:grid-cols-7 gap-4">
      {weekDays.map((dayItem) => {
        const isToday = dayItem.isToday;
        return (
          <div
            key={dayItem.dateStr}
            className={`bg-white rounded-3xl p-4 border flex flex-col gap-3 shadow-sm min-h-[300px] ${
              isToday ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200'
            }`}
          >
            {/* Week Column Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <div className={`text-xs font-black ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>
                  {dayItem.weekday}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {dayItem.dayNum}/{dayItem.date.getMonth() + 1}
                </div>
              </div>

              {isToday && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" title="Hôm nay" />
              )}
            </div>

            {/* Events inside this day */}
            {dayItem.events.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[11px] text-slate-300 italic">
                Không có ca học
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {dayItem.events.map((ev) => {
                  const pal = SUBJECT_COLOR_PALETTES[ev.colorIndex % SUBJECT_COLOR_PALETTES.length];
                  const sessionInfo = eventSessionNumberMap.get(ev.id);
                  const subProg = subjectProgressMap.get(ev.subjectCode);

                  return (
                    <div
                      key={ev.id}
                      onClick={() => onSelectEvent(ev)}
                      className={`p-3 rounded-2xl border ${pal.bg} ${pal.accentBorder} border-l-3 flex flex-col gap-1.5 transition cursor-pointer hover:shadow-xs`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="text-xs font-bold leading-tight line-clamp-2">
                          {ev.subjectName}
                        </div>
                        {sessionInfo && (
                          <span
                            className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-white text-indigo-700 border border-indigo-200 shrink-0"
                            title={`Buổi ${sessionInfo.current}/${sessionInfo.total}`}
                          >
                            B.{sessionInfo.current}/{sessionInfo.total}
                          </span>
                        )}
                      </div>

                      {subProg && (
                        <div className="text-[9px] font-mono text-slate-600 flex items-center justify-between border-t border-slate-200/50 pt-1">
                          <span>
                            Đã học: <b className="text-emerald-700">{subProg.stats.completed}</b>/{subProg.stats.total}
                          </span>
                          <span className="text-indigo-700 font-bold">{subProg.stats.percentage}%</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-slate-700">
                        <Clock className="w-3 h-3 text-indigo-600 shrink-0" />
                        <span>{ev.startTime} - {ev.endTime}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-600 truncate">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate">{ev.room}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
