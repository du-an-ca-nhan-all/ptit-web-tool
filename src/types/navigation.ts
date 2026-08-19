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

export const VALID_NAVIGATION_TABS: NavigationTab[] = [
  'schedule',
  'personal_schedule',
  'profile',
  'registered_courses',
  'monitor',
  'members',
  'envelope',
  'envelope_all',
  'settlement',
  'settings',
  'monitors_list',
  'batches',
  'external_accounts_admin',
  'activity_logs',
  'telegram_admin',
  'user_registrations',
  'database_backup',
  'all_students',
  'course_compare',
];

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
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const getParam = (key: string) => searchParams.get(key) || hashParams.get(key) || '';

  const rawTab = (searchParams.get('tab') || hashParams.get('tab')) as NavigationTab;
  const tab: NavigationTab = rawTab && VALID_NAVIGATION_TABS.includes(rawTab)
    ? rawTab
    : 'personal_schedule';

  return {
    tab,
    search: getParam('search'),
    classCode: getParam('classCode'),
    subjectCode: getParam('subjectCode'),
    date: getParam('date'),
    monitorClass: getParam('monitorClass'),
    sortKey: (getParam('sortKey') as SortKey) || 'DateTime',
    sortDir: (getParam('sortDir') as SortDirection) || 'asc',
  };
};
