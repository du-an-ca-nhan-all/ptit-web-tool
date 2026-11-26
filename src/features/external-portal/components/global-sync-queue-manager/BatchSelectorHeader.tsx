'use client';

import React from 'react';
import {
  Play,
  XCircle,
  Trash2,
  Layers,
  RotateCcw,
} from 'lucide-react';
import {
  GlobalSyncBatchItem,
  GlobalSyncStats,
} from '../../hooks/useGlobalSyncQueue';

interface BatchSelectorHeaderProps {
  batches: GlobalSyncBatchItem[];
  selectedBatchId: string | null;
  activeBatch: GlobalSyncBatchItem | null;
  batchProgress: number;
  stats: GlobalSyncStats;
  isWorkerRunning: boolean;
  isSubmitting: boolean;
  onSelectBatch: (batchId: string) => void;
  onRecoverStuckQueue: () => void;
  onResumeWorker: () => void;
  onRetryFailedQueue: () => void;
  onCancelPendingQueue: () => void;
  onClearCompletedBatches: () => void;
}

export function BatchSelectorHeader({
  batches,
  selectedBatchId,
  activeBatch,
  batchProgress,
  stats,
  isWorkerRunning,
  isSubmitting,
  onSelectBatch,
  onRecoverStuckQueue,
  onResumeWorker,
  onRetryFailedQueue,
  onCancelPendingQueue,
  onClearCompletedBatches,
}: BatchSelectorHeaderProps) {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            <span>Các Đợt Đồng Bộ Gần Nhất</span>
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500">
            Chọn đợt chạy để theo dõi tiến độ chi tiết từng sinh viên
          </p>
        </div>

        {/* Action buttons (grid 2-cols on mobile, flex on desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 w-full md:w-auto">
          {!isWorkerRunning && (stats.QUEUED > 0 || stats.RUNNING > 0) && (
            <button
              type="button"
              onClick={() => (stats.RUNNING > 0 ? onRecoverStuckQueue() : onResumeWorker())}
              disabled={isSubmitting}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{stats.RUNNING > 0 ? 'Khôi Phục' : 'Chạy Tiếp'}</span>
            </button>
          )}

          {stats.FAILED > 0 && (
            <button
              type="button"
              onClick={onRetryFailedQueue}
              disabled={isSubmitting}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Thử Lại ({stats.FAILED})</span>
            </button>
          )}

          {(stats.QUEUED > 0 || stats.RUNNING > 0) && (
            <button
              type="button"
              onClick={onCancelPendingQueue}
              disabled={isSubmitting}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Hủy ({stats.QUEUED + stats.RUNNING})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClearCompletedBatches}
            disabled={isSubmitting}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-600 border border-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Dọn Dẹp Xong</span>
          </button>
        </div>
      </div>

      {/* BATCH TABS (Horizontal Scroll on mobile) */}
      {batches.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {batches.map((batch) => {
            const isSelected = selectedBatchId === batch.id;
            const isDone = batch.status === 'COMPLETED';
            const isProcessing = batch.status === 'PROCESSING';

            return (
              <button
                type="button"
                key={batch.id}
                onClick={() => onSelectBatch(batch.id)}
                className={`px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl text-left shrink-0 transition-all border cursor-pointer min-w-[200px] sm:min-w-[220px] ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold truncate max-w-[150px] sm:max-w-[170px]">
                    {batch.title}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : isProcessing
                        ? 'bg-blue-500/20 text-blue-300 animate-pulse'
                        : 'bg-slate-500/20 text-slate-300'
                    }`}
                  >
                    {batch.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 mt-1">
                  <span>{batch.successCount}/{batch.totalItems} OK</span>
                  <span>•</span>
                  <span>{new Date(batch.createdAt).toLocaleTimeString('vi-VN')}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="py-6 text-center text-slate-400 text-xs">
          Chưa có đợt chạy đồng bộ nào trong hệ thống. Bạn có thể nhấn nút đồng bộ ở trên để kích hoạt.
        </div>
      )}

      {/* ACTIVE BATCH PROGRESS BAR */}
      {activeBatch && (
        <div className="p-3.5 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 space-y-2.5 sm:space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <span className="font-bold text-slate-700 truncate">
              Tiến độ: {activeBatch.title} ({batchProgress}%)
            </span>
            <span className="font-mono text-[11px] sm:text-xs text-slate-500">
              Thành công: <strong className="text-emerald-600">{activeBatch.successCount}</strong> /
              {' '}Lỗi: <strong className="text-rose-600">{activeBatch.failedCount}</strong> /
              {' '}Bỏ qua: <strong className="text-slate-500">{activeBatch.skippedCount}</strong> /
              {' '}Tổng: <strong className="text-slate-800">{activeBatch.totalItems}</strong>
            </span>
          </div>
          <div className="w-full h-2 sm:h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{
                width: `${activeBatch.totalItems > 0 ? (activeBatch.successCount / activeBatch.totalItems) * 100 : 0}%`,
              }}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-300"
              style={{
                width: `${activeBatch.totalItems > 0 ? (activeBatch.failedCount / activeBatch.totalItems) * 100 : 0}%`,
              }}
            />
            <div
              className="bg-slate-400 h-full transition-all duration-300"
              style={{
                width: `${activeBatch.totalItems > 0 ? (activeBatch.skippedCount / activeBatch.totalItems) * 100 : 0}%`,
              }}
            />
            <div
              className="bg-blue-500 h-full transition-all duration-300 animate-pulse"
              style={{
                width: `${activeBatch.totalItems > 0 ? (activeBatch.processingCount / activeBatch.totalItems) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
