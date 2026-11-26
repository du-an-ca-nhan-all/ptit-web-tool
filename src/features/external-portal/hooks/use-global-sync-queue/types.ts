import { GlobalJobType } from '../../types/globalSyncQueue.types';

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

export interface EnqueueGlobalSyncJobOptions {
  jobType: GlobalJobType;
  title?: string;
  targetUsernames?: string[];
}
