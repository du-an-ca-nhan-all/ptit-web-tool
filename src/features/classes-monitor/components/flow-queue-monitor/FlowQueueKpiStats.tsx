'use client';

import React from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { FlowQueueStats } from './types';

interface FlowQueueKpiStatsProps {
  stats: FlowQueueStats;
  isWorkerRunning: boolean;
  isSubmitting: boolean;
  selectedBatchId: string | null;
  onRecoverStuck: (batchId?: string) => void;
}

export function FlowQueueKpiStats({
  stats,
  isWorkerRunning,
  isSubmitting,
  selectedBatchId,
  onRecoverStuck,
}: FlowQueueKpiStatsProps) {
  return (
    <>
      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3.5">
        {/* Queued */}
        <div className="bg-white p-3.5 sm:p-4.5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase">Chờ</span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5 sm:mt-1">{stats.totalQueued}</div>
          <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold mt-0.5 hidden sm:block">Sẵn sàng chạy lần lượt</div>
        </div>

        {/* Running */}
        <div className="bg-white p-3.5 sm:p-4.5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase">Đang chạy</span>
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 ${isWorkerRunning ? 'animate-spin' : ''}`} />
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-600 mt-0.5 sm:mt-1">{stats.totalRunning}</div>
          <div className="text-[9px] sm:text-[10px] text-indigo-600 font-bold mt-0.5 hidden sm:block">
            {isWorkerRunning ? '🚀 Worker đang chạy...' : 'Đang nghỉ'}
          </div>
        </div>

        {/* Success */}
        <div className="bg-white p-3.5 sm:p-4.5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase">Thành công</span>
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5 sm:mt-1">{stats.totalSuccess}</div>
          <div className="text-[9px] sm:text-[10px] text-emerald-600 font-bold mt-0.5 hidden sm:block">Đã xong</div>
        </div>

        {/* Failed */}
        <div className="bg-white p-3.5 sm:p-4.5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase">Lỗi</span>
            <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 mt-0.5 sm:mt-1">{stats.totalFailed}</div>
          <div className="text-[9px] sm:text-[10px] text-rose-600 font-bold mt-0.5 hidden sm:block">
            {stats.totalFailed > 0 ? 'Cần Thử Lại' : '0 lỗi'}
          </div>
        </div>

        {/* Cancelled / Skipped */}
        <div className="bg-white p-3.5 sm:p-4.5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase">Đã Hủy</span>
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-600 mt-0.5 sm:mt-1">{stats.totalCancelled}</div>
          <div className="text-[9px] sm:text-[10px] text-purple-600 font-bold mt-0.5 hidden sm:block">Đã hủy/bỏ qua</div>
        </div>
      </div>

      {/* Cảnh báo khi có tác vụ bị kẹt RUNNING do app tắt/khởi động lại */}
      {!isWorkerRunning && stats.totalRunning > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Phát hiện {stats.totalRunning} tác vụ bị gián đoạn</span> (có thể do ứng dụng vừa khởi động lại hoặc tắt đột ngột khi đang chạy).
            </div>
          </div>
          <button
            onClick={() => onRecoverStuck(selectedBatchId || undefined)}
            disabled={isSubmitting}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            Khôi Phục & Tiếp Tục
          </button>
        </div>
      )}
    </>
  );
}
