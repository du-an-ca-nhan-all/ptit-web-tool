import { LoginUser } from '../../types/auth.types';
import { ProfileSubTab } from '../../../../types/navigation';

export interface UserProfileScreenProps {
  currentUser: LoginUser & { student?: any };
  onLogout: () => void;
  onProfileUpdated?: (updatedUser: any) => void;
  hasExamSchedule?: boolean;
  onNavigateTab?: (tab: string) => void;
  userRoles?: string[];
  activeRole?: string;
  onSelectRole?: (role: string) => void;
  activeSubTab?: ProfileSubTab;
  onSubTabChange?: (subTab: ProfileSubTab) => void;
}

export interface ExternalAccountFormEntry {
  username: string;
  password: string;
  refreshToken?: string;
  validatedAccessToken?: string;
  showPass: boolean;
  isSaving: boolean;
  isTesting: boolean;
  testStatus?: 'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILED';
  testMessage?: string;
  lastTestedUser?: string;
  lastTestedPass?: string;
  lastTestedRefreshToken?: string;
}

export type ExternalAccountFormMap = {
  [key: string]: ExternalAccountFormEntry;
};
