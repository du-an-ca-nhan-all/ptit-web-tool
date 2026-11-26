import { LoginUser } from '../../../../types';
import { FlowActionType } from '../../types/flow.types';

export interface MonitorFlowManagerProps {
  currentUser: LoginUser;
  availableClasses?: string[];
  initialClassCode?: string;
  onNavigateTab?: (tab: string, subTab?: string) => void;
}

export type MainSubTab = 'FLOW_CONFIG' | 'MONITOR_COURSES' | 'ALL_COMPARE' | 'FLOW_QUEUE';
export type CompareFilter = 'ALL' | 'ACTIVE_FLOW' | 'NEEDS_ATTENTION' | 'MATCHED_100' | 'NOT_LINKED';

export interface ExecuteFlowOptions {
  flowAction: FlowActionType | string;
  id_to_hoc?: string;
  id_rs?: string;
  ma_mon?: string;
  ten_mon?: string;
  nhom_to?: string;
  targetFollowerUsernames?: string[];
}

export type ExecuteFlowFn = (options: ExecuteFlowOptions) => Promise<void>;

export type UpdateFollowerConfigFn = (
  username: string,
  field: 'isEnabled' | 'allowRegisterCourse' | 'allowCancelCourse' | 'autoSyncOnAction' | 'note',
  value: any
) => void;

export interface ExecutionResultSummary {
  flowAction: string;
  total: number;
  successCount: number;
  failCount: number;
  skippedCount: number;
  results: any[];
}
