'use client';

import React from 'react';
import {
  Play,
  RefreshCw,
  Trash2,
  X,
  RotateCcw,
} from 'lucide-react';
import { FlowBatchItem, FlowQueueStats } from './types';

interface FlowQueueActiveBatchCardProps {
  activeBatch: FlowBatchItem | null;
  batches: FlowBatchItem[];
  batchProgress: number;
  stats: FlowQueueStats;
  isWorkerRunning: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  selectedBatchId: string | null;
  onSelectBatch: (batchId: string | null) => void;
  onRecoverStuck: (batchId?: string) => void;
  onResumeWorker: () => void;
  onCancelPending: (batchId?: string) => void;
  onRetryFailed: (batchId?: string) => void;
  onRefresh: (batchId?: string) => void;
  onClearCompleted: () => void;
}

export function FlowQueueActiveBatchCard({
  activeBatch,
  batches,
  batchProgress,
  stats,
  isWorkerRunning,
  isLoading,
  isSubmitting,
  selectedBatchId,
  onSelectBatch,
  onRecoverStuck,
  onResumeWorker,
  onCancelPending,
  onRetryFailed,
  onRefresh,
  onClearCompleted,
}: FlowQueueActiveBatchCardProps) {
  return (
    <>
      {/* Active Batch Progress Card & Controls */}
      {activeBatch && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    activeBatch.status === 'PROCESSING'
                      ? 'bg-amber-400 text-slate-900 animate-pulse'
                      : activeBatch.status === 'COMPLETED'
                      ? 'bg-emerald-400 text-slate-900'
                      : activeBatch.status === 'FAILED'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {activeBatch.status === 'PROCESSING'
                    ? 'ĐANG XỬ LÝ'
                    : activeBatch.status === 'COMPLETED'
                    ? 'HOÀN THÀNH'
                    : activeBatch.status === 'FAILED'
                    ? 'THẤT BẠI'
                    : 'ĐANG CHỜ'}
                </span>
                <h3 className="font-black text-sm sm:text-base text-white">{activeBatch.title}</h3>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
                Batch: <span className="font-mono text-slate-300">{activeBatch.id}</span> • {' '}
                {new Date(activeBatch.createdAt).toLocaleTimeString('vi-VN')}{' '}
                {new Date(activeBatch.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>

            {/* Queue Control Buttons */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              {!isWorkerRunning && (stats.totalQueued > 0 || stats.totalRunning > 0) && (
                <button
                  onClick={() => (stats.totalRunning > 0 ? onRecoverStuck(selectedBatchId || undefined) : onResumeWorker())}
                  disabled={isSubmitting}
                  className="px-3 py-2 sm:px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Chạy tiếp hoặc khôi phục tác vụ"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{stats.totalRunning > 0 ? 'Khôi Phục' : 'Chạy Tiếp'}</span>
                </button>
              )}

              {(stats.totalQueued > 0 || stats.totalRunning > 0) && (
                <button
                  onClick={() => onCancelPending(selectedBatchId || undefined)}
                  disabled={isSubmitting}
                  className="px-3 py-2 sm:px-3.5 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-colors border border-rose-500/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Hủy các tác vụ đang chờ hoặc đang chạy trong Queue"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Hủy Hàng Đợi</span>
                </button>
              )}

              {stats.totalFailed > 0 && (
                <button
                  onClick={() => onRetryFailed(selectedBatchId || undefined)}
                  disabled={isSubmitting}
                  className="px-3 py-2 sm:px-3.5 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-black rounded-xl sm:rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Chạy lại tất cả các tác vụ bị lỗi"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Thử Lại ({stats.totalFailed})</span>
                </button>
              )}

              <button
                onClick={() => onRefresh(selectedBatchId || undefined)}
                disabled={isLoading}
                className="px-3 py-2 sm:px-3.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-colors border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Làm Mới</span>
              </button>

              <button
                onClick={onClearCompleted}
                disabled={isSubmitting || batches.length === 0}
                className="px-3 py-2 sm:px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl sm:rounded-2xl transition-colors border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 col-span-2 sm:col-span-1"
                title="Dọn dẹp các đợt đã hoàn thành"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Dọn Dẹp Xong</span>
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-300 font-bold">
              <span>
                Tiến độ đợt:{' '}
                <strong className="text-amber-300 font-mono">
                  {activeBatch.successCount + activeBatch.failedCount + activeBatch.cancelledCount} /{' '}
                  {activeBatch.totalItems}
                </strong>{' '}
                SV
              </span>
              <span className="font-mono text-amber-300">{batchProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  activeBatch.status === 'COMPLETED'
                    ? 'bg-emerald-500'
                    : activeBatch.status === 'FAILED'
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-amber-400 to-emerald-400 animate-pulse'
                }`}
                style={{ width: `${batchProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Batches Selector Strip */}
      {batches.length > 1 && (
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scroll-smooth snap-x">
          <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase shrink-0">Các đợt:</span>
          <button
            onClick={() => onSelectBatch(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 snap-start transition-all cursor-pointer ${
              !selectedBatchId
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Tất Cả ({batches.length})
          </button>
          {batches.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelectBatch(b.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 snap-start transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedBatchId === b.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  b.status === 'PROCESSING'
                    ? 'bg-amber-400 animate-ping'
                    : b.status === 'COMPLETED'
                    ? 'bg-emerald-500'
                    : b.status === 'FAILED'
                    ? 'bg-rose-500'
                    : 'bg-slate-400'
                }`}
              />
              <span className="truncate max-w-[120px] sm:max-w-[180px]">{b.title}</span>
              <span className="text-[10px] opacity-70 font-mono">({b.totalItems})</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
