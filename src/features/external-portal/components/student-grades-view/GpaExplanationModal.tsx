import React from 'react';
import { Award, BookOpen, Clock, Lock, X } from 'lucide-react';
import { StudentGradesResult } from '../../server/studentGradesServerService';

interface GpaExplanationModalProps {
  summary?: StudentGradesResult['summary'];
  onClose: () => void;
}

export function GpaExplanationModal({ summary, onClose }: GpaExplanationModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-2xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">Giải Thích Điểm Trung Bình GPA</h3>
              <p className="text-xs text-slate-500">Chi tiết cách tính Hệ 4.0, Hệ 10.0 và số liệu Đã chốt vs Dự kiến</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3.5">
          {/* Item 1: GPA Đã chốt chính thức */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>GPA Tích Lũy (Đã Chốt Chính Thức):</span>
              </span>
              <div className="flex items-center gap-1.5 font-mono font-black text-xs">
                <span className="text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-emerald-300">
                  Hệ 4: {summary?.gpa4 !== null && summary?.gpa4 !== undefined ? summary.gpa4.toFixed(2) : '—'}
                </span>
                <span className="text-slate-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-300">
                  Hệ 10: {summary?.gpa10 !== null && summary?.gpa10 !== undefined ? summary.gpa10.toFixed(2) : '—'}
                </span>
              </div>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Đây là điểm trung bình tích lũy chính thức được <b>Phòng Đào tạo Học viện xét duyệt và ghi nhận trong học bạ</b> (tính trên <b>{summary?.totalCreditsAccumulated || 0} tín chỉ đã chốt</b>). Học lực hiện tại của bạn được xếp loại: <b className="font-bold">{summary?.classification || 'Khá'}</b>.
            </p>
          </div>

          {/* Item 2: GPA Dự kiến */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>GPA Dự Kiến (Toàn Bộ Môn Đã Thi Đạt):</span>
              </span>
              <div className="flex items-center gap-1.5 font-mono font-black text-xs">
                <span className="text-amber-800 bg-white px-2 py-0.5 rounded-lg border border-amber-300">
                  Hệ 4: {summary?.gpa4Expected !== null && summary?.gpa4Expected !== undefined ? summary.gpa4Expected.toFixed(2) : summary?.gpa4?.toFixed(2) ?? '—'}
                </span>
                <span className="text-slate-700 bg-white px-2 py-0.5 rounded-lg border border-amber-300">
                  Hệ 10: {summary?.gpa10Expected !== null && summary?.gpa10Expected !== undefined ? summary.gpa10Expected.toFixed(2) : summary?.gpa10?.toFixed(2) ?? '—'}
                </span>
              </div>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Điểm trung bình được tính trên <b>toàn bộ các môn học bạn đã có điểm thi Đạt</b> (kể cả các môn học kỳ gần nhất vừa công bố kết quả nhưng chưa được nhà trường khóa sổ vào đợt xét tiếp theo, tương ứng với <b>{summary?.totalCreditsAccumulatedExpected ?? summary?.totalCreditsAccumulated ?? 0} tín chỉ</b>).
            </p>
          </div>

          {/* Item 3: Quy chuẩn xếp loại học lực */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Quy Chuẩn Xếp Loại Học Lực (PTIT):</span>
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                <b className="text-emerald-700 block font-bold">• Xuất sắc:</b>
                <span className="text-slate-600 font-mono text-[11px]">GPA 3.60 - 4.00 (Hệ 10: ≥ 9.0)</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                <b className="text-teal-700 block font-bold">• Giỏi:</b>
                <span className="text-slate-600 font-mono text-[11px]">GPA 3.20 - 3.59 (Hệ 10: 8.0 - 8.9)</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                <b className="text-blue-700 block font-bold">• Khá:</b>
                <span className="text-slate-600 font-mono text-[11px]">GPA 2.50 - 3.19 (Hệ 10: 7.0 - 7.9)</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                <b className="text-amber-700 block font-bold">• Trung bình:</b>
                <span className="text-slate-600 font-mono text-[11px]">GPA 2.00 - 2.49 (Hệ 10: 5.5 - 6.9)</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition cursor-pointer shadow-sm"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
}
