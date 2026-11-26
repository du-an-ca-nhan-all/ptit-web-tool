import { SortKey, SortDirection } from '../../features/exam-schedule/types/exam.types';
import {
  ADMIN_SUBPATH_MAP,
  MONITOR_SUBPATH_MAP,
  PATH_TO_TAB_MAP,
  PROFILE_SUBTAB_MAP,
  VALID_NAVIGATION_TABS,
} from './constants';
import { InitialHomeState, NavigationTab, ProfileSubTab } from './types';

export const getNavigationPath = (
  tab: NavigationTab,
  profileSubTab?: ProfileSubTab,
  options?: {
    search?: string;
    classCode?: string;
    subjectCode?: string;
    date?: string;
    monitorClass?: string;
    page?: number;
    sortKey?: string;
    sortDir?: string;
  }
): string => {
  let basePath = '/';
  switch (tab) {
    case 'dashboard':
      basePath = '/dashboard';
      break;
    case 'profile':
      switch (profileSubTab) {
        case 'SCHEDULE':
          basePath = '/profile/PersonalSchedule';
          break;
        case 'GRADES':
          basePath = '/profile/Grades';
          break;
        case 'EXTERNAL_ACCOUNTS':
          basePath = '/profile/ExternalAccounts';
          break;
        case 'TELEGRAM':
          basePath = '/profile/Telegram';
          break;
        case 'SECURITY':
          basePath = '/profile/Security';
          break;
        case 'LMS':
          basePath = '/profile/Lms';
          break;
        case 'OVERVIEW':
        default:
          basePath = '/profile/Overview';
          break;
      }
      break;
    case 'personal_schedule':
      basePath = '/personal-schedule';
      break;
    case 'schedule':
      basePath = '/schedule';
      break;
    case 'registered_courses':
      basePath = '/courses';
      break;
    case 'reminders':
      basePath = '/reminders';
      break;
    case 'course_registration':
      basePath = '/course-registration';
      break;
    case 'course_compare':
      basePath = '/course-compare';
      break;
    case 'monitors_list':
      basePath = '/monitors';
      break;
    case 'all_students':
      basePath = '/students';
      break;
    case 'members':
      basePath = '/monitor/members';
      break;
    case 'monitor_flow':
      basePath = '/monitor/flow';
      break;
    case 'exam_review':
      basePath = '/monitor/exam-review';
      break;
    case 'room_analysis':
      basePath = '/monitor/room-analysis';
      break;
    case 'envelope':
    case 'envelope_all':
      basePath = '/monitor/envelope-all';
      break;
    case 'settlement':
      basePath = '/monitor/settlement';
      break;
    case 'monitor':
      basePath = '/monitor/tools';
      break;
    case 'batches':
      basePath = '/admin/batches';
      break;
    case 'external_accounts_admin':
      basePath = '/admin/external-accounts';
      break;
    case 'global_jobs':
      basePath = '/admin/global-jobs';
      break;
    case 'telegram_admin':
      basePath = '/admin/telegram';
      break;
    case 'activity_logs':
      basePath = '/admin/activity-logs';
      break;
    case 'user_registrations':
      basePath = '/admin/user-registrations';
      break;
    case 'database_backup':
      basePath = '/admin/database-backup';
      break;
    case 'announcements_admin':
      basePath = '/admin/announcements';
      break;
    default:
      basePath = '/';
      break;
  }

  if (options) {
    const params = new URLSearchParams();
    if (options.search) params.set('search', options.search);
    if (options.classCode) params.set('classCode', options.classCode);
    if (options.subjectCode) params.set('subjectCode', options.subjectCode);
    if (options.date) params.set('date', options.date);
    if (options.monitorClass) params.set('monitorClass', options.monitorClass);
    if (options.page && options.page > 1) params.set('page', String(options.page));
    if (options.sortKey && options.sortKey !== 'DateTime') params.set('sortKey', options.sortKey);
    if (options.sortDir && options.sortDir !== 'asc') params.set('sortDir', options.sortDir);
    const qs = params.toString();
    if (qs) return `${basePath}?${qs}`;
  }

  return basePath;
};

export const getInitialHomeState = (): InitialHomeState => {
  if (typeof window === 'undefined') {
    return {
      tab: 'dashboard',
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

  let tab: NavigationTab = 'dashboard';
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
    ['OVERVIEW', 'SCHEDULE', 'GRADES', 'LMS', 'EXTERNAL_ACCOUNTS', 'TELEGRAM', 'SECURITY'].includes(querySubTab)
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
    monitorClass:
      getParam('monitorClass') ||
      getParam('classCode') ||
      getParam('class') ||
      getParam('maLop'),
    sortKey: (getParam('sortKey') as SortKey) || 'DateTime',
    sortDir: (getParam('sortDir') as SortDirection) || 'asc',
    page: initialPage,
  };
};
