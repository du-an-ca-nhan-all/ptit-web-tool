import { FollowerStudentItem } from '../../server/monitorFlowServerService';

export interface ParsedFlowStudent {
  maSV: string;
  hoTen?: string;
  isEnabled: boolean;
  allowRegisterCourse: boolean;
  allowCancelCourse: boolean;
  autoSyncOnAction?: boolean;
  note?: string;
  // Computed matching info
  isInClass: boolean;
  isLinked: boolean;
  classCode?: string;
  matchedName?: string;
  warning?: string;
}

export interface ImportFlowStudentsPayload {
  mode: 'MERGE' | 'REPLACE';
  items: Array<{
    maSV: string;
    hoTen?: string;
    isEnabled?: boolean;
    allowRegisterCourse?: boolean;
    allowCancelCourse?: boolean;
    autoSyncOnAction?: boolean;
    note?: string;
  }>;
  defaultAllowRegister: boolean;
  defaultAllowCancel: boolean;
}

export interface ImportFlowStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: string;
  monitorUsername: string;
  monitorFullName?: string;
  existingClassStudents: FollowerStudentItem[];
  onConfirmImport: (payload: ImportFlowStudentsPayload) => Promise<boolean | void>;
  isSubmitting?: boolean;
}

export type TabType = 'FILE' | 'TEXT';
export type ImportMode = 'MERGE' | 'REPLACE';

export interface TextExamplePreset {
  id: number;
  title: string;
  description: string;
  sample: string;
}

export interface ParseStudentDefaults {
  defaultIsEnabled: boolean;
  defaultAllowRegister: boolean;
  defaultAllowCancel: boolean;
}
