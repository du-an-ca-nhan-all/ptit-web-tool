import { LoginUser } from '@/src/types/domain';

export type { LoginUser };

export interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'DANGER' | 'MAINTENANCE' | 'SYSTEM';
  displayMode: 'BANNER' | 'MODAL' | 'BOTH';
  targetRole: 'ALL' | 'sinh_vien' | 'lop_truong' | 'admin';
  targetClass?: string | null;
  linkUrl?: string | null;
  linkText?: string | null;
  isPinned: boolean;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  author?: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}
