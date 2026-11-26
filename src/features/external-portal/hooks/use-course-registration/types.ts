import {
  OpenCourseGroupItem,
  SubjectDictItem,
} from '../../server/courseRegistrationServerService';

export interface SniperTarget {
  id: string; // unique key in sniper list
  maMon: string;
  tenMon?: string;
  idToHoc?: string; // If specified, only this specific group; if omitted or 'ANY', any group of this subject
  nhomTo?: string;
  autoAnyGroup: boolean;
  status?: 'WAITING' | 'SNIPING' | 'SUCCESS' | 'FAILED';
  lastCheckedSlot?: string;
}

export interface SniperLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'slot';
  message: string;
}

export interface MonitorFlowConfigInfo {
  isConfigured: boolean;
  isEnabled: boolean;
  classCode: string;
  monitorUsername: string;
  monitorFullName?: string;
  monitorPhone?: string | null;
  allowRegisterCourse?: boolean;
  allowCancelCourse?: boolean;
  autoSyncOnAction?: boolean;
  note?: string | null;
  lastActionAt?: string | null;
  lastActionType?: string | null;
  lastActionResult?: string | null;
  lastActionMessage?: string | null;
}

export type AlertSoundType = 'slot' | 'success' | 'error';

export interface OpenCoursesState {
  ds_nhom_to: OpenCourseGroupItem[];
  ds_mon_hoc: SubjectDictItem[];
  hoc_ky_dang_ky: string;
  trong_thoi_gian_dang_ky: boolean;
  id_rs: string;
}

export interface RegisteredCoursesState {
  ds_kqdkmh: any[];
  totalCourses: number;
  totalCredits: number;
  tuitionFee: number;
}

export interface ExternalAccountState {
  isConfigured: boolean;
  status: string;
  hasToken?: boolean;
  lastSyncAt?: string | null;
}

export interface SniperStatsState {
  attempts: number;
  slotsFound: number;
  successCount: number;
  lastRunAt: string | null;
}
