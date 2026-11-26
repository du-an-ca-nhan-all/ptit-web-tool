import React from 'react';
import type {
  FilterState,
  SortKey,
  SortDirection,
} from '../../../features/exam-schedule';
import type { AnnouncementItem } from '../../../features/announcements';
import type {
  ExamRecord,
  LoginUser,
  ExamSession,
  ExamBatchItem,
} from '../../../types';
import type {
  NavigationTab,
  ProfileSubTab,
  TabChangeOptions,
} from '../../../types/navigation';

export interface HomeMainContentProps {
  isLoading: boolean;
  activeTab: NavigationTab;
  currentUser: LoginUser | null;
  effectiveUser: LoginUser | null;
  records: ExamRecord[];
  setRecords: React.Dispatch<React.SetStateAction<ExamRecord[]>>;
  sessions: ExamSession[];
  setSessions: React.Dispatch<React.SetStateAction<ExamSession[]>>;
  examBatches: ExamBatchItem[];
  activeBatch: ExamBatchItem | null;
  setActiveBatch: (batch: ExamBatchItem | null) => void;
  loginUsers: LoginUser[];
  monitorClass: string;
  setMonitorClass: (className: string) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  sortConfig: { key: SortKey; direction: SortDirection } | null;
  setSortConfig: React.Dispatch<
    React.SetStateAction<{ key: SortKey; direction: SortDirection } | null>
  >;
  selectedExamRoom: ExamRecord | null;
  setSelectedExamRoom: (room: ExamRecord | null) => void;
  setConfirmStudentId: (id: string | null) => void;
  setConfirmClassCode: (code: string | null) => void;
  setSearchInput: (val: string) => void;
  setIsClassGroupOpen: (open: boolean) => void;
  userRoles: string[];
  activeRole: string;
  handleSelectRole: (role: string) => void;
  handleLogout: () => Promise<void>;
  handleTabChange: (
    tab: NavigationTab,
    subTab?: ProfileSubTab,
    options?: TabChangeOptions,
  ) => void;
  handleImpersonate: (username: string) => Promise<void>;
  handleToggleExamPostpone: (
    record: ExamRecord,
    newStatus: boolean,
  ) => Promise<void>;
  loadDataFromApi: (batchCode?: string) => Promise<void>;
  fetchMonitorsData: () => Promise<void>;
  isLoadingMonitors?: boolean;
  fetchCourseCompareData: () => void;
  courseCompareData: {
    main: any;
    subAccount: any;
    allSubAccounts?: any[];
  } | null;
  isAdmin: boolean;
  canAccessMonitorTools: boolean;
  canImpersonate: boolean;
  hasActiveBatch: boolean;
  hasExamSchedule: boolean;
  baseRecords?: ExamRecord[];
  filteredRecords?: ExamRecord[];
  classes: string[];
  subjects: { code: string; name: string }[];
  dates: string[];
  setCurrentUser: (user: LoginUser | null) => void;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalRecords: number;
  totalPages: number;
  profileSubTab?: ProfileSubTab;
  setProfileSubTab?: (subTab: ProfileSubTab) => void;
  announcements?: AnnouncementItem[];
}
