import { AnnouncementItem } from '../../types/announcement.types';

export interface GetActiveAnnouncementsOptions {
  role?: string | null;
  classCode?: string | null;
  limit?: number;
}

export interface GetAllAnnouncementsAdminOptions {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  displayMode?: string;
  status?: string;
  targetRole?: string;
}

export interface AnnouncementsAdminResult {
  announcements: AnnouncementItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    activeCount: number;
    modalCount: number;
    totalViews: number;
  };
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  type?: string;
  displayMode?: string;
  targetRole?: string;
  targetClass?: string | null;
  linkUrl?: string | null;
  linkText?: string | null;
  isPinned?: boolean;
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  author?: string | null;
}

export type UpdateAnnouncementInput = Partial<{
  title: string;
  content: string;
  type: string;
  displayMode: string;
  targetRole: string;
  targetClass: string | null;
  linkUrl: string | null;
  linkText: string | null;
  isPinned: boolean;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  author: string | null;
}>;
