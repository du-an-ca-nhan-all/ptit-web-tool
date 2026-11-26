'use client';

import React, { useState, useMemo } from 'react';
import { useGlobalSyncQueue } from '../hooks/useGlobalSyncQueue';
import {
  GlobalSyncQueueManagerProps,
  SyncConfigFormState,
} from './global-sync-queue-manager/types';
import {
  buildConfigFormFromConfig,
  calculateBatchProgress,
  filterQueueItems,
} from './global-sync-queue-manager/utils';
import { ToastBanners } from './global-sync-queue-manager/ToastBanners';
import { QueueHeaderSection } from './global-sync-queue-manager/QueueHeaderSection';
import { StatsOverviewCards } from './global-sync-queue-manager/StatsOverviewCards';
import { BatchSelectorHeader } from './global-sync-queue-manager/BatchSelectorHeader';
import { QueueItemsList } from './global-sync-queue-manager/QueueItemsList';
import { SyncConfigModal } from './global-sync-queue-manager/SyncConfigModal';

export default function GlobalSyncQueueManager({
  currentUser: _currentUser,
}: GlobalSyncQueueManagerProps) {
  const {
    batches,
    queueItems,
    stats,
    config,
    hasActiveJobs,
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
    enqueueJob,
    triggerNightlyScheduler,
    cancelPendingQueue,
    retryFailedQueue,
    clearCompletedBatches,
    updateConfig,
    resumeWorker,
    recoverStuckQueue,
  } = useGlobalSyncQueue();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [configForm, setConfigForm] = useState<SyncConfigFormState>(() =>
    buildConfigFormFromConfig(config)
  );

  const openConfigModal = () => {
    setConfigForm(buildConfigFormFromConfig(config));
    setIsConfigOpen(true);
  };

  // Filtered queue items
  const filteredQueueItems = useMemo(
    () => filterQueueItems(queueItems, searchQuery, statusFilter),
    [queueItems, searchQuery, statusFilter]
  );

  // Selected batch object
  const activeBatch = useMemo(() => {
    if (!selectedBatchId) return batches[0] || null;
    return batches.find((b) => b.id === selectedBatchId) || null;
  }, [batches, selectedBatchId]);

  // Progress percentage of active batch
  const batchProgress = useMemo(() => calculateBatchProgress(activeBatch), [activeBatch]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateConfig(configForm);
      setIsConfigOpen(false);
    } catch (caughtError) {
      console.warn(`[GlobalSyncQueueManager] Non-fatal error:`, caughtError);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      <ToastBanners
        message={message}
        errorMessage={errorMessage}
        onDismissMessage={() => setMessage(null)}
        onDismissError={() => setErrorMessage(null)}
      />

      <QueueHeaderSection
        config={config}
        hasActiveJobs={hasActiveJobs}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        onOpenConfigModal={openConfigModal}
        onTriggerNightlyScheduler={() => triggerNightlyScheduler()}
        onRefreshQueueData={() => fetchQueueData()}
        onEnqueueJob={(options) => enqueueJob(options)}
      />

      <StatsOverviewCards
        stats={stats}
        statusFilter={statusFilter}
        isWorkerRunning={isWorkerRunning}
        isSubmitting={isSubmitting}
        onSelectStatusFilter={setStatusFilter}
        onRecoverStuckQueue={() => recoverStuckQueue()}
      />

      {/* BATCH SELECTOR & QUEUE CONTROLS */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-slate-200 shadow-sm space-y-4 sm:space-y-6">
        <BatchSelectorHeader
          batches={batches}
          selectedBatchId={selectedBatchId}
          activeBatch={activeBatch}
          batchProgress={batchProgress}
          stats={stats}
          isWorkerRunning={isWorkerRunning}
          isSubmitting={isSubmitting}
          onSelectBatch={setSelectedBatchId}
          onRecoverStuckQueue={() => recoverStuckQueue()}
          onResumeWorker={() => resumeWorker()}
          onRetryFailedQueue={() => retryFailedQueue()}
          onCancelPendingQueue={() => cancelPendingQueue()}
          onClearCompletedBatches={() => clearCompletedBatches()}
        />

        <QueueItemsList
          filteredQueueItems={filteredQueueItems}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onSearchChange={setSearchQuery}
          onStatusFilterChange={setStatusFilter}
        />
      </div>

      {/* CONFIGURATION MODAL (CÀI ĐẶT LỊCH RIÊNG TỪNG JOB) */}
      {isConfigOpen && (
        <SyncConfigModal
          configForm={configForm}
          isSubmitting={isSubmitting}
          onChangeConfigForm={setConfigForm}
          onSaveConfig={handleSaveConfig}
          onClose={() => setIsConfigOpen(false)}
        />
      )}
    </div>
  );
}
