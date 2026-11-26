import { FlowActionType } from '@/src/features/classes-monitor/types/flow.types';

export interface CourseItem {
  id_to_hoc: string;
  ma_mon: string;
  ten_mon: string;
  nhom_to: string;
  so_tc: number;
  lop?: string;
  tkb?: string;
  phai_dong?: number;
  ngay_dang_ky?: string | null;
  raw?: any;
}

export interface DiffSummary {
  matchedCount: number;      // Số môn trùng mã môn & đúng nhóm tổ
  diffGroupCount: number;    // Số môn trùng mã môn nhưng khác nhóm tổ
  missingCount: number;      // Số môn Lớp trưởng có nhưng sinh viên chưa có
  extraCount: number;        // Số môn sinh viên có nhưng Lớp trưởng không có
  matchPercent: number;      // % Trùng khớp (0 - 100)
}

export interface FollowerStudentItem {
  maSV: string;
  hoTen: string;
  soDienThoai?: string | null;
  maLop: string;
  isMonitor: boolean;
  // External Account Status
  isExternalConfigured: boolean;
  externalStatus: string;
  externalUsername?: string;
  // Flow Configuration
  isEnabled: boolean;
  allowRegisterCourse: boolean;
  allowCancelCourse: boolean;
  autoSyncOnAction: boolean;
  note?: string | null;
  // Registered Courses Info
  totalCourses: number;
  totalCredits: number;
  tuitionFee: number;
  lastPulledAt?: string | null;
  courses: CourseItem[];
  // Comparison vs Monitor
  diffSummary: DiffSummary;
  // Last Action Record
  lastActionAt?: string | null;
  lastActionType?: string | null;
  lastActionResult?: string | null;
  lastActionMessage?: string | null;
}

export interface MonitorProfileData {
  username: string;
  hoTen: string;
  maLop: string;
  totalCourses: number;
  totalCredits: number;
  tuitionFee: number;
  lastPulledAt?: string | null;
  courses: CourseItem[];
}

export interface ImportFlowStudentItem {
  maSV: string;
  hoTen?: string;
  isEnabled?: boolean;
  allowRegisterCourse?: boolean;
  allowCancelCourse?: boolean;
  autoSyncOnAction?: boolean;
  note?: string;
}

export interface MonitorFlowListResult {
  monitorUsername: string;
  classCode: string;
  monitorData: MonitorProfileData | null;
  totalStudents: number;
  activeFollowersCount: number;
  configuredAccountsCount: number;
  students: FollowerStudentItem[];
}

export interface QldttxCredentials {
  username: string;
  password: string;
  token: string | null;
}

export interface FlowExecutionItemResult {
  username: string;
  hoTen?: string;
  success: boolean;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  message: string;
  data?: any;
}

export interface ExecuteMonitorFlowOptions {
  monitorUsername: string;
  classCode?: string;
  flowAction: FlowActionType | string;
  id_to_hoc?: string;
  id_rs?: string;
  ma_mon?: string;
  ten_mon?: string;
  nhom_to?: string;
  sv_nganh?: number;
  targetFollowerUsernames?: string[]; // Nếu truyền thì chỉ flow cho danh sách này, nếu không thì flow cho tất cả followers isEnabled
}

export interface ExecuteMonitorFlowResult {
  success: boolean;
  flowAction: string;
  total: number;
  successCount: number;
  failCount: number;
  skippedCount: number;
  results: FlowExecutionItemResult[];
}
