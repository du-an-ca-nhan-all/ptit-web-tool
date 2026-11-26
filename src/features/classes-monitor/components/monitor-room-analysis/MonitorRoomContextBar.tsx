'use client';

import React from 'react';
import { AlertCircle, BookOpenCheck, Crown, Layers, Users } from 'lucide-react';
import { ExamBatchItem } from '../../../../types';
import {
  ReferenceCandidate,
  ReferenceStudentInfo,
  StudentScope,
} from '../../types/roomAnalysis.types';

interface MonitorRoomContextBarProps {
  examBatches: ExamBatchItem[];
  selectedBatchCode: string;
  onBatchChange: (code: string) => void;
  adminMode: boolean;
  availableClasses: string[];
  selectedClass: string;
  onClassChange: (cls: string) => void;
  selectedRefMaSV: string;
  onRefMaSVChange: (maSV: string) => void;
  referenceStudent: ReferenceStudentInfo | null;
  candidates: ReferenceCandidate[];
  scope: StudentScope;
  onScopeChange: (scope: StudentScope) => void;
  reviewRegisteredCount: number;
  hidePostponed: boolean;
  onHidePostponedChange: (checked: boolean) => void;
  isLoading: boolean;
}

export default function MonitorRoomContextBar({
  examBatches,
  selectedBatchCode,
  onBatchChange,
  adminMode,
  availableClasses,
  selectedClass,
  onClassChange,
  selectedRefMaSV,
  onRefMaSVChange,
  referenceStudent,
  candidates,
  scope,
  onScopeChange,
  reviewRegisteredCount,
  hidePostponed,
  onHidePostponedChange,
  isLoading,
}: MonitorRoomContextBarProps) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Batch selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
              <Layers className="w-3.5 h-3.5 text-indigo-600" /> Đợt thi:
            </span>
            {examBatches.length > 0 ? (
              <select
                value={selectedBatchCode}
                onChange={(e) => onBatchChange(e.target.value)}
                className="bg-indigo-50/70 border border-indigo-200 text-indigo-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {examBatches.map((batch) => (
                  <option key={batch.code} value={batch.code}>
                    {batch.name} ({batch.code}){batch.isActive ? ' ★' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                Chưa có đợt thi
              </span>
            )}
          </div>

          {/* Class selector (editable for Admin, fixed badge for Monitor) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Lớp:
            </span>
            {adminMode && availableClasses.length > 0 ? (
              <select
                value={selectedClass}
                onChange={(e) => onClassChange(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-black border border-slate-200">
                {selectedClass || '—'}
              </span>
            )}
          </div>

          {/* Reference Monitor Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
              <Crown className="w-3.5 h-3.5 text-amber-500" /> Phòng chuẩn:
            </span>
            <select
              value={selectedRefMaSV || referenceStudent?.maSV || ''}
              onChange={(e) => onRefMaSVChange(e.target.value)}
              className="bg-amber-50/80 border border-amber-200 text-amber-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer max-w-[260px]"
            >
              {candidates.length === 0 && referenceStudent && (
                <option value={referenceStudent.maSV}>
                  {referenceStudent.hoTen} ({referenceStudent.maSV})
                </option>
              )}
              {candidates.map((c) => (
                <option key={c.maSV} value={c.maSV}>
                  {c.isMonitor ? '★ LT: ' : ''}
                  {c.hoTen} ({c.maSV}) · {c.examCount} môn
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scope Toggle: Danh sách lớp vs AE ôn tập */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => onScopeChange('CLASS')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                scope === 'CLASS'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Danh sách lớp
            </button>
            <button
              type="button"
              onClick={() => onScopeChange('REVIEW')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                scope === 'REVIEW'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpenCheck className="w-3.5 h-3.5" />
              AE ôn tập ({reviewRegisteredCount})
            </button>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hidePostponed}
              onChange={(e) => onHidePostponedChange(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            Ẩn SV hoãn thi
          </label>
        </div>
      </div>

      {scope === 'REVIEW' && reviewRegisteredCount === 0 && !isLoading && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Chưa có sinh viên nào được đánh dấu trong mục <strong>Đăng Ký Ôn Tập</strong> cho đợt
            thi <strong>{selectedBatchCode}</strong>. Hãy cập nhật danh sách ôn tập trước để lọc
            theo AE ôn tập.
          </span>
        </div>
      )}
    </div>
  );
}
