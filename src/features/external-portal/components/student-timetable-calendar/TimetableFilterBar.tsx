import React from 'react';
import { ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';
import { StudentTimetableCalendarResult } from '../../server/studentTimetableServerService';
import { SubjectProgressItem, TimetableProgressStats } from '../../utils/timetableProgress';
import { CalendarViewMode, WeekGridDay } from './types';

interface TimetableFilterBarProps {
  viewMode: CalendarViewMode;
  currentDate: Date;
  weekDays: WeekGridDay[];
  data: StudentTimetableCalendarResult | null;
  selectedSubjectFilter: string;
  onChangeSubjectFilter: (value: string) => void;
  overallProgressStats: TimetableProgressStats;
  subjectProgressMap: Map<string, SubjectProgressItem>;
  searchQuery: string;
  onChangeSearchQuery: (value: string) => void;
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
}

export default function TimetableFilterBar({
  viewMode,
  currentDate,
  weekDays,
  data,
  selectedSubjectFilter,
  onChangeSubjectFilter,
  overallProgressStats,
  subjectProgressMap,
  searchQuery,
  onChangeSearchQuery,
  onPrev,
  onToday,
  onNext,
}: TimetableFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
      {/* Date Navigator (Visible on Desktop / MD+) */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={onPrev}
          className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition cursor-pointer"
          title="Thời gian trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onToday}
          className="px-3.5 py-1.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold active:scale-95 transition cursor-pointer"
        >
          Hôm Nay
        </button>

        <button
          onClick={onNext}
          className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition cursor-pointer"
          title="Thời gian tiếp theo"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="text-sm sm:text-base font-black text-slate-800 ml-2 font-mono">
          {viewMode === 'MONTH' && (
            <span>
              Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
            </span>
          )}
          {viewMode === 'WEEK' && (
            <span>
              Tuần {weekDays[0]?.dayNum}/{weekDays[0]?.date.getMonth() + 1} - {weekDays[6]?.dayNum}/{weekDays[6]?.date.getMonth() + 1}, {currentDate.getFullYear()}
            </span>
          )}
          {viewMode === 'AGENDA' && (
            <span>
              Toàn Bộ Lịch Học ({data?.semesterName || 'Học kỳ 1'})
            </span>
          )}
        </div>
      </div>

      {/* Filter by Subject & Search (Responsive for both Mobile & Desktop) */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto">
        <div className="relative flex-1 md:flex-initial md:min-w-[200px]">
          <select
            value={selectedSubjectFilter}
            onChange={(e) => onChangeSubjectFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 appearance-none outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-8"
          >
            <option value="ALL">
              Tất Cả Môn ({data?.uniqueSubjectsCount || 0}) — Đã học {overallProgressStats.completed}/{overallProgressStats.total} buổi ({overallProgressStats.percentage}%)
            </option>
            {data?.subjects.map((sub) => {
              const subProg = subjectProgressMap.get(sub.subjectCode);
              const progressText = subProg
                ? ` — Đã học ${subProg.stats.completed}/${subProg.stats.total} buổi (${subProg.stats.percentage}%)`
                : '';
              return (
                <option key={sub.subjectCode} value={sub.subjectCode}>
                  {sub.subjectName} ({sub.subjectCode}){progressText}
                </option>
              );
            })}
          </select>
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="relative flex-1 md:flex-initial md:min-w-[170px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onChangeSearchQuery(e.target.value)}
            placeholder="Tìm môn, phòng..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>
    </div>
  );
}
