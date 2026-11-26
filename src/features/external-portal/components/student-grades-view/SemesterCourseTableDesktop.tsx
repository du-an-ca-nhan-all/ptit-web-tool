import React from 'react';
import { Check, ChevronRight, Clock, Lock, X } from 'lucide-react';
import { StudentCourseGrade } from '../../server/studentGradesServerService';

interface SemesterCourseTableDesktopProps {
  courses: StudentCourseGrade[];
  onSelectCourse: (course: StudentCourseGrade) => void;
}

export function SemesterCourseTableDesktop({
  courses,
  onSelectCourse,
}: SemesterCourseTableDesktopProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
          <tr>
            <th className="px-3.5 py-3 text-center">STT</th>
            <th className="px-3.5 py-3">Mã MH</th>
            <th className="px-4 py-3">Tên Môn Học</th>
            <th className="px-3 py-3 text-center">TC</th>
            <th className="px-3.5 py-3 text-center">Tích Lũy</th>
            <th className="px-3 py-3 text-center">Tổ/Nhóm</th>
            <th className="px-3 py-3 text-center">Điểm Thi</th>
            <th className="px-3 py-3 text-center">Điểm TK (10)</th>
            <th className="px-3 py-3 text-center">Điểm TK (4)</th>
            <th className="px-3 py-3 text-center">Điểm Chữ</th>
            <th className="px-3.5 py-3 text-center">Kết Quả</th>
            <th className="px-3.5 py-3 text-center">Chi Tiết TP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {courses.map((course, idx) => (
            <tr
              key={course.id}
              className={`transition-colors hover:bg-slate-50/80 ${
                course.isPassed === true
                  ? ''
                  : course.isPassed === false
                  ? 'bg-rose-50/30'
                  : 'bg-slate-50/20'
              }`}
            >
              <td className="px-3.5 py-3.5 text-center text-slate-400 font-mono">{idx + 1}</td>
              <td className="px-3.5 py-3.5 font-mono font-bold text-indigo-700">{course.subjectCode}</td>
              <td className="px-4 py-3.5 font-bold text-slate-800">
                <div className="flex flex-col">
                  <span>{course.subjectName}</span>
                  {!course.isCalculatedInGpa && course.reasonNotCalculated && (
                    <span className="text-[10px] font-normal text-amber-700 italic">
                      • {course.reasonNotCalculated}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-3 py-3.5 text-center font-mono font-bold text-slate-700">{course.credits}</td>
              <td className="px-3.5 py-3.5 text-center">
                {course.isAccumulatedOfficial ? (
                  <span
                    title="Đã chốt tích lũy chính thức trên S-Link (tính vào 18 TC)"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"
                  >
                    <Lock className="w-2.5 h-2.5" /> Đã chốt
                  </span>
                ) : course.isPassed === true && course.isCalculatedInGpa ? (
                  <span
                    title="Đã có điểm đạt, dự kiến tính vào 29 TC (chờ đợt chốt S-Link)"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300"
                  >
                    <Clock className="w-2.5 h-2.5" /> Chờ chốt
                  </span>
                ) : !course.isCalculatedInGpa ? (
                  <span
                    title="Học phần điều kiện / KNM không tính vào GPA tích lũy"
                    className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500"
                  >
                    Không tính
                  </span>
                ) : (
                  <span className="text-slate-400 font-mono">—</span>
                )}
              </td>
              <td className="px-3 py-3.5 text-center font-mono text-slate-500">{course.group}</td>
              <td className="px-3 py-3.5 text-center font-mono font-bold text-slate-700">
                {course.examScore !== null ? course.examScore.toFixed(1) : '—'}
              </td>
              <td className="px-3 py-3.5 text-center font-mono font-black text-slate-800">
                {course.finalScore10 !== null ? course.finalScore10.toFixed(1) : '—'}
              </td>
              <td className="px-3 py-3.5 text-center font-mono font-black text-indigo-600">
                {course.finalScore4 !== null ? course.finalScore4.toFixed(1) : '—'}
              </td>
              <td className="px-3 py-3.5 text-center">
                {course.letterGrade ? (
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-black font-mono border ${
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
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="px-3.5 py-3.5 text-center">
                {course.isPassed === true ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Check className="w-3 h-3 stroke-[3]" /> Đạt
                  </span>
                ) : course.isPassed === false ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <X className="w-3 h-3 stroke-[3]" /> Chưa đạt
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    <Clock className="w-3 h-3" /> Đang học
                  </span>
                )}
              </td>
              <td className="px-3.5 py-3.5 text-center">
                {course.components.length > 0 ? (
                  <button
                    onClick={() => onSelectCourse(course)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition text-[11px] cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>{course.components.length} TP</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                ) : (
                  <span className="text-slate-300 text-[11px]">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
