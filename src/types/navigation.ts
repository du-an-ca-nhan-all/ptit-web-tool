import { SortKey, SortDirection } from '../components/DataTable';

export type NavigationTab =
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
  | 'all_students'
  | 'course_compare';

export interface InitialHomeState {
  tab: NavigationTab;
  search: string;
  classCode: string;
  subjectCode: string;
  date: string;
  monitorClass: string;
  sortKey: SortKey;
  sortDir: SortDirection;
}

export const getInitialHomeState = (): InitialHomeState => {
  if (typeof window === 'undefined') {
    return {
      tab: 'personal_schedule',
      search: '',
      classCode: '',
      subjectCode: '',
      date: '',
      monitorClass: '',
      sortKey: 'DateTime',
      sortDir: 'asc',
    };
  }
  const hash = window.location.hash.replace(/^#/, '');
  const params = new URLSearchParams(hash);
  return {
    tab:
      (params.get('tab') as NavigationTab) || 'personal_schedule',
    search: params.get('search') || '',
    classCode: params.get('classCode') || '',
    subjectCode: params.get('subjectCode') || '',
    date: params.get('date') || '',
    monitorClass: params.get('monitorClass') || '',
    sortKey: (params.get('sortKey') as SortKey) || 'DateTime',
    sortDir: (params.get('sortDir') as SortDirection) || 'asc',
  };
};
