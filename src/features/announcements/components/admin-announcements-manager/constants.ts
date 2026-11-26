import {
  AnnouncementFormData,
  AnnouncementPagination,
  AnnouncementStats,
} from './types';

export const INITIAL_STATS: AnnouncementStats = {
  total: 0,
  activeCount: 0,
  modalCount: 0,
  totalViews: 0,
};

export const INITIAL_PAGINATION: AnnouncementPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

export const INITIAL_FORM_DATA: AnnouncementFormData = {
  title: '',
  content: '',
  type: 'INFO',
  displayMode: 'BANNER',
  targetRole: 'ALL',
  targetClass: '',
  linkUrl: '',
  linkText: '',
  isPinned: false,
  isActive: true,
  startDate: '',
  endDate: '',
};
