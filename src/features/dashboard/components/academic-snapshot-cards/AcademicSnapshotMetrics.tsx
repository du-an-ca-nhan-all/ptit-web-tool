import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import { AcademicSourceSummary } from '../../types/dashboard.types';
import { STANDARD_CREDITS_TARGET, formatGpaValue } from './utils';
import { GradeDistributionBar } from './GradeDistributionBar';

interface AcademicSnapshotMetricsProps {
  activeData: AcademicSourceSummary;
  isSlink: boolean;
}

export function AcademicSnapshotMetrics({
  activeData,
  isSlink,
}: AcademicSnapshotMetricsProps) {
  const gpa4 = formatGpaValue(activeData.gpa4);
  const gpa10 = formatGpaValue(activeData.gpa10);
  const currentAccumulated = activeData.creditsAccumulated || 0;
  const creditProgressPercent = Math.min(
    100,
    Math.round((currentAccumulated / STANDARD_CREDITS_TARGET) * 100)
  );

  const dist = activeData.gradeDistribution;
  const totalGraded =
    dist ? dist.aCount + dist.bCount + dist.cCount + dist.dCount + dist.fCount : 0;

  return (
    <div className="space-y-3.5">
      {/* Primary KPI Grid: GPA Hệ 4, GPA Hệ 10 & Tỉ Lệ Đạt Môn */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {/* GPA 4 */}
        <div
          className={`p-3 rounded-2xl border relative overflow-hidden transition-all ${
            isSlink
              ? 'bg-gradient-to-br from-violet-50/90 to-purple-50/50 border-violet-100'
              : 'bg-gradient-to-br from-indigo-50/90 to-blue-50/50 border-indigo-100'
          }`}
        >
          <span
            className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${
              isSlink ? 'text-violet-600' : 'text-indigo-600'
            }`}
          >
            GPA Hệ 4
          </span>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                isSlink ? 'text-violet-950' : 'text-indigo-950'
              }`}
            >
              {gpa4}
            </span>
            <span className="text-[11px] text-slate-400 font-bold">/4.0</span>
          </div>
        </div>

        {/* GPA 10 */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
            GPA Hệ 10
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-800 font-mono tracking-tight">
              {gpa10}
            </span>
            <span className="text-[11px] text-slate-400 font-bold">/10</span>
          </div>
        </div>

        {/* Tỉ Lệ Đạt Môn */}
        <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-0.5">
            Tỉ Lệ Đạt
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono tracking-tight">
              {activeData.passRate ?? 100}%
            </span>
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold truncate mt-0.5">
            {activeData.totalPassed || 0}/{activeData.totalSubjects || 0} môn
          </div>
        </div>
      </div>

      {/* Credit Progression Bar towards Degree Completion */}
      <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-bold text-slate-700">Tiến độ tích lũy:</span>
            <span className="font-mono font-bold text-indigo-700">{currentAccumulated} TC</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {activeData.creditsPassed || currentAccumulated}/
            {activeData.creditsRegistered || currentAccumulated} TC đạt (
            {activeData.creditPassRate ?? 100}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isSlink
                ? 'bg-gradient-to-r from-violet-500 to-purple-600'
                : 'bg-gradient-to-r from-indigo-500 to-blue-600'
            }`}
            style={{ width: `${Math.max(5, creditProgressPercent)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span>0 TC</span>
          <span>
            ~{creditProgressPercent}% chương trình chuẩn (~{STANDARD_CREDITS_TARGET} TC)
          </span>
          <span>{STANDARD_CREDITS_TARGET} TC</span>
        </div>
      </div>

      {/* Detailed 4-Metric Grid */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="font-mono font-bold text-slate-800 text-sm sm:text-base">
            {activeData.creditsAccumulated || 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium truncate">TC Tích lũy</div>
        </div>
        <div className="p-2 bg-emerald-50/60 border border-emerald-100 rounded-xl">
          <div className="font-mono font-bold text-emerald-700 text-sm sm:text-base">
            {activeData.totalPassed || 0}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium truncate">Môn đã đạt</div>
        </div>
        <div
          className={`p-2 rounded-xl border ${
            (activeData.totalFailed || 0) > 0
              ? 'bg-rose-50/70 border-rose-100 text-rose-700'
              : 'bg-slate-50 border-slate-100 text-slate-800'
          }`}
        >
          <div className="font-mono font-bold text-sm sm:text-base">
            {activeData.totalFailed || 0}
          </div>
          <div
            className={`text-[10px] font-medium truncate ${
              (activeData.totalFailed || 0) > 0 ? 'text-rose-600' : 'text-slate-400'
            }`}
          >
            {(activeData.totalFailed || 0) > 0 ? 'Môn nợ' : 'Môn nợ (0)'}
          </div>
        </div>
        <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="font-mono font-bold text-slate-800 text-sm sm:text-base">
            {activeData.totalInProgress || 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium truncate">Đang học</div>
        </div>
      </div>

      {/* Grade Distribution Bar (If Available) */}
      {dist && totalGraded > 0 && (
        <GradeDistributionBar dist={dist} totalGraded={totalGraded} />
      )}

      {/* Latest Semester Snapshot (If Available) */}
      {activeData.latestSemester && (
        <div className="flex items-center justify-between p-2 bg-indigo-50/50 border border-indigo-100/70 rounded-xl text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-700 truncate">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="font-semibold truncate">{activeData.latestSemester.name}:</span>
          </div>
          <div className="flex items-center gap-2 font-mono font-bold shrink-0">
            {activeData.latestSemester.gpa4 !== null && (
              <span className="text-indigo-700">
                GPA {Number(activeData.latestSemester.gpa4).toFixed(2)}
              </span>
            )}
            {activeData.latestSemester.credits !== undefined &&
              activeData.latestSemester.credits > 0 && (
                <span className="text-slate-500 text-[10px]">
                  ({activeData.latestSemester.credits} TC)
                </span>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
