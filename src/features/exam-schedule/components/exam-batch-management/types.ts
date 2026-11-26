import { ExamBatchItem, LoginUser } from '../../types/exam.types';

export interface ExamBatchManagementProps {
  currentUser: LoginUser;
  initialBatches?: ExamBatchItem[];
  initialActiveBatch?: ExamBatchItem | null;
  onBatchChanged?: (activeBatch: ExamBatchItem) => void;
}

export interface BatchToast {
  text: string;
  type: 'success' | 'error';
}

export interface BatchFormData {
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  isActive: boolean;
}

export type ImportMode = 'replace' | 'append';

export const EMPTY_BATCH_FORM_DATA: BatchFormData = {
  name: '',
  startDate: '',
  endDate: '',
  description: '',
  isActive: true,
};
