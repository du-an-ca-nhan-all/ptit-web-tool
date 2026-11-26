import { FlowActionType } from '../../types/flow.types';

export interface EditedFollowerConfig {
  isEnabled: boolean;
  allowRegisterCourse: boolean;
  allowCancelCourse: boolean;
  autoSyncOnAction: boolean;
  note?: string;
}

export type FollowerConfigField =
  | 'isEnabled'
  | 'allowRegisterCourse'
  | 'allowCancelCourse'
  | 'autoSyncOnAction'
  | 'note';

export type FollowerPermissionField =
  | 'allowRegisterCourse'
  | 'allowCancelCourse'
  | 'autoSyncOnAction';

export interface ExecutionResult {
  flowAction: string;
  total: number;
  successCount: number;
  failCount: number;
  skippedCount: number;
  results: any[];
}

export interface ExecuteFlowOptions {
  flowAction: FlowActionType | string;
  id_to_hoc?: string;
  id_rs?: string;
  ma_mon?: string;
  ten_mon?: string;
  nhom_to?: string;
  targetFollowerUsernames?: string[];
}

export interface ImportFlowConfigItem {
  maSV: string;
  hoTen?: string;
  isEnabled?: boolean;
  allowRegisterCourse?: boolean;
  allowCancelCourse?: boolean;
  autoSyncOnAction?: boolean;
  note?: string;
}

export interface ImportFlowConfigsOptions {
  mode: 'MERGE' | 'REPLACE';
  items: ImportFlowConfigItem[];
  defaultAllowRegister?: boolean;
  defaultAllowCancel?: boolean;
  defaultAutoSync?: boolean;
}

export interface SaveConfigPayloadItem {
  followerUsername: string;
  isEnabled: boolean;
  allowRegisterCourse: boolean;
  allowCancelCourse: boolean;
  autoSyncOnAction: boolean;
  note: string | undefined;
}
