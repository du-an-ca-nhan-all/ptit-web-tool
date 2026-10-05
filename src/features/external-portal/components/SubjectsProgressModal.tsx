import React from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  GraduationCap,
  CalendarCheck2,
} from 'lucide-react';
import {
  SubjectProgressItem,
  TimetableProgressStats,
} from '../utils/timetableProgress';

interface SubjectsProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectsProgress: SubjectProgressItem[];
  overallStats: TimetableProgressStats;
  semesterName?: string;
  onSelectSubject: (subjectCode: string) => void;
  selectedSubjectCode?: string;
}

const SUBJECT_COLOR_PALETTES = [
  {
    bg: 'bg-indigo-50/60 border-indigo-200',
    bar: 'bg-indigo-600',
    badge: 'bg-indigo-600 text-white',
    text: 'text-indigo-900',
  },
  {
    bg: 'bg-emerald-50/60 border-emerald-200',
    bar: 'bg-emerald-600',
    badge: 'bg-emerald-600 text-white',
    text: 'text-emerald-900',
  },
  {
    bg: 'bg-sky-50/60 border-sky-200',
    bar: 'bg-sky-600',
    badge: 'bg-sky-600 text-white',
    text: 'text-sky-900',
  },
  {
    bg: 'bg-amber-50/60 border-amber-200',
    bar: 'bg-amber-500',
    badge: 'bg-amber-600 text-white',
    text: 'text-amber-900',
  },
  {
    bg: 'bg-purple-50/60 border-purple-200',
    bar: 'bg-purple-600',
    badge: 'bg-purple-600 text-white',
    text: 'text-purple-900',
  },
  {
    bg: 'bg-rose-50/60 border-rose-200',
    bar: 'bg-rose-600',
    badge: 'bg-rose-600 text-white',
    text: 'text-rose-900',
  },
];

export default function SubjectsProgressModal({
  isOpen,
  onClose,
  subjectsProgress,
  overallStats,
  semesterName,
  onSelectSubject,
  selectedSubjectCode = 'ALL',
}: SubjectsProgressModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-indigo-500 to-sky-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                <span>Tiến Độ Buổi Học Các Môn</span>
              </h3>
              <p className="text-xs text-slate-500">
                {semesterName || 'Học kỳ hiện tại'} •{' '}
                <b className="text-slate-700">{subjectsProgress.length} môn học</b>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overall Semester Progress Summary Banner */}
        <div className="my-3.5 p-3.5 sm:p-4 bg-gradient-to-br from-indigo-50/90 via-sky-50/50 to-slate-50 border border-indigo-100/90 rounded-2xl">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tiến độ toàn bộ học kỳ:</span>
            </span>
            <span className="text-xs sm:text-sm font-black text-indigo-700 font-mono">
              {overallStats.percentage}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden mb-2.5 shadow-inner">
            <div
              className="bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, overallStats.percentage))}%` }}
            />
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] sm:text-xs">
            <div className="bg-white/90 border border-slate-200/80 rounded-xl py-1.5 px-2">
              <span className="text-slate-500 block text-[10px]">Tổng buổi</span>
              <strong className="font-mono text-slate-800 text-xs sm:text-sm font-bold">
                {overallStats.total}
              </strong>
            </div>
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl py-1.5 px-2">
              <span className="text-emerald-700 block text-[10px] font-medium">✓ Đã học</span>
              <strong className="font-mono text-emerald-800 text-xs sm:text-sm font-bold">
                {overallStats.completed}
              </strong>
            </div>
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl py-1.5 px-2">
              <span className="text-amber-700 block text-[10px] font-medium">⏳ Còn lại</span>
              <strong className="font-mono text-amber-800 text-xs sm:text-sm font-bold">
                {overallStats.remaining}
              </strong>
            </div>
          </div>
        </div>

        {/* Subjects List (Scrollable) */}
        <div className="overflow-y-auto pr-1 space-y-2.5 flex-1 min-h-[180px]">
          {subjectsProgress.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs italic">
              Không có dữ liệu môn học
            </div>
          ) : (
            subjectsProgress.map((sub, index) => {
              const pal =
                SUBJECT_COLOR_PALETTES[
                  (sub.colorIndex ?? index) % SUBJECT_COLOR_PALETTES.length
                ];
              const isSelected = selectedSubjectCode === sub.subjectCode;

              return (
                <div
                  key={sub.subjectCode}
                  onClick={() => {
                    onSelectSubject(sub.subjectCode);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer group hover:shadow-sm ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                      : `${pal.bg} hover:border-slate-300`
                  }`}
                  title="Nhấn để lọc lịch của môn này trên thời khóa biểu"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-white text-slate-700 border border-slate-200">
                          {sub.subjectCode}
                        </span>
                        {sub.group && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Tổ {sub.group}
                          </span>
                        )}
                        {sub.isFinished ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Đã hoàn thành
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Còn {sub.stats.remaining} buổi
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-black text-slate-900 mt-1 leading-snug group-hover:text-indigo-600 transition-colors">
                        {sub.subjectName}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-black text-slate-800 font-mono">
                        {sub.stats.percentage}%
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {sub.stats.completed}/{sub.stats.total}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden mb-2">
                    <div
                      className={`${pal.bar} h-1.5 rounded-full transition-all duration-300`}
                      style={{
                        width: `${Math.min(100, Math.max(0, sub.stats.percentage))}%`,
                      }}
                    />
                  </div>

                  {/* Details Footer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/50">
                    <div className="flex items-center gap-2 flex-wrap font-mono text-[10px] sm:text-[11px]">
                      <span>
                        Tổng: <b>{sub.stats.total}</b> buổi
                      </span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">
                        Đã học: <b>{sub.stats.completed}</b>
                      </span>
                      <span>•</span>
                      <span className="text-amber-700 font-semibold">
                        Còn: <b>{sub.stats.remaining}</b>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 opacity-90 group-hover:translate-x-0.5 transition-transform shrink-0">
                      <span>Lọc lịch</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
          {selectedSubjectCode !== 'ALL' ? (
            <button
              type="button"
              onClick={() => {
                onSelectSubject('ALL');
                onClose();
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <CalendarCheck2 className="w-3.5 h-3.5" />
              <span>Xem Tất Cả Lịch</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400">
              Nhấn vào bất kỳ môn nào để lọc trên lịch
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
