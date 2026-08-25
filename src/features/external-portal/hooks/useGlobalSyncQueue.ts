'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GlobalNightlySyncConfigValue } from '@/src/lib/globalConfig';
import { GlobalJobType } from '../types/globalSyncQueue.types';

export interface GlobalSyncBatchItem {
  id: string;
  jobType: string;
  title: string;
  triggeredBy: string;
  scheduledTime?: string;
  totalItems: number;
  pendingCount: number;
  processingCount: number;
  successCount: number;
  failedCount: number;
  cancelledCount: number;
  skippedCount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'PAUSED' | 'FAILED' | string;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GlobalSyncJobItem {
  id: string;
  batchId: string;
  username: string;
  studentName?: string | null;
  jobType: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'SKIPPED' | string;
  attempts: number;
  maxAttempts: number;
  resultMessage?: string | null;
  resultData?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GlobalSyncStats {
  QUEUED: number;
  RUNNING: number;
  SUCCESS: number;
  FAILED: number;
  CANCELLED: number;
  SKIPPED: number;
}

export function useGlobalSyncQueue() {
  const [batches, setBatches] = useState<GlobalSyncBatchItem[]>([]);
  const [queueItems, setQueueItems] = useState<GlobalSyncJobItem[]>([]);
  const [stats, setStats] = useState<GlobalSyncStats>({
    QUEUED: 0,
    RUNNING: 0,
    SUCCESS: 0,
    FAILED: 0,
    CANCELLED: 0,
    SKIPPED: 0,
  });
  const [config, setConfig] = useState<GlobalNightlySyncConfigValue>({
    isEnabled: true,
    timetableJob: { isEnabled: true, scheduleTime: '22:00' },
    gradesJob: { isEnabled: true, scheduleTime: '22:00' },
    lmsJob: { isEnabled: true, scheduleTime: '22:00' },
    examsJob: { isEnabled: true, scheduleTime: '07:00' },
    slinkGradesJob: { isEnabled: true, scheduleTime: '23:00' },
  });
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
        const url = new URL('/api/global-sync', window.location.origin);
        if (targetBatchId) url.searchParams.set('batchId', targetBatchId);
        url.searchParams.set('limit', '50');

        const res = await fetch(url.toString(), {
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
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
    const intervalMs = hasActiveJobs ? 2500 : 8000;
    pollIntervalRef.current = setInterval(() => {
      fetchQueueData();
    }, intervalMs);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [fetchQueueData, hasActiveJobs]);

  // Đưa tác vụ vào queue
  const enqueueJob = async (options: {
    jobType: GlobalJobType;
    title?: string;
    targetUsernames?: string[];
  }) => {
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/global-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ENQUEUE',
          ...options,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Lỗi khi kích hoạt tác vụ');
      }

      setMessage(data.message || 'Đã đưa tác vụ vào hàng đợi thành công');
      if (data.batchId) setSelectedBatchId(data.batchId);
      await fetchQueueData(data.batchId);
      return data;
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kích hoạt quét chạy thử 22h
  const triggerNightlyScheduler = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/global-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TRIGGER_NIGHTLY' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi chạy quét chu kỳ');
      }

      setMessage(data.message || 'Đã kích hoạt quét kiểm tra lịch chạy');
      await fetchQueueData();
      return data;
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hủy các tác vụ đang chờ
  const cancelPendingQueue = async (batchId?: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/global-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CANCEL_PENDING',
          batchId: batchId || selectedBatchId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi khi hủy hàng đợi');
      setMessage(data.message || 'Đã hủy các tác vụ đang chờ');
      await fetchQueueData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi hủy hàng đợi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Thử lại các tác vụ lỗi
  const retryFailedQueue = async (batchId?: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/global-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RETRY_FAILED',
          batchId: batchId || selectedBatchId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi khi thử lại hàng đợi');
      setMessage(data.message || 'Đã đưa các tác vụ lỗi vào lại hàng đợi');
      await fetchQueueData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dọn dẹp các batch đã hoàn thành
  const clearCompletedBatches = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/global-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLEAR_COMPLETED' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi khi dọn dẹp');
      setMessage(data.message || 'Đã dọn dẹp các đợt chạy đã xong');
      setSelectedBatchId(null);
      await fetchQueueData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi dọn dẹp');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cập nhật cấu hình lịch chạy ban đêm
  const updateConfig = async (newConfig: Partial<GlobalNightlySyncConfigValue>) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/global-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_CONFIG',
          config: newConfig,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi khi cập nhật cấu hình');
      setMessage(data.message || 'Đã cập nhật cấu hình thành công');
      if (data.config) setConfig(data.config);
      return data;
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi cập nhật cấu hình');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kích hoạt lại worker
  const resumeWorker = async (batchId?: string) => {
    try {
      await fetch('/api/global-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PROCESS_NEXT',
          batchId: batchId || selectedBatchId || undefined,
        }),
      });
      fetchQueueData();
    } catch (err) {
      console.error('resumeWorker error:', err);
    }
  };

  // Phục hồi các tác vụ bị kẹt RUNNING
  const recoverStuckQueue = async (batchId?: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/global-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECOVER_STUCK',
          batchId: batchId || selectedBatchId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi khi khôi phục');
      setMessage(data.message || 'Đã khôi phục các tác vụ bị kẹt thành công.');
      await fetchQueueData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi khôi phục');
    } finally {
      setIsSubmitting(false);
    }
  };

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
