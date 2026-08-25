'use client';

import React, { useState } from 'react';
import {
  Award,
  TrendingUp,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import { AcademicSummary, AcademicSourceSummary } from '../types/dashboard.types';
import { getRelativeTimeVN } from '@/src/lib/date-utils';

interface AcademicSnapshotCardsProps {
  academic: AcademicSummary;
  onNavigateToGrades: (source?: 'SLINK' | 'QLHT') => void;
  onNavigateToExternalAccounts: () => void;
}

export default function AcademicSnapshotCards({
  academic,
  onNavigateToGrades,
  onNavigateToExternalAccounts,
}: AcademicSnapshotCardsProps) {
  // Always display S-Link first by default
  const [selectedSource, setSelectedSource] = useState<'SLINK' | 'QLHT'>('SLINK');

  // Fallback construction for S-Link summary
  const slinkData: AcademicSourceSummary = academic?.slink || {
    source: 'SLINK',
    sourceName: 'PTIT S-Link',
    portalUrl: 'slink.ptit.edu.vn',
    hasData: false,
    gpa4: null,
    gpa10: null,
    creditsAccumulated: 0,
    creditsPassed: 0,
    creditsRegistered: 0,
    totalSubjects: 0,
    totalPassed: 0,
    totalFailed: 0,
    totalInProgress: 0,
    passRate: 100,
    creditPassRate: 100,
    lastSyncAt: null,
    classification: null,
    totalSemesters: 0,
    latestSemester: null,
    gradeDistribution: null,
  };

  // Fallback construction for QLHT summary
  const qlhtData: AcademicSourceSummary = academic?.qlht || {
    source: 'QLHT',
    sourceName: 'Cổng QLDTTX (QLHT)',
    portalUrl: 'qldttx.pttc1.edu.vn',
    hasData: Boolean(academic?.hasData && !academic?.slink),
    gpa4: academic?.gpa4 ?? null,
    gpa10: academic?.gpa10 ?? null,
    creditsAccumulated: academic?.creditsAccumulated ?? 0,
    creditsPassed: academic?.creditsPassed ?? 0,
    creditsRegistered: academic?.creditsRegistered ?? 0,
    totalSubjects: academic?.totalSubjects ?? 0,
    totalPassed: academic?.totalPassed ?? 0,
    totalFailed: academic?.totalFailed ?? 0,
    totalInProgress: academic?.totalInProgress ?? 0,
    passRate: academic?.passRate ?? 100,
    creditPassRate: 100,
    lastSyncAt: academic?.lastSyncAt ?? null,
    classification: academic?.classification ?? null,
    totalSemesters: 0,
    latestSemester: null,
    gradeDistribution: null,
  };

  const activeData = selectedSource === 'SLINK' ? slinkData : qlhtData;
  const otherSource: 'SLINK' | 'QLHT' = selectedSource === 'SLINK' ? 'QLHT' : 'SLINK';
  const otherData = selectedSource === 'SLINK' ? qlhtData : slinkData;

  const isSlink = selectedSource === 'SLINK';

  const gpa4 =
    activeData.gpa4 !== null && activeData.gpa4 !== undefined
      ? Number(activeData.gpa4).toFixed(2)
      : '--';
  const gpa10 =
    activeData.gpa10 !== null && activeData.gpa10 !== undefined
      ? Number(activeData.gpa10).toFixed(2)
      : '--';

  const otherGpa4 =
    otherData.gpa4 !== null && otherData.gpa4 !== undefined
      ? Number(otherData.gpa4).toFixed(2)
      : null;

  const getClassificationColor = (cls?: string | null) => {
    if (!cls) return 'bg-slate-100 text-slate-700 border-slate-200';
    if (cls.includes('Xuất sắc')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (cls.includes('Giỏi')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (cls.includes('Khá')) return 'bg-sky-50 text-sky-700 border-sky-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const getSyncLabel = (syncDate?: string | null) => {
    if (!syncDate) return 'Từ hệ thống';
    const rel = getRelativeTimeVN(syncDate);
    return rel ? `Đã đồng bộ ${rel}` : 'Đã đồng bộ gần đây';
  };

  // Standard graduation credits benchmark (~130 TC)
  const STANDARD_CREDITS_TARGET = 130;
  const currentAccumulated = activeData.creditsAccumulated || 0;
  const creditProgressPercent = Math.min(
    100,
    Math.round((currentAccumulated / STANDARD_CREDITS_TARGET) * 100)
  );

  const dist = activeData.gradeDistribution;
  const totalGraded =
    dist ? dist.aCount + dist.bCount + dist.cCount + dist.dCount + dist.fCount : 0;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 lg:p-7 border border-slate-200 shadow-sm flex flex-col justify-between h-full transition-all">
      <div className="space-y-4">
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
              onClick={() => setSelectedSource('SLINK')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                isSlink
                  ? 'bg-white text-violet-700 shadow-xs border border-violet-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem bảng điểm từ Cổng PTIT S-Link (slink.ptit.edu.vn)"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  slinkData.hasData ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                }`}
              />
              <span>S-Link</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSource('QLHT')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                !isSlink
                  ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem bảng điểm từ Cổng Quản Lý Đào Tạo (qldttx.pttc1.edu.vn)"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  qlhtData.hasData ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
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

        {/* 3. Rich Data Content (When Active Source has Data) */}
        {activeData.hasData ? (
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
                  <span className="font-mono font-bold text-indigo-700">
                    {currentAccumulated} TC
                  </span>
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
                <span>~{creditProgressPercent}% chương trình chuẩn (~{STANDARD_CREDITS_TARGET} TC)</span>
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
        ) : (
          /* Empty State for Active Source */
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
            {otherData.hasData && (
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
                  onClick={() => setSelectedSource(otherSource)}
                  className="px-2 py-1 bg-white hover:bg-slate-100 text-indigo-600 text-[11px] font-bold rounded-lg border border-slate-200 shrink-0 cursor-pointer shadow-2xs"
                >
                  Xem ngay
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Action Footer */}
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
    </div>
  );
}
