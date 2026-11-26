'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { AcademicSourceSummary } from '../../types/dashboard.types';
import { AcademicSourceKey } from './types';
import { getSyncLabel } from './utils';

interface AcademicSnapshotFooterProps {
  activeData: AcademicSourceSummary;
  selectedSource: AcademicSourceKey;
  isSlink: boolean;
  onNavigateToGrades: (source?: AcademicSourceKey) => void;
  onNavigateToExternalAccounts: () => void;
}

export function AcademicSnapshotFooter({
  activeData,
  selectedSource,
  isSlink,
  onNavigateToGrades,
  onNavigateToExternalAccounts,
}: AcademicSnapshotFooterProps) {
  return (
    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
      {activeData.hasData ? (
        <>
          <span className="text-[11px] text-slate-400 truncate">
            {getSyncLabel(activeData.lastSyncAt)}
          </span>
          <button
            type="button"
            onClick={() => onNavigateToGrades(selectedSource)}
            className={`inline-flex items-center gap-1.5 text-xs font-bold hover:underline cursor-pointer ${
              isSlink
                ? 'text-violet-600 hover:text-violet-800'
                : 'text-indigo-600 hover:text-indigo-800'
            }`}
          >
            <span>Xem bảng điểm chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onNavigateToExternalAccounts}
          className={`w-full py-2.5 px-4 text-xs font-bold rounded-2xl transition-colors border flex items-center justify-center gap-2 cursor-pointer ${
            isSlink
              ? 'bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200'
              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
          }`}
        >
          <span>
            {isSlink ? 'Kết Nối Cổng S-Link Ngay' : 'Kết Nối Cổng QLDTTX Ngay'}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
