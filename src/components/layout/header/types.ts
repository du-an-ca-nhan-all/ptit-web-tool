import { LoginUser, ExamBatchItem } from '../../../types';
import { NavigationTab } from '../../../types/navigation';
import { AnnouncementItem } from '../../../features/announcements';

export interface HeaderProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onOpenMobileMenu: () => void;
  hasActiveBatch: boolean;
  activeBatch: ExamBatchItem | null;
  examBatches: ExamBatchItem[];
  onBatchChange: (batchCode: string) => void;
  recordsCount: number;
  baseRecordsCount: number;
  searchInput: string;
  onSearchChange: (value: string) => void;
  currentUser: LoginUser | null;
  userRoles: string[];
  activeRole: string;
  isRoleDropdownOpen: boolean;
  setIsRoleDropdownOpen: (open: boolean) => void;
  onSelectRole: (role: string) => void;
  canImpersonate: boolean;
  onOpenImpersonateModal: () => void;
  isLoading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  announcements?: AnnouncementItem[];
}
