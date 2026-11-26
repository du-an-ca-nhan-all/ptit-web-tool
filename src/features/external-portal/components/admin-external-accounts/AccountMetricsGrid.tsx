import React from 'react';
import { Users, FileKey, BookOpen, Smartphone, Server, ExternalLink } from 'lucide-react';
import { AccountMetrics } from './types';

interface AccountMetricsGridProps {
  accountsCount: number;
  totalStudents: number;
  metrics: AccountMetrics;
}

export function AccountMetricsGrid({
  accountsCount,
  totalStudents,
  metrics,
}: AccountMetricsGridProps) {
  const {
    qldttxCount,
    qldttxTokenCount,
    lmsCount,
    lmsTokenCount,
    slinkCount,
    slinkTokenCount,
    coveragePercent,
  } = metrics;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-4">
      {/* Metric 1: Total Linked */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Users className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <div className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Đã Liên Kết</div>
          <div className="text-base sm:text-2xl font-black text-slate-800 mt-0.5">
            {accountsCount}{' '}
            <span className="text-[10px] sm:text-xs font-normal text-slate-400">/ {totalStudents} SV</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-indigo-600 font-bold mt-0.5 truncate">Tỷ lệ: {coveragePercent}%</div>
        </div>
      </div>

      {/* Metric 2: QLDTTX */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <FileKey className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <div className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">QLDTTX PTTC1</div>
          <div className="text-base sm:text-2xl font-black text-emerald-600 mt-0.5">
            {qldttxCount}{' '}
            <span className="text-[10px] sm:text-xs font-normal text-slate-400">({qldttxTokenCount} Token)</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-emerald-700 font-bold mt-0.5 truncate">Sẵn sàng crawl</div>
        </div>
      </div>

      {/* Metric 3: LMS */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <div className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">LMS PTTC1</div>
          <div className="text-base sm:text-2xl font-black text-sky-600 mt-0.5">
            {lmsCount}{' '}
            <span className="text-[10px] sm:text-xs font-normal text-slate-400">({lmsTokenCount} Ses)</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-sky-700 font-bold mt-0.5 truncate">lms.pttc1.edu.vn</div>
        </div>
      </div>

      {/* Metric 4: S-Link */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <Smartphone className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <div className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">PTIT S-Link</div>
          <div className="text-base sm:text-2xl font-black text-purple-600 mt-0.5">
            {slinkCount}{' '}
            <span className="text-[10px] sm:text-xs font-normal text-slate-400">({slinkTokenCount} Tok)</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-purple-700 font-bold mt-0.5 truncate">slink.ptit.edu.vn</div>
        </div>
      </div>

      {/* Metric 5: Direct Portal Links */}
      <div className="col-span-2 sm:col-span-2 lg:col-span-1 bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
          <Server className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Cổng Mục Tiêu</div>
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-1 mt-1">
            <a
              href="https://qldttx.pttc1.edu.vn/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] sm:text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5 font-mono font-semibold truncate"
            >
              qldttx <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </a>
            <a
              href="https://lms.pttc1.edu.vn/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] sm:text-[11px] text-sky-600 hover:underline flex items-center gap-0.5 font-mono font-semibold truncate"
            >
              lms <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </a>
            <a
              href="https://slink.ptit.edu.vn/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] sm:text-[11px] text-purple-600 hover:underline flex items-center gap-0.5 font-mono font-semibold truncate"
            >
              slink <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
