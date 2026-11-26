import { FlowActionType } from '../../types/flow.types';

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

export interface EnqueueFlowOptions {
  flowAction: FlowActionType | string;
  title?: string;
  id_to_hoc?: string;
  ma_mon?: string;
  ten_mon?: string;
  nhom_to?: string;
  sv_nganh?: number;
  targetFollowerUsernames?: string[];
}

export const INITIAL_FLOW_QUEUE_STATS: FlowQueueStats = {
  totalQueued: 0,
  totalRunning: 0,
  totalSuccess: 0,
  totalFailed: 0,
  totalCancelled: 0,
  totalItems: 0,
};

export const FLOW_QUEUE_POLLING_INTERVAL_MS = 2500;
