'use client';

import React from 'react';
import { Calendar, Clock, MapPin, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface UpcomingExamItem {
  id?: number;
  subjectCode: string;
  subjectName: string;
  examDate: string;
  examTime: string;
  room: string;
  examGroup?: string;
  examFormat?: string;
  studentGroup?: string;
  isPostponed?: boolean;
}

interface UpcomingScheduleListProps {
  exams: UpcomingExamItem[];
  onNavigateToSchedule: () => void;
}

export default function UpcomingScheduleList({
  exams,
  onNavigateToSchedule,
}: UpcomingScheduleListProps) {
  if (!exams || exams.length === 0) {
    return null;
  }

  // Display top 4 upcoming exams
  const displayExams = exams.slice(0, 4);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">Danh Sách Môn Thi Sắp Tới</h3>
            <p className="text-xs text-slate-500">
              Tổng cộng {exams.length} môn trong đợt thi hiện tại
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToSchedule}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Xem tất cả ({exams.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayExams.map((ex, index) => (
          <div
            key={ex.id || `${ex.subjectCode}-${index}`}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200/80 hover:border-blue-200 transition-all flex flex-col justify-between gap-2.5"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {ex.subjectCode}
                </span>
                {ex.isPostponed ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Hoãn thi
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    HT: {ex.examFormat || 'Tự luận'}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{ex.subjectName}</h4>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60 font-mono">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>
                  {ex.examDate} - {ex.examTime}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span className="font-bold text-slate-800">{ex.room}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
