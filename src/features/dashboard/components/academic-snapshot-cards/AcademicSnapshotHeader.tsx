'use client';

import React from 'react';
import { Award, GraduationCap } from 'lucide-react';
import { AcademicSourceSummary } from '../../types/dashboard.types';
import { AcademicSourceKey } from './types';
import { getClassificationColor } from './utils';

interface AcademicSnapshotHeaderProps {
  isSlink: boolean;
  slinkHasData: boolean;
  qlhtHasData: boolean;
  activeData: AcademicSourceSummary;
  onSelectSource: (source: AcademicSourceKey) => void;
}

export function AcademicSnapshotHeader({
  isSlink,
  slinkHasData,
  qlhtHasData,
  activeData,
  onSelectSource,
}: AcademicSnapshotHeaderProps) {
  return (
    <>
      {/* 1. Top Header with Title & Source Toggle Pills */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isSlink ? 'bg-violet-100 text-violet-600' : 'bg-indigo-100 text-indigo-600'
            }`}
          >
            {isSlink ? <Award className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
          </div>
          <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight truncate">
            Chỉ Số Học Tập & GPA
          </h3>
        </div>

        {/* Source Switcher: PTIT S-Link (First) & QLHT */}
        <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0">
          <button
            type="button"
            onClick={() => onSelectSource('SLINK')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              isSlink
                ? 'bg-white text-violet-700 shadow-xs border border-violet-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Xem bảng điểm từ Cổng PTIT S-Link (slink.ptit.edu.vn)"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                slinkHasData ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`}
            />
            <span>S-Link</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectSource('QLHT')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              !isSlink
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Xem bảng điểm từ Cổng Quản Lý Đào Tạo (qldttx.pttc1.edu.vn)"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                qlhtHasData ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`}
            />
            <span>QLHT</span>
          </button>
        </div>
      </div>

      {/* 2. Subtitle & Classification / Sync Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500 font-medium truncate">
          {isSlink
            ? activeData.tenKhoaNganh
              ? `PTIT S-Link • ${activeData.tenKhoaNganh}`
              : 'Dữ liệu từ Cổng PTIT S-Link (slink.ptit.edu.vn)'
            : 'Dữ liệu từ Cổng QLDTTX (qldttx.pttc1.edu.vn)'}
        </span>

        {activeData.hasData && activeData.classification ? (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${getClassificationColor(
              activeData.classification
            )}`}
          >
            {activeData.classification}
          </span>
        ) : !activeData.hasData ? (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
            Chưa đồng bộ
          </span>
        ) : null}
      </div>
    </>
  );
}
