import { LoginUser } from '../../../../types';
import {
  FlowBatchItem,
  FlowQueueJobItem,
  FlowQueueStats,
} from '../../hooks/useFlowQueue';

export interface FlowQueueMonitorProps {
  currentUser: LoginUser;
  selectedClass: string;
}

export type { FlowBatchItem, FlowQueueJobItem, FlowQueueStats };
