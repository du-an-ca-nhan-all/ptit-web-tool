import { ExamBatchItem, LoginUser } from '../../../../types';

export interface MonitorRoomAnalysisProps {
  currentUser: LoginUser;
  availableClasses: string[];
  initialClassCode?: string;
  examBatches: ExamBatchItem[];
  activeBatch: ExamBatchItem | null;
  onSelectStudentSchedule?: (studentId: string) => void;
}

export type ViewTab = 'SPLIT_STUDENTS' | 'ROOMS_BY_COUNT';

export interface ToastMessage {
  text: string;
  type: 'success' | 'error';
}

export interface SubjectOption {
  code: string;
  name: string;
}

export interface SplitCounts {
  total: number;
  allSplit: number;
  uniqueSplitStudents: number;
  sameGroup: number;
  diffGroup: number;
  sameRoom: number;
  noMonitor: number;
}
