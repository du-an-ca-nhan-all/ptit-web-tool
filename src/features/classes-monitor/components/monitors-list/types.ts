import { LoginUser } from '../../types/class.types';

export interface MonitorsListProps {
  users: LoginUser[];
  onClassClick?: (classCode: string) => void;
  currentUser?: LoginUser | null;
  onReload?: () => void;
  isLoading?: boolean;
}
