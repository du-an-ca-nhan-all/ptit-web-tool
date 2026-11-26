'use client';

import React from 'react';
import { Check, Copy, Crown, Download, RefreshCw, Split } from 'lucide-react';

interface MonitorRoomAnalysisHeaderProps {
  copied: boolean;
  isLoading: boolean;
  onCopyResult: () => void;
  onExportCSV: () => void;
  onRefresh: () => void;
}

export default function MonitorRoomAnalysisHeader({
  copied,
  isLoading,
  onCopyResult,
  onExportCSV,
  onRefresh,
}: MonitorRoomAnalysisHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Split className="w-7 h-7 text-rose-600" />
            Lọc Tách Phòng &amp; Sĩ Số Phòng Thi
          </h2>
          <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
            <Crown className="w-3.5 h-3.5" /> Lớp Trưởng
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Lọc sinh viên bị tách phòng (cùng hoặc khác tổ/nhóm) dựa theo phòng thi của Lớp trưởng,
          lọc phòng theo số lượng thành viên (&gt; / &lt; N) cho Cả lớp hoặc AE ôn tập.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onCopyResult}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Đã sao chép' : 'Copy kết quả'}
        </button>

        <button
          type="button"
          onClick={onExportCSV}
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          Xuất CSV
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>
    </div>
  );
}
