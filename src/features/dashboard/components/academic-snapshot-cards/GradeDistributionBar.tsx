import React from 'react';
import { AcademicSourceSummary } from '../../types/dashboard.types';

interface GradeDistributionBarProps {
  dist: NonNullable<AcademicSourceSummary['gradeDistribution']>;
  totalGraded: number;
}

export function GradeDistributionBar({ dist, totalGraded }: GradeDistributionBarProps) {
  return (
    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-bold text-slate-600">Phân bố điểm chữ:</span>
        <span className="text-slate-400 font-medium">{totalGraded} môn có điểm</span>
      </div>

      {/* Visual mini-stacked segmented bar */}
      <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-200">
        {dist.aCount > 0 && (
          <div
            className="bg-emerald-500 h-full"
            style={{ width: `${(dist.aCount / totalGraded) * 100}%` }}
            title={`A/A+: ${dist.aCount} môn`}
          />
        )}
        {dist.bCount > 0 && (
          <div
            className="bg-blue-500 h-full"
            style={{ width: `${(dist.bCount / totalGraded) * 100}%` }}
            title={`B/B+: ${dist.bCount} môn`}
          />
        )}
        {dist.cCount > 0 && (
          <div
            className="bg-amber-500 h-full"
            style={{ width: `${(dist.cCount / totalGraded) * 100}%` }}
            title={`C/C+: ${dist.cCount} môn`}
          />
        )}
        {dist.dCount > 0 && (
          <div
            className="bg-rose-400 h-full"
            style={{ width: `${(dist.dCount / totalGraded) * 100}%` }}
            title={`D/D+: ${dist.dCount} môn`}
          />
        )}
        {dist.fCount > 0 && (
          <div
            className="bg-red-600 h-full"
            style={{ width: `${(dist.fCount / totalGraded) * 100}%` }}
            title={`F: ${dist.fCount} môn`}
          />
        )}
      </div>

      {/* Inline counters */}
      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 flex-wrap gap-1">
        <span className="text-emerald-700">A/A+: {dist.aCount}</span>
        <span className="text-blue-700">B/B+: {dist.bCount}</span>
        <span className="text-amber-700">C/C+: {dist.cCount}</span>
        <span className="text-rose-700">D: {dist.dCount}</span>
        <span className={dist.fCount > 0 ? 'text-red-700 font-bold' : 'text-slate-400'}>
          F: {dist.fCount}
        </span>
      </div>
    </div>
  );
}
