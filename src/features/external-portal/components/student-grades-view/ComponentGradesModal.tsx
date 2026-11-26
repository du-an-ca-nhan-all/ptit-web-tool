import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { StudentCourseGrade } from '../../server/studentGradesServerService';

interface ComponentGradesModalProps {
  course: StudentCourseGrade;
  onClose: () => void;
}

export function ComponentGradesModal({ course, onClose }: ComponentGradesModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase text-indigo-600 font-mono">
              {course.subjectCode} • {course.credits} Tín chỉ
            </span>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{course.subjectName}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{course.semesterName} (Nhóm {course.group})</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!course.isCalculatedInGpa && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3.5 py-2.5 rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium">
              {course.reasonNotCalculated || 'Học phần không tính vào GPA & tín chỉ tích lũy'}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Danh Sách Điểm Thành Phần</h4>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Ký Hiệu</th>
                  <th className="px-4 py-2.5">Tên Thành Phần</th>
                  <th className="px-4 py-2.5 text-center">Trọng Số</th>
                  <th className="px-4 py-2.5 text-center">Điểm Số</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {course.components.map((tp, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600">{tp.code}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{tp.name}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-600">{tp.weight}%</td>
                    <td className="px-4 py-3 text-center font-mono font-black text-emerald-700 bg-emerald-50/40">
                      {tp.score !== null ? tp.score.toFixed(1) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Final Summary Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Tổng Kết (10)</span>
            <span className="text-lg font-black font-mono text-slate-800 mt-0.5 block">
              {course.finalScore10 !== null ? course.finalScore10.toFixed(1) : '—'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Tổng Kết (4)</span>
            <span className="text-lg font-black font-mono text-indigo-600 mt-0.5 block">
              {course.finalScore4 !== null ? course.finalScore4.toFixed(1) : '—'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Điểm Chữ</span>
            <span className="text-lg font-black font-mono text-emerald-600 mt-0.5 block">
              {course.letterGrade || '—'}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition cursor-pointer"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
