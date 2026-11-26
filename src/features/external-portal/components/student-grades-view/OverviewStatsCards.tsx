import React from 'react';
import { Clock, Info, Lock, TrendingUp } from 'lucide-react';
import { StudentGradesResult } from '../../server/studentGradesServerService';
import { DataSource } from './types';
import { getRelativeSyncTime } from './utils';

interface OverviewStatsCardsProps {
  dataSource: DataSource;
  summary?: StudentGradesResult['summary'];
  lastSyncAt?: string | null;
  onOpenGpaModal: () => void;
  onOpenCreditsModal: () => void;
}

export function OverviewStatsCards({
  dataSource,
  summary,
  lastSyncAt,
  onOpenGpaModal,
  onOpenCreditsModal,
}: OverviewStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: GPA Cumulative & Expected (Dual Scale: Hệ 4 & Hệ 10) */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl p-5 shadow-sm border border-indigo-700/50 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">GPA Tích Lũy</span>
              <button
                type="button"
                onClick={onOpenGpaModal}
                className="p-1 hover:bg-white/10 rounded-full text-indigo-300 hover:text-white transition cursor-pointer"
                title="Xem giải thích chi tiết điểm GPA Hệ 4 & Hệ 10 (Đã chốt vs Dự kiến)"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={onOpenGpaModal}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-indigo-100 hover:bg-white/20 border border-white/20 transition cursor-pointer"
            >
              Chi tiết
            </button>
          </div>

          <div className="mt-2.5">
            {/* Primary: Đã chốt chính thức */}
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2 flex-wrap">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight font-mono text-white">
                    {summary?.gpa4 !== null && summary?.gpa4 !== undefined ? summary.gpa4.toFixed(2) : '—'}
                  </span>
                  <span className="text-xs text-indigo-200 font-bold">/ 4.0</span>
                </div>
                <div className="flex items-baseline gap-1 text-indigo-100 bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
                  <span className="text-[11px] text-indigo-200">Hệ 10:</span>
                  <span className="font-mono font-bold text-sm text-white">
                    {summary?.gpa10 !== null && summary?.gpa10 !== undefined ? summary.gpa10.toFixed(2) : '—'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/40 flex items-center gap-1 shrink-0">
                <Lock className="w-2.5 h-2.5 text-emerald-400" /> Đã chốt
              </span>
            </div>

            {/* Secondary: Dự kiến (toàn bộ môn đạt) */}
            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-dashed border-indigo-700/60 text-xs">
              <span className="text-indigo-200 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Dự kiến:</span>
              </span>
              <div className="flex items-baseline gap-2 font-mono text-xs">
                <span className="font-bold text-amber-300">
                  {summary?.gpa4Expected !== null && summary?.gpa4Expected !== undefined
                    ? summary.gpa4Expected.toFixed(2)
                    : summary?.gpa4 !== null && summary?.gpa4 !== undefined
                    ? summary.gpa4.toFixed(2)
                    : '—'}
                  <span className="text-[10px] text-indigo-200 font-normal ml-0.5">/ 4.0</span>
                </span>
                <span className="text-indigo-300">•</span>
                <span className="font-bold text-cyan-300">
                  Hệ 10: {summary?.gpa10Expected !== null && summary?.gpa10Expected !== undefined
                    ? summary.gpa10Expected.toFixed(2)
                    : summary?.gpa10 !== null && summary?.gpa10 !== undefined
                    ? summary.gpa10.toFixed(2)
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2.5 mt-2 border-t border-indigo-700/60 flex items-center justify-between text-xs text-indigo-200">
          <span>Học lực: <b className="text-emerald-300">{summary?.classification || 'Khá'}</b></span>
          <span className="text-[11px] text-indigo-300">Hệ 4.0 & Hệ 10.0</span>
        </div>
      </div>

      {/* Card 2: Credits Earned (Both Official & Expected with Detailed Explanation) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tín Chỉ Tích Lũy</span>
              <button
                type="button"
                onClick={onOpenCreditsModal}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                title="Xem giải thích chi tiết số tín chỉ Đã chốt vs Dự kiến"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={onOpenCreditsModal}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
            >
              Chi tiết
            </button>
          </div>

          <div className="mt-2.5">
            {/* Primary: Đã chốt chính thức */}
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  {summary?.totalCreditsAccumulated || 0}
                </span>
                <span className="text-xs text-slate-400 font-bold">/ {summary?.curriculumTargetCredits || 150} TC</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Đã chốt
              </span>
            </div>

            {/* Secondary: Dự kiến (toàn bộ môn đạt) */}
            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-dashed border-slate-100 text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Dự kiến đạt:</span>
              </span>
              <span className="font-mono font-bold text-indigo-600">
                {summary?.totalCreditsAccumulatedExpected ?? summary?.totalCreditsAccumulated ?? 0} / {summary?.curriculumTargetCredits || 150} TC
                <span className="text-slate-400 font-normal ml-1">({summary?.graduationProgressRateExpected ?? summary?.graduationProgressRate ?? 0}%)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Dual-stage Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-slate-100 rounded-full h-2 relative overflow-hidden">
            {/* Expected progress (Background bar) */}
            <div
              className="bg-teal-300 h-2 rounded-full absolute left-0 top-0 transition-all duration-500"
              style={{ width: `${Math.min(100, summary?.graduationProgressRateExpected || 0)}%` }}
            />
            {/* Official progress (Foreground bar) */}
            <div
              className="bg-emerald-500 h-2 rounded-full absolute left-0 top-0 transition-all duration-500"
              style={{ width: `${Math.min(100, summary?.graduationProgressRate || 0)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
            <span>Tiến độ: <b className="font-bold text-emerald-600 font-mono">{summary?.graduationProgressRate || 0}%</b> (chính thức)</span>
            <span>Tổng đạt: <b className="font-bold text-slate-700 font-mono">{summary?.totalPassedCredits || 0} TC</b></span>
          </div>
        </div>
      </div>

      {/* Card 3: Completion & Pass Rate */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỉ Lệ Đạt Môn</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl sm:text-4xl font-black text-blue-600 font-mono">
              {summary?.passRate || 0}%
            </span>
            <span className="text-xs text-slate-400 font-bold">hoàn thành</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>Đạt: <b className="text-emerald-600 font-bold">{summary?.totalPassedSubjects || 0} môn</b></span>
          <span>Rớt: <b className="text-rose-600 font-bold">{summary?.totalFailedSubjects || 0} môn</b></span>
        </div>
      </div>

      {/* Card 4: In-Progress / Current Term */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Môn Đang Học</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl sm:text-4xl font-black text-amber-600 font-mono">
              {summary?.totalInProgressSubjects || 0}
            </span>
            <span className="text-xs text-slate-400 font-bold">môn ({summary?.totalInProgressCredits || 0} TC)</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1 text-[11px] text-slate-500" title={`Thời gian hệ thống kéo điểm từ Cổng ${dataSource === 'SLINK' ? 'PTIT S-Link' : 'QLDTTX'}`}>
            <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Đồng bộ: <b className="text-slate-800">{lastSyncAt ? getRelativeSyncTime(lastSyncAt) || 'Vừa xong' : '—'}</b></span>
          </span>
          <span className="font-bold text-indigo-600">Kỳ hiện tại</span>
        </div>
      </div>
    </div>
  );
}
