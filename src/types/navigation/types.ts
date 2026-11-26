import { SortKey, SortDirection } from '../../features/exam-schedule/types/exam.types';

export type NavigationTab =
  | 'dashboard'
  | 'schedule'
  | 'personal_schedule'
  | 'profile'
  | 'registered_courses'
  | 'monitor'
  | 'members'
  | 'envelope'
  | 'envelope_all'
  | 'settlement'
  | 'settings'
  | 'monitors_list'
  | 'batches'
  | 'external_accounts_admin'
  | 'activity_logs'
  | 'telegram_admin'
  | 'user_registrations'
  | 'database_backup'
  | 'announcements_admin'
  | 'all_students'
  | 'course_compare'
  | 'course_registration'
  | 'monitor_flow'
  | 'exam_review'
  | 'room_analysis'
  | 'global_jobs'
  | 'reminders';

export type ProfileSubTab =
  | 'OVERVIEW'
  | 'SCHEDULE'
  | 'GRADES'
  | 'LMS'
  | 'EXTERNAL_ACCOUNTS'
  | 'TELEGRAM'
  | 'SECURITY';

export interface TabChangeOptions {
  preserveFilters?: boolean;
  search?: string;
  classCode?: string;
  subjectCode?: string;
  date?: string;
  monitorClass?: string;
  page?: number;
  source?: string;
}

export interface InitialHomeState {
  tab: NavigationTab;
  profileSubTab: ProfileSubTab;
  search: string;
  classCode: string;
  subjectCode: string;
  date: string;
  monitorClass: string;
  sortKey: SortKey;
  sortDir: SortDirection;
  page: number;
}
