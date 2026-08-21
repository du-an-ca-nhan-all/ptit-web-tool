'use client';

import React from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { AcademicSummary } from '../types/dashboard.types';

interface AcademicSnapshotCardsProps {
  academic: AcademicSummary;
  onNavigateToGrades: () => void;
  onNavigateToExternalAccounts: () => void;
}

export default function AcademicSnapshotCards({
  academic,
  onNavigateToGrades,
  onNavigateToExternalAccounts,
}: AcademicSnapshotCardsProps) {
  if (!academic.hasData) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">Kết Quả Học Tập & GPA</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Chưa đồng bộ
            </span>
          </div>

          <div className="py-6 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-2.5">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Chưa có dữ liệu bảng điểm</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Kết nối tài khoản Cổng QLDTTX để tự động cập nhật bảng điểm, GPA tích lũy và số tín chỉ đạt.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToExternalAccounts}
          className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-2xl transition-colors border border-indigo-200 flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          <span>Kết Nối Cổng QLDTTX Ngay</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const gpa4 = academic.gpa4 !== null && academic.gpa4 !== undefined ? Number(academic.gpa4).toFixed(2) : '--';
  const gpa10 = academic.gpa10 !== null && academic.gpa10 !== undefined ? Number(academic.gpa10).toFixed(2) : '--';

  const getClassificationColor = (cls?: string | null) => {
    if (!cls) return 'bg-slate-100 text-slate-700 border-slate-200';
    if (cls.includes('Xuất sắc')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (cls.includes('Giỏi')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (cls.includes('Khá')) return 'bg-sky-50 text-sky-700 border-sky-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">
                Chỉ Số Học Tập & GPA
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Dữ liệu đồng bộ từ Cổng QLDTTX
              </span>
            </div>
          </div>

          {academic.classification && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getClassificationColor(
                academic.classification
              )}`}
            >
              {academic.classification}
            </span>
          )}
        </div>

        {/* GPA Highlight Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* GPA 4 */}
          <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/50 p-3.5 rounded-2xl border border-indigo-100 relative overflow-hidden">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
              GPA Hệ 4
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-indigo-950 font-mono tracking-tight">
                {gpa4}
              </span>
              <span className="text-xs text-slate-400 font-bold">/ 4.0</span>
            </div>
          </div>

          {/* GPA 10 */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              GPA Hệ 10
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-800 font-mono tracking-tight">
                {gpa10}
              </span>
              <span className="text-xs text-slate-400 font-bold">/ 10</span>
            </div>
          </div>
        </div>

        {/* Small Metric Badges */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="font-mono font-bold text-slate-800 text-sm sm:text-base">
              {academic.creditsAccumulated || 0}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Tín chỉ tích lũy</div>
          </div>
          <div className="p-2 bg-emerald-50/60 border border-emerald-100 rounded-xl">
            <div className="font-mono font-bold text-emerald-700 text-sm sm:text-base">
              {academic.totalPassed || 0}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium">Môn đã đạt</div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="font-mono font-bold text-slate-800 text-sm sm:text-base">
              {academic.totalSubjects || 0}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Tổng số môn</div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-400 truncate">
          {academic.lastSyncAt ? `Đã đồng bộ gần đây` : 'Từ hệ thống'}
        </span>
        <button
          type="button"
          onClick={onNavigateToGrades}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
        >
          <span>Xem bảng điểm chi tiết</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
