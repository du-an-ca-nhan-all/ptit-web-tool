'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
} from 'lucide-react';
import { useFlowQueue } from '../hooks/useFlowQueue';
import { FlowQueueMonitorProps } from './flow-queue-monitor/types';
import {
  filterQueueItems,
  findActiveBatch,
  calculateBatchProgress,
} from './flow-queue-monitor/utils';
import { FlowQueueKpiStats } from './flow-queue-monitor/FlowQueueKpiStats';
import { FlowQueueActiveBatchCard } from './flow-queue-monitor/FlowQueueActiveBatchCard';
import { FlowQueueFiltersBar } from './flow-queue-monitor/FlowQueueFiltersBar';
import { FlowQueueMobileCards } from './flow-queue-monitor/FlowQueueMobileCards';
import { FlowQueueDesktopTable } from './flow-queue-monitor/FlowQueueDesktopTable';

export default function FlowQueueMonitor({
  currentUser,
  selectedClass,
}: FlowQueueMonitorProps) {
  const {
    batches,
    queueItems,
    stats,
    isWorkerRunning,
    isLoading,
    isSubmitting,
    selectedBatchId,
    setSelectedBatchId,
    message,
    setMessage,
    errorMessage,
    setErrorMessage,
    fetchQueueData,
    cancelPendingQueue,
    retryFailedQueue,
    clearCompletedBatches,
    resumeWorker,
    recoverStuckQueue,
  } = useFlowQueue(currentUser, selectedClass);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtered queue items
  const filteredQueueItems = useMemo(
    () => filterQueueItems(queueItems, searchQuery, statusFilter),
    [queueItems, searchQuery, statusFilter]
  );

  // Selected batch object
  const activeBatch = useMemo(
    () => findActiveBatch(batches, selectedBatchId),
    [batches, selectedBatchId]
  );

  // Progress percentage of active batch
  const batchProgress = useMemo(
    () => calculateBatchProgress(activeBatch),
    [activeBatch]
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {message && (
        <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-2xl sm:rounded-3xl text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-2xl sm:rounded-3xl text-rose-700 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <FlowQueueKpiStats
        stats={stats}
        isWorkerRunning={isWorkerRunning}
        isSubmitting={isSubmitting}
        selectedBatchId={selectedBatchId}
        onRecoverStuck={recoverStuckQueue}
      />

      <FlowQueueActiveBatchCard
        activeBatch={activeBatch}
        batches={batches}
        batchProgress={batchProgress}
        stats={stats}
        isWorkerRunning={isWorkerRunning}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        selectedBatchId={selectedBatchId}
        onSelectBatch={setSelectedBatchId}
        onRecoverStuck={recoverStuckQueue}
        onResumeWorker={resumeWorker}
        onCancelPending={cancelPendingQueue}
        onRetryFailed={retryFailedQueue}
        onRefresh={fetchQueueData}
        onClearCompleted={clearCompletedBatches}
      />

      {/* Live Queue Items Table & Mobile Cards */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <FlowQueueFiltersBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          totalCount={queueItems.length}
          stats={stats}
        />

        {/* Loading / Empty / Content */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-bold">Đang tải danh sách tác vụ trong hàng đợi...</p>
          </div>
        ) : filteredQueueItems.length === 0 ? (
          <div className="py-16 sm:py-20 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
            <Layers className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Hàng đợi hiện đang trống</p>
            <p className="text-xs text-slate-400">Khi Lớp trưởng thực thi Flow, các tác vụ sẽ hiển thị tại đây.</p>
          </div>
        ) : (
          <>
            <FlowQueueMobileCards items={filteredQueueItems} />
            <FlowQueueDesktopTable items={filteredQueueItems} />
          </>
        )}
      </div>
    </div>
  );
}
