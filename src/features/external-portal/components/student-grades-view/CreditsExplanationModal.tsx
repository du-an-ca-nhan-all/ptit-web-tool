import React from 'react';
import { CheckCircle2, Clock, Lock, TrendingUp, X } from 'lucide-react';
import { StudentGradesResult } from '../../server/studentGradesServerService';

interface CreditsExplanationModalProps {
  summary?: StudentGradesResult['summary'];
  onClose: () => void;
}

export function CreditsExplanationModal({ summary, onClose }: CreditsExplanationModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-2xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">Giải Thích Số Tín Chỉ Tích Lũy</h3>
              <p className="text-xs text-slate-500">Phân biệt giữa số liệu Đã chốt chính thức và Dự kiến toàn khóa</p>
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
          {/* Item 1: Đã chốt chính thức */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Tín Chỉ Đã Chốt Chính Thức:</span>
              </span>
              <span className="text-sm font-black font-mono text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-emerald-300">
                {summary?.totalCreditsAccumulated || 0} / {summary?.curriculumTargetCredits || 150} TC ({summary?.graduationProgressRate || 0}%)
              </span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Đây là số tín chỉ đã được <b>Phòng Đào tạo Học viện xét duyệt và khóa sổ chính thức</b> vào học bạ trên hệ thống S-Link (tương ứng với các môn có cờ tích lũy <code className="bg-emerald-100/80 px-1 rounded font-mono text-[11px]">Đã chốt</code>). Điểm trung bình tích lũy hiện tại ({summary?.gpa4 !== null ? summary?.gpa4.toFixed(2) : '—'} / 4.0) được tính dựa trên số liệu này.
            </p>
          </div>

          {/* Item 2: Dự kiến toàn bộ môn đạt */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>Tín Chỉ Dự Kiến (Toàn Bộ Môn Đạt):</span>
              </span>
              <span className="text-sm font-black font-mono text-amber-800 bg-white px-2 py-0.5 rounded-lg border border-amber-300">
                {summary?.totalCreditsAccumulatedExpected ?? summary?.totalCreditsAccumulated ?? 0} / {summary?.curriculumTargetCredits || 150} TC ({summary?.graduationProgressRateExpected ?? summary?.graduationProgressRate ?? 0}%)
              </span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Tính tổng toàn bộ các môn học bạn <b>đã thi và có kết quả Đạt</b> (hệ 10 &ge; 4.0 / hệ 4 &ge; 1.0) và tính vào GPA. Con số này bao gồm <b>{summary?.totalCreditsAccumulated || 0} TC đã chốt</b> cộng thêm các môn học kỳ gần nhất đã có điểm thi nhưng đang chờ đợt xét duyệt toàn khóa tiếp theo của nhà trường.
            </p>
          </div>

          {/* Item 3: Tổng số tín chỉ CTĐT */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                <span>Chương Trình Đào Tạo Chuẩn:</span>
              </span>
              <span className="text-sm font-black font-mono text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                {summary?.curriculumTargetCredits || 150} TC
              </span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>• Chuyên ngành: <b className="text-slate-800">{summary?.curriculumName || 'Công nghệ thông tin'}</b> ({summary?.academicYearLevel || 'Năm nhất'})</div>
              <div>• Tín chỉ còn lại cần tích lũy: <b className="text-slate-800 font-mono">{Math.max(0, (summary?.curriculumTargetCredits || 150) - (summary?.totalCreditsAccumulated || 0))} TC</b> (chính thức) hoặc <b className="text-indigo-600 font-mono">{Math.max(0, (summary?.curriculumTargetCredits || 150) - (summary?.totalCreditsAccumulatedExpected || 0))} TC</b> (dự kiến)</div>
              {summary?.totalCreditsDebt ? (
                <div>• Tín chỉ nợ / chưa tích lũy: <b className="text-rose-600 font-mono">{summary.totalCreditsDebt} TC</b></div>
              ) : null}
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
