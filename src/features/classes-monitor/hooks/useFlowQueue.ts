'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LoginUser } from '../../../types';
import { FlowActionType } from '../types/flow.types';

export interface FlowBatchItem {
  id: string;
  classCode: string;
  monitorUsername: string;
  flowAction: string;
  title: string;
  id_to_hoc?: string | null;
  ma_mon?: string | null;
  ten_mon?: string | null;
  nhom_to?: string | null;
  totalItems: number;
  pendingCount: number;
  processingCount: number;
  successCount: number;
  failedCount: number;
  cancelledCount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED' | 'PAUSED';
  createdAt: string;
  updatedAt: string;
}

export interface FlowQueueJobItem {
  id: string;
  batchId: string;
  classCode: string;
  monitorUsername: string;
  followerUsername: string;
  followerName?: string | null;
  flowAction: string;
  id_to_hoc?: string | null;
  ma_mon?: string | null;
  ten_mon?: string | null;
  nhom_to?: string | null;
  sv_nganh?: number;
  status: 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'SKIPPED';
  attempts: number;
  maxAttempts: number;
  resultMessage?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FlowQueueStats {
  totalQueued: number;
  totalRunning: number;
  totalSuccess: number;
  totalFailed: number;
  totalCancelled: number;
  totalItems: number;
}

export function useFlowQueue(currentUser: LoginUser, selectedClass: string) {
  const [batches, setBatches] = useState<FlowBatchItem[]>([]);
  const [queueItems, setQueueItems] = useState<FlowQueueJobItem[]>([]);
  const [stats, setStats] = useState<FlowQueueStats>({
    totalQueued: 0,
    totalRunning: 0,
    totalSuccess: 0,
    totalFailed: 0,
    totalCancelled: 0,
    totalItems: 0,
  });
  const [isWorkerRunning, setIsWorkerRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const [message, setMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Queue Data
  const fetchQueueData = useCallback(async (batchId?: string) => {
    if (!selectedClass) return;

    try {
      const url = `/api/class-monitors/flow-queue?classCode=${encodeURIComponent(selectedClass)}&monitorUsername=${encodeURIComponent(currentUser.username)}${
        batchId ? `&batchId=${encodeURIComponent(batchId)}` : ''
      }`;
      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.success) {
        setBatches(data.batches || []);
        setQueueItems(data.queueItems || []);
        if (data.stats) setStats(data.stats);
        setIsWorkerRunning(Boolean(data.isWorkerRunning));
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu Queue:', err);
    }
  }, [selectedClass, currentUser.username]);

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
      }, 2500);
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

  // Enqueue new flow action
  const enqueueFlow = useCallback(async (options: {
    flowAction: FlowActionType | string;
    title?: string;
    id_to_hoc?: string;
    ma_mon?: string;
    ten_mon?: string;
    nhom_to?: string;
    sv_nganh?: number;
    targetFollowerUsernames?: string[];
  }) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setMessage('');

    try {
      const res = await fetch('/api/class-monitors/flow-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ENQUEUE',
          classCode: selectedClass,
          monitorUsername: currentUser.username,
          ...options,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(data.message || 'Đã đưa tác vụ vào hàng đợi thành công!');
        if (data.batchId) setSelectedBatchId(data.batchId);
        await fetchQueueData(data.batchId);
        return { success: true, batchId: data.batchId };
      } else {
        setErrorMessage(data.error || data.message || 'Không thể đưa vào hàng đợi');
        return { success: false };
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi mạng khi gửi tác vụ vào hàng đợi');
      return { success: false };
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedClass, currentUser.username, fetchQueueData]);

  // Cancel all pending items
  const cancelPendingQueue = useCallback(async (batchId?: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/class-monitors/flow-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CANCEL_PENDING',
          classCode: selectedClass,
          monitorUsername: currentUser.username,
          batchId: batchId || selectedBatchId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(data.message);
        await fetchQueueData(selectedBatchId || undefined);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi hủy hàng đợi');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedClass, currentUser.username, selectedBatchId, fetchQueueData]);

  // Retry failed items
  const retryFailedQueue = useCallback(async (batchId?: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/class-monitors/flow-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RETRY_FAILED',
          classCode: selectedClass,
          monitorUsername: currentUser.username,
          batchId: batchId || selectedBatchId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(data.message);
        await fetchQueueData(selectedBatchId || undefined);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi thử lại hàng đợi');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedClass, currentUser.username, selectedBatchId, fetchQueueData]);

  // Clear completed batches
  const clearCompletedBatches = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/class-monitors/flow-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CLEAR_COMPLETED',
          classCode: selectedClass,
          monitorUsername: currentUser.username,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(data.message);
        setSelectedBatchId(null);
        await fetchQueueData();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi dọn dẹp hàng đợi');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedClass, currentUser.username, fetchQueueData]);

  // Resume worker if paused
  const resumeWorker = useCallback(async () => {
    try {
      await fetch('/api/class-monitors/flow-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PROCESS_NEXT',
          classCode: selectedClass,
          monitorUsername: currentUser.username,
          batchId: selectedBatchId || undefined,
        }),
      });
      await fetchQueueData(selectedBatchId || undefined);
    } catch (err) {
      console.error('Lỗi khi kích hoạt worker:', err);
    }
  }, [selectedClass, currentUser.username, selectedBatchId, fetchQueueData]);

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
    enqueueFlow,
    cancelPendingQueue,
    retryFailedQueue,
    clearCompletedBatches,
    resumeWorker,
  };
}
