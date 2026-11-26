import { LoginUser } from '@/src/features/auth/types/auth.types';
import { LmsCourseOverviewItem, LmsSectionItem } from '../../server/lmsServerService';

export interface LmsCoursesViewProps {
  currentUser: LoginUser;
  onNavigateToExternalAccounts?: () => void;
}

export type LmsStatusFilter = 'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_STARTED';

export type LmsSortBy = 'PROGRESS_DESC' | 'PROGRESS_ASC' | 'NAME_ASC' | 'GRADE_DESC';

export interface ActiveCourseDetails {
  course: LmsCourseOverviewItem;
  sections: LmsSectionItem[];
  totalActivities: number;
}

export interface LmsFilterCounts {
  all: number;
  completed: number;
  inProgress: number;
  notStarted: number;
}
