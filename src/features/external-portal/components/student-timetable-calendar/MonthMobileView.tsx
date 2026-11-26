import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Zap,
  ExternalLink,
  Video,
  User,
  CalendarDays,
  CheckCheck,
  Copy,
  CalendarCheck,
} from 'lucide-react';
import { TimetableCalendarEvent } from '../../server/studentTimetableServerService';
import { SUBJECT_COLOR_PALETTES, WEEKDAYS } from './constants';
import { MonthGridDay } from './types';

interface MonthMobileViewProps {
  currentDate: Date;
  monthGridDays: MonthGridDay[];
  selectedDay: string;
  todayIso: string;
  selectedDayEvents: TimetableCalendarEvent[];
  copiedLink: boolean;
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
  onSelectDay: (dateStr: string) => void;
  onJumpToNextClass: () => void;
  onSelectEvent: (ev: TimetableCalendarEvent) => void;
  onCopyLink: (link: string) => void;
}

export default function MonthMobileView({
  currentDate,
  monthGridDays,
  selectedDay,
  todayIso,
  selectedDayEvents,
  copiedLink,
  onPrev,
  onToday,
  onNext,
  onSelectDay,
  onJumpToNextClass,
  onSelectEvent,
  onCopyLink,
}: MonthMobileViewProps) {
  return (
    <div className="block md:hidden space-y-3.5">
      {/* 1. Mobile Compact Month Picker Card */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
        {/* Month header */}
        <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-indigo-600" />
            <span className="font-black text-xs text-slate-800">
              Tháng {currentDate.getMonth() + 1}/{currentDate.getFullYear()}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onPrev}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition"
              title="Tháng trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onToday}
              className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold active:scale-95 transition"
            >
              Hôm nay
            </button>
            <button
              onClick={onNext}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition"
              title="Tháng sau"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 7-column weekday headers */}
        <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-500 py-1">
          {WEEKDAYS.map((wd) => (
            <div key={wd.num} className={wd.num === 8 ? 'text-rose-500' : ''}>
              {wd.short}
            </div>
          ))}
        </div>

        {/* 7-column date grid */}
        <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center mt-1">
          {monthGridDays.map((dayItem) => {
            const hasEvents = dayItem.events.length > 0;
            const isToday = dayItem.isToday;
            const isSelected = dayItem.dateStr === selectedDay;

            return (
              <button
                key={dayItem.dateStr}
                onClick={() => onSelectDay(dayItem.dateStr)}
                className={`h-10 rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : isToday
                    ? 'border border-rose-500 bg-rose-50/70 text-rose-700 font-bold'
                    : !dayItem.isCurrentMonth
                    ? 'text-slate-300'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-mono font-bold leading-none">
                  {dayItem.date.getDate()}
                </span>

                {/* Event dots under the date number */}
                {hasEvents && (
                  <div className="flex items-center gap-0.5 mt-1">
                    {dayItem.events.slice(0, 3).map((ev, idx) => {
                      const pal = SUBJECT_COLOR_PALETTES[ev.colorIndex % SUBJECT_COLOR_PALETTES.length];
                      return (
                        <span
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-white' : pal.dot
                          }`}
                        />
                      );
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Month Footer info pill */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Có ca học</span>
            <span className="text-slate-300">•</span>
            <span className="w-2 h-2 rounded-full border border-rose-500 bg-rose-100" />
            <span>Hôm nay</span>
          </div>

          <span className="font-bold text-slate-700">
            {monthGridDays.reduce((acc, d) => (d.isCurrentMonth ? acc + d.events.length : acc), 0)} ca / tháng
          </span>
        </div>
      </div>

      {/* 2. Mobile Daily Schedule Timeline for Selected Day */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col gap-3">
        {/* Header of selected day */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Lịch Học Ngày
              </div>
              <h3 className="text-xs font-black text-slate-800 font-mono">
                {new Date(selectedDay).toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {selectedDay === todayIso && (
              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold rounded-full animate-pulse">
                Hôm nay
              </span>
            )}
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-full font-mono">
              {selectedDayEvents.length} ca
            </span>
          </div>
        </div>

        {/* Sessions list on mobile */}
        {selectedDayEvents.length === 0 ? (
          <div className="py-6 px-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-slate-300" />
            <p className="text-xs font-medium text-slate-500">
              Không có lịch học vào ngày này
            </p>
            <button
              onClick={onJumpToNextClass}
              className="mt-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
              <span>Xem Ca Học Gần Nhất</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {selectedDayEvents.map((ev) => {
              const pal = SUBJECT_COLOR_PALETTES[ev.colorIndex % SUBJECT_COLOR_PALETTES.length];
              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className={`p-3.5 rounded-2xl border ${pal.bg} ${pal.accentBorder} border-l-4 flex flex-col gap-2.5 shadow-2xs active:scale-98 transition cursor-pointer`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 leading-snug">
                        {ev.subjectName}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-600 font-mono">
                        <span>Mã: {ev.subjectCode}</span>
                        {ev.group && <span>• Tổ: {ev.group}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/90 border border-slate-200 shrink-0 text-slate-700">
                      Chi tiết
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] pt-2 border-t border-slate-200/60">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-mono">{ev.startTime} - {ev.endTime}</span>
                      <span className="text-[10px] text-slate-500 font-normal">({ev.periodStr})</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="font-semibold">{ev.room}</span>
                    </div>

                    {ev.lecturer && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>GV: {ev.lecturer}</span>
                      </div>
                    )}
                  </div>

                  {ev.onlineLink && (
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                      <a
                        href={ev.onlineLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Vào Lớp Học Online</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopyLink(ev.onlineLink!);
                        }}
                        className="p-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs transition cursor-pointer"
                        title="Sao chép link phòng học"
                      >
                        {copiedLink ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
