'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GlobalNightlySyncConfigValue } from '@/src/lib/globalConfig';
import {
  GlobalSyncBatchItem,
  GlobalSyncJobItem,
  GlobalSyncStats,
} from './use-global-sync-queue/types';
import {
  ACTIVE_POLL_INTERVAL_MS,
  IDLE_POLL_INTERVAL_MS,
  INITIAL_GLOBAL_SYNC_CONFIG,
  INITIAL_GLOBAL_SYNC_STATS,
} from './use-global-sync-queue/constants';
import { fetchGlobalSyncQueueApi } from './use-global-sync-queue/api';
import { createGlobalSyncActions } from './use-global-sync-queue/actions';

export type {
  GlobalSyncBatchItem,
  GlobalSyncJobItem,
  GlobalSyncStats,
} from './use-global-sync-queue/types';

export function useGlobalSyncQueue() {
  const [batches, setBatches] = useState<GlobalSyncBatchItem[]>([]);
  const [queueItems, setQueueItems] = useState<GlobalSyncJobItem[]>([]);
  const [stats, setStats] = useState<GlobalSyncStats>(INITIAL_GLOBAL_SYNC_STATS);
  const [config, setConfig] = useState<GlobalNightlySyncConfigValue>(INITIAL_GLOBAL_SYNC_CONFIG);
  const [isWorkerRunning, setIsWorkerRunning] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchQueueData = useCallback(
    async (batchIdToFetch?: string) => {
      try {
        const targetBatchId = batchIdToFetch || selectedBatchId || '';
        const data = await fetchGlobalSyncQueueApi(targetBatchId);
        setBatches(data.batches || []);
        setQueueItems(data.queueItems || []);
        if (data.stats) setStats(data.stats);
        if (data.config) setConfig(data.config);
        setIsWorkerRunning(!!data.isWorkerRunning);

        if (!selectedBatchId && data.batches && data.batches.length > 0) {
          setSelectedBatchId(data.batches[0].id);
        }
      } catch (err: any) {
        console.error('fetchQueueData error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedBatchId]
  );

  // Polling tự động khi có tác vụ đang chạy
  const hasActiveJobs =
    stats.RUNNING > 0 ||
    stats.QUEUED > 0 ||
    batches.some((b) => b.status === 'PROCESSING' || b.status === 'PENDING');

  useEffect(() => {
    fetchQueueData();
    const intervalMs = hasActiveJobs ? ACTIVE_POLL_INTERVAL_MS : IDLE_POLL_INTERVAL_MS;
    pollIntervalRef.current = setInterval(() => {
      fetchQueueData();
    }, intervalMs);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [fetchQueueData, hasActiveJobs]);

  const {
    enqueueJob,
    triggerNightlyScheduler,
    cancelPendingQueue,
    retryFailedQueue,
    clearCompletedBatches,
    updateConfig,
    resumeWorker,
    recoverStuckQueue,
  } = createGlobalSyncActions({
    selectedBatchId,
    setSelectedBatchId,
    setConfig,
    setIsSubmitting,
    setMessage,
    setErrorMessage,
    fetchQueueData,
  });

  return {
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
  };
}
