'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { GlobalSyncStats } from '../../hooks/useGlobalSyncQueue';

interface StatsOverviewCardsProps {
  stats: GlobalSyncStats;
  statusFilter: string;
  isWorkerRunning: boolean;
  isSubmitting: boolean;
  onSelectStatusFilter: (status: string) => void;
  onRecoverStuckQueue: () => void;
}

export function StatsOverviewCards({
  stats,
  statusFilter,
  isWorkerRunning,
  isSubmitting,
  onSelectStatusFilter,
  onRecoverStuckQueue,
}: StatsOverviewCardsProps) {
  const totalCount =
    stats.QUEUED +
    stats.RUNNING +
    stats.SUCCESS +
    stats.FAILED +
    stats.CANCELLED +
    stats.SKIPPED;

  return (
    <>
      {/* STATS OVERVIEW CARDS (2 cols on mobile, 3 on tablet, 6 on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
        <div
          onClick={() => onSelectStatusFilter('ALL')}
          className={`p-3 sm:p-4 bg-white rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider truncate">
            Tổng Tác Vụ
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-800 mt-0.5 sm:mt-1">
            {totalCount}
          </div>
          <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 truncate">
            Tất cả trạng thái
          </div>
        </div>

        <div
          onClick={() => onSelectStatusFilter('QUEUED')}
          className={`p-3 sm:p-4 bg-white rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'QUEUED'
              ? 'border-amber-500 ring-2 ring-amber-100 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] sm:text-[11px] font-extrabold text-amber-600 uppercase tracking-wider truncate">
            Đang Chờ
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-600 mt-0.5 sm:mt-1">
            {stats.QUEUED}
          </div>
          <div className="text-[9px] sm:text-[10px] text-amber-700/70 mt-0.5 truncate">
            Trong hàng đợi
          </div>
        </div>

        <div
          onClick={() => onSelectStatusFilter('RUNNING')}
          className={`p-3 sm:p-4 bg-white rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'RUNNING'
              ? 'border-blue-500 ring-2 ring-blue-100 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] sm:text-[11px] font-extrabold text-blue-600 uppercase tracking-wider truncate">
            Đang Chạy
          </div>
          <div className="text-lg sm:text-2xl font-black text-blue-600 mt-0.5 sm:mt-1">
            {stats.RUNNING}
          </div>
          <div className="text-[9px] sm:text-[10px] text-blue-700/70 mt-0.5 truncate">
            Đang gọi cổng
          </div>
        </div>

        <div
          onClick={() => onSelectStatusFilter('SUCCESS')}
          className={`p-3 sm:p-4 bg-white rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'SUCCESS'
              ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] sm:text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider truncate">
            Thành Công
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-600 mt-0.5 sm:mt-1">
            {stats.SUCCESS}
          </div>
          <div className="text-[9px] sm:text-[10px] text-emerald-700/70 mt-0.5 truncate">
            Đồng bộ hoàn tất
          </div>
        </div>

        <div
          onClick={() => onSelectStatusFilter('FAILED')}
          className={`p-3 sm:p-4 bg-white rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'FAILED'
              ? 'border-rose-500 ring-2 ring-rose-100 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] sm:text-[11px] font-extrabold text-rose-600 uppercase tracking-wider truncate">
            Thất Bại
          </div>
          <div className="text-lg sm:text-2xl font-black text-rose-600 mt-0.5 sm:mt-1">
            {stats.FAILED}
          </div>
          <div className="text-[9px] sm:text-[10px] text-rose-700/70 mt-0.5 truncate">
            Cần thử lại
          </div>
        </div>

        <div
          onClick={() => onSelectStatusFilter('CANCELLED')}
          className={`p-3 sm:p-4 bg-white rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'CANCELLED'
              ? 'border-slate-500 ring-2 ring-slate-100 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider truncate">
            Bỏ Qua / Hủy
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-600 mt-0.5 sm:mt-1">
            {stats.CANCELLED + stats.SKIPPED}
          </div>
          <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 truncate">
            Chưa liên kết / Hủy
          </div>
        </div>
      </div>

      {/* Cảnh báo khi có tác vụ bị kẹt RUNNING do app tắt/khởi động lại */}
      {!isWorkerRunning && stats.RUNNING > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold">Phát hiện {stats.RUNNING} tác vụ đang ở trạng thái RUNNING</span> nhưng Worker hiện không chạy (có thể do ứng dụng vừa khởi động lại hoặc tắt đột ngột khi đang đồng bộ).
            </div>
          </div>
          <button
            type="button"
            onClick={onRecoverStuckQueue}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50 text-center"
          >
            Khôi Phục &amp; Chạy Tiếp
          </button>
        </div>
      )}
    </>
  );
}
