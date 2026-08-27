import { LoginUser } from '../../../types';

export type { LoginUser };

export * from './activityLogActions';

export interface ActivityLogItem {
  id: number;
  userId?: number | null;
  username?: string | null;
  userRole?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  description: string;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}
