'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LoginUser } from '../../../types';
import { getFlowQueueData } from './use-flow-queue/api';
import {
  FLOW_QUEUE_POLLING_INTERVAL_MS,
  FlowBatchItem,
  FlowQueueJobItem,
  FlowQueueStats,
  INITIAL_FLOW_QUEUE_STATS,
} from './use-flow-queue/types';
import { useFlowQueueActions } from './use-flow-queue/useFlowQueueActions';

export type { FlowBatchItem, FlowQueueJobItem, FlowQueueStats } from './use-flow-queue/types';

export function useFlowQueue(currentUser: LoginUser, selectedClass: string) {
  const [batches, setBatches] = useState<FlowBatchItem[]>([]);
  const [queueItems, setQueueItems] = useState<FlowQueueJobItem[]>([]);
  const [stats, setStats] = useState<FlowQueueStats>(INITIAL_FLOW_QUEUE_STATS);
  const [isWorkerRunning, setIsWorkerRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const [message, setMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Queue Data
  const fetchQueueData = useCallback(
    async (batchId?: string) => {
      if (!selectedClass) return;

      try {
        const { ok, data } = await getFlowQueueData(
          selectedClass,
          currentUser.username,
          batchId
        );

        if (ok && data.success) {
          setBatches(data.batches || []);
          setQueueItems(data.queueItems || []);
          if (data.stats) setStats(data.stats);
          setIsWorkerRunning(Boolean(data.isWorkerRunning));
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu Queue:', err);
      }
    },
    [selectedClass, currentUser.username]
  );

  // Initial load
  useEffect(() => {
    if (selectedClass) {
      setIsLoading(true);
      fetchQueueData(selectedBatchId || undefined).finally(() => setIsLoading(false));
    }
  }, [selectedClass, selectedBatchId, fetchQueueData]);

  // Smart Auto-polling: When there are active jobs (QUEUED or RUNNING), poll every 2.5s
  const hasActiveJobs = stats.totalQueued > 0 || stats.totalRunning > 0 || isWorkerRunning;

  useEffect(() => {
    if (hasActiveJobs) {
      pollingTimerRef.current = setInterval(() => {
        fetchQueueData(selectedBatchId || undefined);
      }, FLOW_QUEUE_POLLING_INTERVAL_MS);
    } else {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    }

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [hasActiveJobs, selectedBatchId, fetchQueueData]);

  const actions = useFlowQueueActions({
    selectedClass,
    monitorUsername: currentUser.username,
    selectedBatchId,
    setSelectedBatchId,
    setIsSubmitting,
    setMessage,
    setErrorMessage,
    fetchQueueData,
  });

  return {
    batches,
    queueItems,
    stats,
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
    ...actions,
  };
}
