import { AcademicSummary } from '../../types/dashboard.types';

export type AcademicSourceKey = 'SLINK' | 'QLHT';

export interface AcademicSnapshotCardsProps {
  academic: AcademicSummary;
  onNavigateToGrades: (source?: AcademicSourceKey) => void;
  onNavigateToExternalAccounts: () => void;
}
