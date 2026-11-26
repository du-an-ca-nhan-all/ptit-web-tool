import { ExamBatchItem, LoginUser } from '../../../../types';

export interface ExamSubjectItem {
  code: string;
  name: string;
}

export interface ReviewStudentItem {
  maSV: string;
  hoLot: string;
  ten: string;
  hoTen: string;
  gioiTinh: string;
  soDienThoai: string;
  maLop: string;
  isRegistered: boolean;
  note: string;
  updatedBy: string | null;
  updatedAt: string | null;
  examCount: number;
  examSubjects: ExamSubjectItem[];
}

export interface ExamReviewRegistrationManagerProps {
  currentUser: LoginUser;
  availableClasses: string[];
  initialClassCode?: string;
  examBatches: ExamBatchItem[];
  activeBatch: ExamBatchItem | null;
}

export type FilterMode = 'ALL' | 'REGISTERED' | 'UNREGISTERED' | 'HAS_EXAMS';

export type QuickImportMode = 'MERGE' | 'REPLACE';

export interface ToastMessage {
  text: string;
  type: 'success' | 'error';
}

export interface ReviewSummary {
  total: number;
  registered: number;
  unregistered: number;
  withExams: number;
}
