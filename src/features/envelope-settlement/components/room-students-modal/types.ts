import { ExamRecord, ExamSession } from '../../../../types';

export interface RoomStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ExamSession | null;
  records?: ExamRecord[];
  userClass?: string;
  initialClassFilter?: string;
}

export interface ClassBreakdownItem {
  className: string;
  count: number;
}
