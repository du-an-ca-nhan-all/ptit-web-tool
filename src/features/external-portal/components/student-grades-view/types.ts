import { LoginUser } from '../../../../types';

export type DataSource = 'QLDTTX' | 'SLINK';

export type GradesErrorType =
  | 'NOT_CONFIGURED'
  | 'INVALID_CREDENTIALS'
  | 'SERVER_ERROR'
  | null;

export type SyncFeedback = {
  type: 'success' | 'error';
  message: string;
} | null;

export type AnalyticsTab =
  | 'PROGRESSION'
  | 'DISTRIBUTION'
  | 'ADVISING'
  | 'SIMULATOR';

export type GpaScaleView = 'scale4' | 'scale10' | 'both';

export type GpaModeView = 'OFFICIAL' | 'EXPECTED' | 'BOTH';

export interface StudentGradesViewProps {
  currentUser: LoginUser;
  initialSource?: DataSource;
  onNavigateToExternalAccounts?: () => void;
}
