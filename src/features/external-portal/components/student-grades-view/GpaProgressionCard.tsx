import React from 'react';
import { Clock, Lock } from 'lucide-react';
import { GpaTrendItem } from '../../server/studentGradesServerService';
import { GpaModeView, GpaScaleView } from './types';

interface GpaProgressionCardProps {
  prog: GpaTrendItem;
  isCurrent: boolean;
  gpaScaleView: GpaScaleView;
  gpaModeView: GpaModeView;
}

export function GpaProgressionCard({
  prog,
  isCurrent,
  gpaScaleView,
  gpaModeView,
}: GpaProgressionCardProps) {
  // GPA Học Kỳ
  const semGpa4 = prog.gpa4;
  const semGpa10 = prog.gpa10;

  // GPA Tích Lũy: Đã chốt vs Dự kiến
  const cumOfficial4 = prog.gpaCumulative4;
  const cumOfficial10 = prog.gpaCumulative10;
  const cumExpected4 = prog.gpaCumulativeExpected4 ?? prog.gpaCumulative4;
  const cumExpected10 = prog.gpaCumulativeExpected10 ?? prog.gpaCumulative10;

  return (
    <div
      className={`rounded-2xl p-4 border transition-all ${
        isCurrent
          ? 'bg-indigo-50/50 border-indigo-300 shadow-xs'
          : 'bg-slate-50 border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="font-bold text-slate-800">{prog.semesterName}</span>
        <span className="font-mono text-[10px] text-slate-400 font-bold">HK {prog.semesterId}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 my-3">
        {/* Col 1: GPA Học Kỳ */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">GPA Học Kỳ</span>
            {gpaScaleView === 'scale4' ? (
              <>
                <div className="text-lg font-black font-mono text-indigo-600 mt-0.5">
                  {semGpa4 !== null && semGpa4 !== undefined ? semGpa4.toFixed(2) : '—'}
                  <span className="text-[10px] font-normal text-slate-400 ml-1">/ 4.0</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                  Hệ 10: {semGpa10 !== null && semGpa10 !== undefined ? semGpa10.toFixed(2) : '—'}
                </span>
              </>
            ) : gpaScaleView === 'scale10' ? (
              <>
                <div className="text-lg font-black font-mono text-indigo-600 mt-0.5">
                  {semGpa10 !== null && semGpa10 !== undefined ? semGpa10.toFixed(2) : '—'}
                  <span className="text-[10px] font-normal text-slate-400 ml-1">/ 10.0</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                  Hệ 4: {semGpa4 !== null && semGpa4 !== undefined ? semGpa4.toFixed(2) : '—'}
                </span>
              </>
            ) : (
              <>
                <div className="text-base font-black font-mono text-indigo-600 mt-0.5">
                  {semGpa4 !== null && semGpa4 !== undefined ? semGpa4.toFixed(2) : '—'}
                  <span className="text-[9px] font-normal text-slate-400 ml-0.5">/ 4</span>
                </div>
                <span className="text-[10px] text-slate-700 font-mono font-bold block mt-0.5">
                  Hệ 10: {semGpa10 !== null && semGpa10 !== undefined ? semGpa10.toFixed(2) : '—'}
                </span>
              </>
            )}
          </div>
          <span className="text-[9px] text-slate-400 mt-1">Điểm kỳ này</span>
        </div>

        {/* Col 2: GPA Tích Lũy (Chốt / Dự kiến / So sánh) */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">GPA Tích Lũy</span>
              {gpaModeView === 'OFFICIAL' ? (
                <span className="text-[9px] font-bold text-emerald-700 flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Chốt
                </span>
              ) : gpaModeView === 'EXPECTED' ? (
                <span className="text-[9px] font-bold text-amber-700 flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" /> Dự kiến
                </span>
              ) : (
                <span className="text-[9px] font-bold text-indigo-600">Đã chốt & DK</span>
              )}
            </div>

            {gpaModeView === 'OFFICIAL' ? (
              gpaScaleView === 'scale4' ? (
                <>
                  <div className="text-lg font-black font-mono text-emerald-600 mt-0.5">
                    {cumOfficial4 !== null && cumOfficial4 !== undefined ? cumOfficial4.toFixed(2) : '—'}
                    <span className="text-[10px] font-normal text-slate-400 ml-1">/ 4.0</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    Hệ 10: {cumOfficial10 !== null && cumOfficial10 !== undefined ? cumOfficial10.toFixed(2) : '—'}
                  </span>
                </>
              ) : gpaScaleView === 'scale10' ? (
                <>
                  <div className="text-lg font-black font-mono text-emerald-600 mt-0.5">
                    {cumOfficial10 !== null && cumOfficial10 !== undefined ? cumOfficial10.toFixed(2) : '—'}
                    <span className="text-[10px] font-normal text-slate-400 ml-1">/ 10.0</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    Hệ 4: {cumOfficial4 !== null && cumOfficial4 !== undefined ? cumOfficial4.toFixed(2) : '—'}
                  </span>
                </>
              ) : (
                <>
                  <div className="text-base font-black font-mono text-emerald-600 mt-0.5">
                    {cumOfficial4 !== null && cumOfficial4 !== undefined ? cumOfficial4.toFixed(2) : '—'}
                    <span className="text-[9px] font-normal text-slate-400 ml-0.5">/ 4</span>
                  </div>
                  <span className="text-[10px] text-slate-700 font-mono font-bold block mt-0.5">
                    Hệ 10: {cumOfficial10 !== null && cumOfficial10 !== undefined ? cumOfficial10.toFixed(2) : '—'}
                  </span>
                </>
              )
            ) : gpaModeView === 'EXPECTED' ? (
              gpaScaleView === 'scale4' ? (
                <>
                  <div className="text-lg font-black font-mono text-amber-600 mt-0.5">
                    {cumExpected4 !== null && cumExpected4 !== undefined ? cumExpected4.toFixed(2) : '—'}
                    <span className="text-[10px] font-normal text-slate-400 ml-1">/ 4.0</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    Hệ 10: {cumExpected10 !== null && cumExpected10 !== undefined ? cumExpected10.toFixed(2) : '—'}
                  </span>
                </>
              ) : gpaScaleView === 'scale10' ? (
                <>
                  <div className="text-lg font-black font-mono text-amber-600 mt-0.5">
                    {cumExpected10 !== null && cumExpected10 !== undefined ? cumExpected10.toFixed(2) : '—'}
                    <span className="text-[10px] font-normal text-slate-400 ml-1">/ 10.0</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    Hệ 4: {cumExpected4 !== null && cumExpected4 !== undefined ? cumExpected4.toFixed(2) : '—'}
                  </span>
                </>
              ) : (
                <>
                  <div className="text-base font-black font-mono text-amber-600 mt-0.5">
                    {cumExpected4 !== null && cumExpected4 !== undefined ? cumExpected4.toFixed(2) : '—'}
                    <span className="text-[9px] font-normal text-slate-400 ml-0.5">/ 4</span>
                  </div>
                  <span className="text-[10px] text-slate-700 font-mono font-bold block mt-0.5">
                    Hệ 10: {cumExpected10 !== null && cumExpected10 !== undefined ? cumExpected10.toFixed(2) : '—'}
                  </span>
                </>
              )
            ) : (
              /* BOTH: So sánh Đã chốt vs Dự kiến */
              <div className="mt-1 space-y-1 text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] text-emerald-800 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5 text-emerald-600" /> Chốt:
                  </span>
                  <span className="font-mono font-black text-emerald-700">
                    {gpaScaleView === 'scale10'
                      ? (cumOfficial10 !== null && cumOfficial10 !== undefined ? cumOfficial10.toFixed(2) : '—')
                      : (cumOfficial4 !== null && cumOfficial4 !== undefined ? cumOfficial4.toFixed(2) : '—')}
                    {gpaScaleView === 'both' && (
                      <span className="text-[10px] font-normal text-slate-500 ml-1">({cumOfficial10?.toFixed(2) ?? '—'})</span>
                    )}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1 border-t border-dashed border-slate-200">
                  <span className="text-[10px] text-amber-800 font-bold flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5 text-amber-600" /> Dự kiến:
                  </span>
                  <span className="font-mono font-black text-amber-700">
                    {gpaScaleView === 'scale10'
                      ? (cumExpected10 !== null && cumExpected10 !== undefined ? cumExpected10.toFixed(2) : '—')
                      : (cumExpected4 !== null && cumExpected4 !== undefined ? cumExpected4.toFixed(2) : '—')}
                    {gpaScaleView === 'both' && (
                      <span className="text-[10px] font-normal text-slate-500 ml-1">({cumExpected10?.toFixed(2) ?? '—'})</span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
          <span className="text-[9px] text-slate-400 mt-1">Lũy kế đến kỳ này</span>
        </div>
      </div>

      {/* Credits Strip */}
      <div className="flex flex-col gap-1 text-xs text-slate-600 pt-2.5 border-t border-slate-200/60">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-emerald-800 font-bold">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Đã chốt:</span>
          </span>
          <span className="font-mono font-black text-emerald-700">
            {prog.creditsAccumulatedSemester ?? prog.creditsSemester} TC
            <span className="font-normal text-slate-400 text-[10px] ml-1">(Lũy kế: {prog.creditsCumulative} TC)</span>
          </span>
        </div>

        {(prog.creditsPendingSemester ?? 0) > 0 && (
          <div className="flex items-center justify-between text-amber-900 font-bold bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-200/80 mt-0.5">
            <span className="flex items-center gap-1 text-[11px]">
              <Clock className="w-2.5 h-2.5 text-amber-600" />
              <span>Chưa chốt (dự kiến):</span>
            </span>
            <span className="font-mono font-black text-amber-700 text-[11px]">
              +{prog.creditsPendingSemester} TC
              {prog.creditsCumulativeExpected ? (
                <span className="font-normal text-slate-500 text-[10px] ml-1">(LK dự kiến: {prog.creditsCumulativeExpected} TC)</span>
              ) : null}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
          <span>Tổng TC đạt kỳ:</span>
          <span className="font-mono font-bold text-slate-600">{prog.creditsSemester} TC</span>
        </div>
      </div>
    </div>
  );
}
