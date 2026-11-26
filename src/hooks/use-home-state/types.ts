import { Dispatch, SetStateAction } from 'react';
import { FilterState, SortDirection, SortKey } from '../../features/exam-schedule';
import { ExamBatchItem, LoginUser } from '../../types';
import {
  InitialHomeState,
  NavigationTab,
  ProfileSubTab,
  TabChangeOptions,
} from '../../types/navigation';

export type SortConfig = {
  key: SortKey;
  direction: SortDirection;
} | null;

export interface FilterMeta {
  classes: string[];
  subjects: { code: string; name: string }[];
  dates: string[];
}

export type ProfileInitialTab = 'PROFILE' | 'EXTERNAL_ACCOUNTS';

export type HandleTabChange = (
  tab: NavigationTab,
  subTab?: ProfileSubTab,
  options?: TabChangeOptions
) => void;

export interface UseHomeNavigationParams {
  initialState: InitialHomeState;
  isAdmin: boolean;
  canAccessMonitorTools: boolean;
  monitorClass: string;
  setMonitorClass: Dispatch<SetStateAction<string>>;
  currentUser: LoginUser | null;
}

export interface UseHomeExamRecordsParams {
  activeBatch: ExamBatchItem | null;
  filters: FilterState;
  sortConfig: SortConfig;
  activeTab: NavigationTab;
  effectiveUser: LoginUser | null;
  monitorClass: string;
  page: number;
  pageSize: number;
}

export interface UseHomeAuthActionsParams {
  currentUser: LoginUser | null;
  setCurrentUser: Dispatch<SetStateAction<LoginUser | null>>;
  activeRole: string;
  setActiveRole: Dispatch<SetStateAction<string>>;
  userRoles: string[];
  activeTab: NavigationTab;
  handleTabChange: HandleTabChange;
  setMonitorClass: Dispatch<SetStateAction<string>>;
}
