import { ExamRecord, ExamSession, LoginUser } from '../../../../types';
import { EnvelopeAssignment, SaveEnvelopeOptions } from '../../../../config/envelopeAssignmentConfig';

export type AssigneeType = 'MONITOR' | 'ASSISTANT';

export interface ClassStudentOption {
  maSV: string;
  name: string;
  inRoom: boolean;
}

export interface AssignEnvelopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ExamSession | null;
  initialClass?: string;
  records?: ExamRecord[];
  loginUsers?: LoginUser[];
  currentAssignment?: EnvelopeAssignment;
  onConfirm: (sessionId: string, targetClass: string, options: SaveEnvelopeOptions) => Promise<void>;
  isLoading?: boolean;
}
