import React from 'react';
import { Clock, Lock } from 'lucide-react';
import { GpaTrendItem } from '../../server/studentGradesServerService';
import { GpaModeView, GpaScaleView } from './types';
import { GpaProgressionCard } from './GpaProgressionCard';
import { GpaProgressionChart } from './GpaProgressionChart';

interface GpaProgressionTabProps {
  gpaProgression: GpaTrendItem[];
  gpaScaleView: GpaScaleView;
  setGpaScaleView: (view: GpaScaleView) => void;
  gpaModeView: GpaModeView;
  setGpaModeView: (mode: GpaModeView) => void;
}

export function GpaProgressionTab({
  gpaProgression,
  gpaScaleView,
  setGpaScaleView,
  gpaModeView,
  setGpaModeView,
}: GpaProgressionTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Scale & Mode View Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3.5 flex-wrap">
          {/* Thang Điểm */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700">Thang Điểm:</span>
            <div className="bg-slate-200/80 p-0.5 rounded-xl flex items-center text-xs font-bold">
              <button
                type="button"
                onClick={() => setGpaScaleView('scale4')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  gpaScaleView === 'scale4'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hệ 4.0
              </button>
              <button
                type="button"
                onClick={() => setGpaScaleView('scale10')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  gpaScaleView === 'scale10'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hệ 10.0
              </button>
              <button
                type="button"
                onClick={() => setGpaScaleView('both')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  gpaScaleView === 'both'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cả Hai (Song Song)
              </button>
            </div>
          </div>

          {/* Chế Độ Điểm: Đã Chốt vs Dự Kiến vs So Sánh */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700">Chế Độ Điểm:</span>
            <div className="bg-slate-200/80 p-0.5 rounded-xl flex items-center text-xs font-bold">
              <button
                type="button"
                onClick={() => setGpaModeView('OFFICIAL')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  gpaModeView === 'OFFICIAL'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Đã Chốt</span>
              </button>
              <button
                type="button"
                onClick={() => setGpaModeView('EXPECTED')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  gpaModeView === 'EXPECTED'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Dự Kiến</span>
              </button>
              <button
                type="button"
                onClick={() => setGpaModeView('BOTH')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  gpaModeView === 'BOTH'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>So Sánh Cả Hai</span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-medium self-end md:self-auto">
          Hiển thị: <b className="text-indigo-600 font-bold">{gpaScaleView === 'scale4' ? 'Hệ 4.0' : gpaScaleView === 'scale10' ? 'Hệ 10.0' : 'Hệ 4 & 10'}</b> • <b className={gpaModeView === 'OFFICIAL' ? 'text-emerald-700' : gpaModeView === 'EXPECTED' ? 'text-amber-700' : 'text-indigo-700'}>{gpaModeView === 'OFFICIAL' ? 'Chính thức đã chốt' : gpaModeView === 'EXPECTED' ? 'Toàn bộ dự kiến đạt' : 'So sánh Đã chốt & Dự kiến'}</b>
        </div>
      </div>

      {/* Semester Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {gpaProgression.map((prog, idx) => (
          <GpaProgressionCard
            key={prog.semesterId}
            prog={prog}
            isCurrent={idx === gpaProgression.length - 1}
            gpaScaleView={gpaScaleView}
            gpaModeView={gpaModeView}
          />
        ))}
      </div>

      {/* Visual Height Progression Comparison */}
      <GpaProgressionChart
        gpaProgression={gpaProgression}
        gpaScaleView={gpaScaleView}
        gpaModeView={gpaModeView}
      />
    </div>
  );
}
