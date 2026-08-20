import { SortKey, SortDirection } from '../features/exam-schedule/types/exam.types';

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
  | 'announcements_admin'
  | 'all_students'
  | 'course_compare';

export type ProfileSubTab =
  | 'OVERVIEW'
  | 'SCHEDULE'
  | 'GRADES'
  | 'EXTERNAL_ACCOUNTS'
  | 'TELEGRAM'
  | 'EXAMS'
  | 'SECURITY';

export interface TabChangeOptions {
  preserveFilters?: boolean;
  search?: string;
  classCode?: string;
  subjectCode?: string;
  date?: string;
  monitorClass?: string;
  page?: number;
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
  'announcements_admin',
  'all_students',
  'course_compare',
];

export const PROFILE_SUBTAB_MAP: Record<string, ProfileSubTab> = {
  overview: 'OVERVIEW',
  thongtinhocvu: 'OVERVIEW',
  personalschedule: 'SCHEDULE',
  schedule: 'SCHEDULE',
  timetable: 'SCHEDULE',
  lichhoc: 'SCHEDULE',
  grades: 'GRADES',
  bangdiem: 'GRADES',
  ketquahoctap: 'GRADES',
  externalaccounts: 'EXTERNAL_ACCOUNTS',
  external_accounts: 'EXTERNAL_ACCOUNTS',
  'external-accounts': 'EXTERNAL_ACCOUNTS',
  qldt: 'EXTERNAL_ACCOUNTS',
  telegram: 'TELEGRAM',
  exams: 'EXAMS',
  lichthi: 'EXAMS',
  security: 'SECURITY',
  baomat: 'SECURITY',
  matkhau: 'SECURITY',
};

export const PATH_TO_TAB_MAP: Record<string, NavigationTab> = {
  profile: 'profile',
  'personal-schedule': 'personal_schedule',
  personal_schedule: 'personal_schedule',
  schedule: 'schedule',
  courses: 'registered_courses',
  'registered-courses': 'registered_courses',
  registered_courses: 'registered_courses',
  'course-compare': 'course_compare',
  course_compare: 'course_compare',
  monitors: 'monitors_list',
  'monitors-list': 'monitors_list',
  monitors_list: 'monitors_list',
  students: 'all_students',
  'all-students': 'all_students',
  all_students: 'all_students',
  members: 'members',
  envelope: 'envelope_all',
  'envelope-all': 'envelope_all',
  envelope_all: 'envelope_all',
  settlement: 'settlement',
  batches: 'batches',
  'external-accounts': 'external_accounts_admin',
  external_accounts_admin: 'external_accounts_admin',
  telegram: 'telegram_admin',
  telegram_admin: 'telegram_admin',
  'activity-logs': 'activity_logs',
  activity_logs: 'activity_logs',
  'user-registrations': 'user_registrations',
  user_registrations: 'user_registrations',
  'database-backup': 'database_backup',
  database_backup: 'database_backup',
  announcements: 'announcements_admin',
  announcements_admin: 'announcements_admin',
  'announcements-admin': 'announcements_admin',
};

export const MONITOR_SUBPATH_MAP: Record<string, NavigationTab> = {
  members: 'members',
  danhsach: 'members',
  envelope: 'envelope_all',
  phongbi: 'envelope_all',
  'envelope-all': 'envelope_all',
  envelope_all: 'envelope_all',
  phongbitoantruong: 'envelope_all',
  settlement: 'settlement',
  butru: 'settlement',
  tools: 'monitor',
};

export const ADMIN_SUBPATH_MAP: Record<string, NavigationTab> = {
  batches: 'batches',
  dotthi: 'batches',
  'external-accounts': 'external_accounts_admin',
  external_accounts: 'external_accounts_admin',
  external_accounts_admin: 'external_accounts_admin',
  telegram: 'telegram_admin',
  telegram_admin: 'telegram_admin',
  'activity-logs': 'activity_logs',
  activity_logs: 'activity_logs',
  'user-registrations': 'user_registrations',
  user_registrations: 'user_registrations',
  'database-backup': 'database_backup',
  database_backup: 'database_backup',
  saoluu: 'database_backup',
  announcements: 'announcements_admin',
  announcements_admin: 'announcements_admin',
  thongbao: 'announcements_admin',
};

