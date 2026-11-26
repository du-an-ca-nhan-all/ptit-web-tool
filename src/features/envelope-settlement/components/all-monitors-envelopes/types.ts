import { ExamRecord, LoginUser, ExamSession } from '../../../../types';
import { getEffectiveResponsibleClass } from '../../../../config/envelopeAssignmentConfig';

export interface AllMonitorsEnvelopesProps {
  sessions?: ExamSession[];
  records?: ExamRecord[];
  loginUsers?: LoginUser[];
  isAdmin?: boolean;
}

export type EnvelopeFilterStatus =
  | 'ALL'
  | 'UNCLAIMED'
  | 'CLAIMED'
  | 'MY_CLASS'
  | 'MY_CLASS_STRICT_LARGEST'
  | 'MY_CLASS_SUGGESTED'
  | 'MY_CLAIMED';

export type EnhancedExamSession = ExamSession & {
  responsibleClasses: string[];
  isClaimedManual: boolean;
  assignmentInfo: ReturnType<typeof getEffectiveResponsibleClass>['assignmentInfo'];
};

export interface EnvelopeCounts {
  total: number;
  unclaimed: number;
  claimed: number;
  myClass: number;
  myClassStrictLargest: number;
  myClassSuggested: number;
  myClaimed: number;
}
