'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { AcademicSourceKey } from './types';

interface AcademicSnapshotEmptyStateProps {
  isSlink: boolean;
  otherSource: AcademicSourceKey;
  otherHasData: boolean;
  otherGpa4: string | null;
  onSelectSource: (source: AcademicSourceKey) => void;
}

export function AcademicSnapshotEmptyState({
  isSlink,
  otherSource,
  otherHasData,
  otherGpa4,
  onSelectSource,
}: AcademicSnapshotEmptyStateProps) {
  return (
    <div className="py-6 text-center flex flex-col items-center">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 ${
          isSlink ? 'bg-violet-50 text-violet-600' : 'bg-indigo-50 text-indigo-600'
        }`}
      >
        <Sparkles className="w-6 h-6" />
      </div>
      <p className="text-sm font-bold text-slate-700">
        {isSlink ? 'Chưa có dữ liệu từ PTIT S-Link' : 'Chưa có dữ liệu từ Cổng QLDTTX'}
      </p>
      <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
        {isSlink
          ? 'Kết nối tài khoản Cổng PTIT S-Link để tự động cập nhật bảng điểm, GPA tích lũy và số tín chỉ đạt.'
          : 'Kết nối tài khoản Cổng QLDTTX (QLHT) để tự động cập nhật bảng điểm, GPA tích lũy và số tín chỉ đạt.'}
      </p>

      {/* Hint to switch to the other source if it has data */}
      {otherHasData && (
        <div className="mt-3 p-2 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-2 w-full max-w-xs text-left">
          <div className="text-[11px] text-slate-600 leading-snug">
            💡 Đã có điểm bên tab{' '}
            <strong className="font-semibold text-slate-800">
              {otherSource === 'SLINK' ? 'PTIT S-Link' : 'QLHT'}
            </strong>
            {otherGpa4 && ` (GPA ${otherGpa4})`}
          </div>
          <button
            type="button"
            onClick={() => onSelectSource(otherSource)}
            className="px-2 py-1 bg-white hover:bg-slate-100 text-indigo-600 text-[11px] font-bold rounded-lg border border-slate-200 shrink-0 cursor-pointer shadow-2xs"
          >
            Xem ngay
          </button>
        </div>
      )}
    </div>
  );
}
