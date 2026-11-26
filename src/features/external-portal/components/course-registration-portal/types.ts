import { LoginUser } from '../../../../types';
import { useCourseRegistration } from '../../hooks/useCourseRegistration';

export type CourseRegistrationSubTab =
  | 'OPEN_COURSES'
  | 'REGISTERED_COURSES'
  | 'SNIPER_BOT'
  | 'GUIDE';

export type CourseStatusFilter = 'ALL' | 'AVAILABLE' | 'FULL' | 'REGISTERED';

export type CourseViewMode = 'ACCORDION' | 'FLAT';

export interface CourseRegistrationPortalProps {
  currentUser: LoginUser;
  onNavigateTab?: (tab: string, subTab?: string) => void;
}

export interface GroupedSubject {
  ma_mon: string;
  ten_mon: string;
  so_tc: number;
  groups: any[];
}

export type CourseRegistrationHookResult = ReturnType<typeof useCourseRegistration>;
