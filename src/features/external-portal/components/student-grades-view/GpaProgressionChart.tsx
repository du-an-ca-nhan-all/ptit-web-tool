import React from 'react';
import { GpaTrendItem } from '../../server/studentGradesServerService';
import { GpaModeView, GpaScaleView } from './types';

interface GpaProgressionChartProps {
  gpaProgression: GpaTrendItem[];
  gpaScaleView: GpaScaleView;
  gpaModeView: GpaModeView;
}

export function GpaProgressionChart({
  gpaProgression,
  gpaScaleView,
  gpaModeView,
}: GpaProgressionChartProps) {
  return (
    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Biểu Đồ Tương Quan GPA Qua Từng Kỳ ({gpaScaleView === 'scale4' ? 'Thang 4.0' : gpaScaleView === 'scale10' ? 'Thang 10.0' : 'Hệ 4.0 & 10.0'} • {gpaModeView === 'OFFICIAL' ? 'Đã Chốt' : gpaModeView === 'EXPECTED' ? 'Dự Kiến' : 'So Sánh Cả Hai'})
        </span>
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-indigo-600" /> GPA Kỳ</div>
          {gpaModeView !== 'EXPECTED' && (
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-emerald-500" /> GPA TL Đã Chốt</div>
          )}
          {gpaModeView !== 'OFFICIAL' && (
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-amber-500" /> GPA TL Dự Kiến</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 pt-6 pb-2 items-end min-h-[160px]">
        {gpaProgression.map((prog) => {
          const maxScale = gpaScaleView === 'scale10' ? 10.0 : 4.0;

          // Kỳ
          const semVal = gpaScaleView === 'scale10' ? (prog.gpa10 ?? 0) : (prog.gpa4 ?? 0);
          const semDisplay = gpaScaleView === 'scale10' ? prog.gpa10 : prog.gpa4;
          const semHeight = Math.max(10, (semVal / maxScale) * 120);

          // TL Đã chốt
          const cumOffVal = gpaScaleView === 'scale10' ? (prog.gpaCumulative10 ?? 0) : (prog.gpaCumulative4 ?? 0);
          const cumOffDisplay = gpaScaleView === 'scale10' ? prog.gpaCumulative10 : prog.gpaCumulative4;
          const cumOffHeight = Math.max(10, (cumOffVal / maxScale) * 120);

          // TL Dự kiến
          const cumExpVal = gpaScaleView === 'scale10'
            ? (prog.gpaCumulativeExpected10 ?? prog.gpaCumulative10 ?? 0)
            : (prog.gpaCumulativeExpected4 ?? prog.gpaCumulative4 ?? 0);
          const cumExpDisplay = gpaScaleView === 'scale10'
            ? (prog.gpaCumulativeExpected10 ?? prog.gpaCumulative10)
            : (prog.gpaCumulativeExpected4 ?? prog.gpaCumulative4);
          const cumExpHeight = Math.max(10, (cumExpVal / maxScale) * 120);

          return (
            <div key={prog.semesterId} className="flex flex-col items-center gap-2">
              <div className="flex items-end gap-1.5 sm:gap-2 h-[130px]">
                {/* Semester GPA Bar */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono font-bold text-indigo-700 text-center leading-tight">
                    {semDisplay !== null && semDisplay !== undefined ? semDisplay.toFixed(2) : ''}
                    {gpaScaleView === 'both' && prog.gpa10 !== null && (
                      <span className="block text-[8px] font-normal text-slate-500 font-sans">
                        ({prog.gpa10.toFixed(1)})
                      </span>
                    )}
                  </span>
                  <div
                    className="w-6 sm:w-10 bg-indigo-600 rounded-t-xl transition-all duration-500 shadow-sm"
                    style={{ height: `${semHeight}px` }}
                    title={`GPA Kỳ: ${prog.gpa4?.toFixed(2) ?? '—'} / 4.0 (Hệ 10: ${prog.gpa10?.toFixed(2) ?? '—'})`}
                  />
                </div>

                {/* Cumulative Official Bar */}
                {gpaModeView !== 'EXPECTED' && (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-mono font-bold text-emerald-700 text-center leading-tight">
                      {cumOffDisplay !== null && cumOffDisplay !== undefined ? cumOffDisplay.toFixed(2) : ''}
                      {gpaScaleView === 'both' && prog.gpaCumulative10 !== null && (
                        <span className="block text-[8px] font-normal text-slate-500 font-sans">
                          ({prog.gpaCumulative10.toFixed(1)})
                        </span>
                      )}
                    </span>
                    <div
                      className="w-6 sm:w-10 bg-emerald-500 rounded-t-xl transition-all duration-500 shadow-sm"
                      style={{ height: `${cumOffHeight}px` }}
                      title={`GPA Tích Lũy Đã Chốt: ${prog.gpaCumulative4?.toFixed(2) ?? '—'} / 4.0 (Hệ 10: ${prog.gpaCumulative10?.toFixed(2) ?? '—'})`}
                    />
                  </div>
                )}

                {/* Cumulative Expected Bar */}
                {gpaModeView !== 'OFFICIAL' && (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-mono font-bold text-amber-700 text-center leading-tight">
                      {cumExpDisplay !== null && cumExpDisplay !== undefined ? cumExpDisplay.toFixed(2) : ''}
                      {gpaScaleView === 'both' && (prog.gpaCumulativeExpected10 ?? prog.gpaCumulative10) !== null && (
                        <span className="block text-[8px] font-normal text-slate-500 font-sans">
                          ({(prog.gpaCumulativeExpected10 ?? prog.gpaCumulative10)?.toFixed(1)})
                        </span>
                      )}
                    </span>
                    <div
                      className="w-6 sm:w-10 bg-amber-500 rounded-t-xl transition-all duration-500 shadow-sm"
                      style={{ height: `${cumExpHeight}px` }}
                      title={`GPA Tích Lũy Dự Kiến: ${(prog.gpaCumulativeExpected4 ?? prog.gpaCumulative4)?.toFixed(2) ?? '—'} / 4.0 (Hệ 10: ${(prog.gpaCumulativeExpected10 ?? prog.gpaCumulative10)?.toFixed(2) ?? '—'})`}
                    />
                  </div>
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-700 text-center truncate max-w-[120px]">
                {prog.semesterId}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
