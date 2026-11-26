import { LoginUser } from '../../../../types';
import { AnnouncementItem } from '../../../../features/announcements';

export interface AdminAnnouncementsManagerProps {
  currentUser: LoginUser;
}

export interface AnnouncementStats {
  total: number;
  activeCount: number;
  modalCount: number;
  totalViews: number;
}

export interface AnnouncementPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'DANGER' | 'MAINTENANCE' | 'SYSTEM';
  displayMode: 'BANNER' | 'MODAL' | 'BOTH';
  targetRole: 'ALL' | 'sinh_vien' | 'lop_truong' | 'admin';
  targetClass: string;
  linkUrl: string;
  linkText: string;
  isPinned: boolean;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export type PreviewTab = 'BANNER' | 'MODAL';

export type { AnnouncementItem };
