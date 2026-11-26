import { FlowActionType } from '@/src/features/classes-monitor/types/flow.types';

export interface EnqueueFlowOptions {
  monitorUsername: string;
  classCode: string;
  flowAction: FlowActionType | string;
  title?: string;
  id_to_hoc?: string;
  ma_mon?: string;
  ten_mon?: string;
  nhom_to?: string;
  sv_nganh?: number;
  targetFollowerUsernames?: string[];
}

export interface RecoverStuckFlowQueueOptions {
  classCode?: string;
  monitorUsername?: string;
  batchId?: string;
  maxStuckMinutes?: number;
  autoResumeWorker?: boolean;
}

export interface GetFlowQueueStatusOptions {
  monitorUsername?: string;
  classCode?: string;
  batchId?: string;
  limit?: number;
}

export interface FlowQueueBatchActionOptions {
  monitorUsername: string;
  classCode: string;
  batchId?: string;
}

export interface ClearCompletedFlowBatchesOptions {
  monitorUsername: string;
  classCode: string;
}

export interface QldttxCredentials {
  username: string;
  password: string;
  token: string | null;
}
