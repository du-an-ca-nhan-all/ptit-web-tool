import React from 'react';
import { Check, ChevronRight, Clock, Lock, X } from 'lucide-react';
import { StudentCourseGrade } from '../../server/studentGradesServerService';

interface SemesterCourseCardsMobileProps {
  courses: StudentCourseGrade[];
  onSelectCourse: (course: StudentCourseGrade) => void;
}

export function SemesterCourseCardsMobile({
  courses,
  onSelectCourse,
}: SemesterCourseCardsMobileProps) {
  return (
    <div className="block md:hidden p-3.5 divide-y divide-slate-100">
      {courses.map((course) => (
        <div
          key={course.id}
          className={`py-3.5 first:pt-1 last:pb-1 flex flex-col gap-2.5 ${
            course.isPassed === false ? 'bg-rose-50/30 -mx-3.5 px-3.5 rounded-xl' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {course.subjectCode}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {course.credits} TC • Nhóm {course.group}
                </span>
                {course.isAccumulatedOfficial ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Lock className="w-2.5 h-2.5" /> Đã chốt TL
                  </span>
                ) : course.isPassed === true && course.isCalculatedInGpa ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                    <Clock className="w-2.5 h-2.5" /> Chờ chốt TL
                  </span>
                ) : null}
              </div>
              <h5 className="text-xs font-bold text-slate-800 leading-snug">
                {course.subjectName}
              </h5>
              {!course.isCalculatedInGpa && course.reasonNotCalculated && (
                <span className="text-[10px] text-amber-700 italic block mt-0.5">
                  • {course.reasonNotCalculated}
                </span>
              )}
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              {course.letterGrade ? (
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-black font-mono border shadow-2xs ${
                    course.letterGrade.startsWith('A')
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : course.letterGrade.startsWith('B')
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : course.letterGrade.startsWith('C')
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : course.letterGrade.startsWith('D')
                      ? 'bg-orange-100 text-orange-800 border-orange-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  {course.letterGrade}
                </span>
              ) : (
                <span className="text-slate-400 text-xs font-bold">—</span>
              )}

              {course.isPassed === true ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-2.5 h-2.5 stroke-[3]" /> Đạt
                </span>
              ) : course.isPassed === false ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <X className="w-2.5 h-2.5 stroke-[3]" /> Chưa đạt
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  <Clock className="w-2.5 h-2.5" /> Đang học
                </span>
              )}
            </div>
          </div>

          {/* Scores Grid */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80 text-center">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Điểm Thi</span>
              <span className="text-xs font-mono font-bold text-slate-700">
                {course.examScore !== null ? course.examScore.toFixed(1) : '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Tổng Kết (10)</span>
              <span className="text-xs font-mono font-black text-slate-800">
                {course.finalScore10 !== null ? course.finalScore10.toFixed(1) : '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Tổng Kết (4)</span>
              <span className="text-xs font-mono font-black text-indigo-600">
                {course.finalScore4 !== null ? course.finalScore4.toFixed(1) : '—'}
              </span>
            </div>
          </div>

          {/* Action buttons (Chi tiết TP) */}
          {course.components.length > 0 && (
            <button
              type="button"
              onClick={() => onSelectCourse(course)}
              className="w-full py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition text-[11px] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Xem chi tiết {course.components.length} điểm thành phần</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