export const getNavigationPath = (tab: NavigationTab, profileSubTab?: ProfileSubTab): string => {
  switch (tab) {
    case 'profile':
      switch (profileSubTab) {
        case 'SCHEDULE':
          return '/profile/PersonalSchedule';
        case 'GRADES':
          return '/profile/Grades';
        case 'EXAMS':
          return '/profile/Exams';
        case 'EXTERNAL_ACCOUNTS':
          return '/profile/ExternalAccounts';
        case 'TELEGRAM':
          return '/profile/Telegram';
        case 'SECURITY':
          return '/profile/Security';
        case 'OVERVIEW':
        default:
          return '/profile/Overview';
      }
    case 'personal_schedule':
      return '/personal-schedule';
    case 'schedule':
      return '/schedule';
    case 'registered_courses':
      return '/courses';
    case 'course_compare':
      return '/course-compare';
    case 'monitors_list':
      return '/monitors';
    case 'all_students':
      return '/students';
    case 'members':
      return '/monitor/members';
    case 'envelope':
    case 'envelope_all':
      return '/monitor/envelope-all';
    case 'settlement':
      return '/monitor/settlement';
    case 'monitor':
      return '/monitor/tools';
    case 'batches':
      return '/admin/batches';
    case 'external_accounts_admin':
      return '/admin/external-accounts';
    case 'telegram_admin':
      return '/admin/telegram';
    case 'activity_logs':
      return '/admin/activity-logs';
    case 'user_registrations':
      return '/admin/user-registrations';
    case 'database_backup':
      return '/admin/database-backup';
    case 'announcements_admin':
      return '/admin/announcements';
    default:
      return '/';
  }
};

export const getInitialHomeState = (): InitialHomeState => {
  if (typeof window === 'undefined') {
    return {
      tab: 'personal_schedule',
      profileSubTab: 'OVERVIEW',
      search: '',
      classCode: '',
      subjectCode: '',
      date: '',
      monitorClass: '',
      sortKey: 'DateTime',
      sortDir: 'asc',
      page: 1,
    };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const getParam = (key: string) => searchParams.get(key) || hashParams.get(key) || '';

  const pathname = window.location.pathname.replace(/^\/+|\/+$/g, '');
  const segments = pathname ? pathname.split('/') : [];

  let tab: NavigationTab = 'personal_schedule';
  let profileSubTab: ProfileSubTab = 'OVERVIEW';

  if (segments.length > 0) {
    const first = segments[0].toLowerCase();
    const second = segments[1] ? segments[1].toLowerCase() : '';

    if (first === 'profile') {
      tab = 'profile';
      if (second) {
        const normalizedSecond = second.replace(/[-_]/g, '');
        profileSubTab = PROFILE_SUBTAB_MAP[normalizedSecond] || PROFILE_SUBTAB_MAP[second] || 'OVERVIEW';
      }
    } else if (first === 'monitor' && second && MONITOR_SUBPATH_MAP[second]) {
      tab = MONITOR_SUBPATH_MAP[second];
    } else if (first === 'admin' && second && ADMIN_SUBPATH_MAP[second]) {
      tab = ADMIN_SUBPATH_MAP[second];
    } else if (PATH_TO_TAB_MAP[first]) {
      tab = PATH_TO_TAB_MAP[first];
    } else if (VALID_NAVIGATION_TABS.includes(first as NavigationTab)) {
      tab = first as NavigationTab;
    }
  } else {
    // Check fallback query param (?tab=...)
    const queryTab = (searchParams.get('tab') || hashParams.get('tab')) as NavigationTab;
    if (queryTab && VALID_NAVIGATION_TABS.includes(queryTab)) {
      tab = queryTab;
    }
  }

  // Also check subTab query param if present
  const querySubTab = (searchParams.get('subTab') || hashParams.get('subTab'))?.toUpperCase() as ProfileSubTab;
  if (
    querySubTab &&
    ['OVERVIEW', 'SCHEDULE', 'GRADES', 'EXTERNAL_ACCOUNTS', 'TELEGRAM', 'EXAMS', 'SECURITY'].includes(querySubTab)
  ) {
    profileSubTab = querySubTab;
  }

  const pageParam = parseInt(getParam('page'), 10);
  const initialPage = !isNaN(pageParam) && pageParam > 0 ? pageParam : 1;

  return {
    tab,
    profileSubTab,
    search: getParam('search'),
    classCode: getParam('classCode'),
    subjectCode: getParam('subjectCode'),
    date: getParam('date'),
    monitorClass: getParam('monitorClass') || getParam('classCode'),
    sortKey: (getParam('sortKey') as SortKey) || 'DateTime',
    sortDir: (getParam('sortDir') as SortDirection) || 'asc',
    page: initialPage,
  };
};
