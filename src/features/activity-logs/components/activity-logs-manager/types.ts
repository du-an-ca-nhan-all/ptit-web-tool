import { LoginUser } from '../../../../types';

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

export interface ActivityLogsManagerProps {
  currentUser: LoginUser;
}

export interface ActivityLogsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ActionConfigItem {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: any;
  category: string;
}

export type DeleteLogsMode = 'COUNT' | 'DAYS' | 'ALL';
export type MetadataViewTab = 'VISUAL' | 'JSON';
