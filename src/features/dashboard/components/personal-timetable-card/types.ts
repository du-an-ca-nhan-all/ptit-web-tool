import { TimetableSummary } from '../../types/dashboard.types';

export interface PersonalTimetableCardProps {
  timetable: TimetableSummary;
  onNavigateToSchedule: () => void;
  onNavigateToExternalAccounts: () => void;
}
