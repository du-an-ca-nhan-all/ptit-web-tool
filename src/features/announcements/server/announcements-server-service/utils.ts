import { AnnouncementItem } from '../../types/announcement.types';
import {
  GetAllAnnouncementsAdminOptions,
  UpdateAnnouncementInput,
} from './types';

export function formatAnnouncement(item: any): AnnouncementItem {
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    type: item.type || 'INFO',
    displayMode: item.displayMode || 'BANNER',
    targetRole: item.targetRole || 'ALL',
    targetClass: item.targetClass || null,
    linkUrl: item.linkUrl || null,
    linkText: item.linkText || null,
    isPinned: Boolean(item.isPinned),
    isActive: Boolean(item.isActive),
    startDate: item.startDate ? item.startDate.toISOString() : null,
    endDate: item.endDate ? item.endDate.toISOString() : null,
    author: item.author || null,
    viewCount: item.viewCount || 0,
    createdAt: item.createdAt ? item.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: item.updatedAt ? item.updatedAt.toISOString() : new Date().toISOString(),
  };
}

export function matchesAnnouncementAudience(
  item: AnnouncementItem,
  role: string,
  classCode?: string
): boolean {
  if (item.targetRole && item.targetRole !== 'ALL') {
    const itemRoles = item.targetRole.split(',').map((r: string) => r.trim());
    const userRoles = role.split(',').map((r: string) => r.trim());
    const hasRoleMatch = itemRoles.some((r: string) => userRoles.includes(r));
    if (!hasRoleMatch) return false;
  }

  if (item.targetClass && item.targetClass.trim() && item.targetClass.trim() !== 'ALL') {
    if (!classCode || classCode.toUpperCase() !== item.targetClass.trim().toUpperCase()) {
      return false;
    }
  }

  return true;
}

export function buildAdminAnnouncementsWhere(options?: GetAllAnnouncementsAdminOptions): any {
  const where: any = {};

  if (options?.search && options.search.trim()) {
    const q = options.search.trim();
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { content: { contains: q, mode: 'insensitive' } },
      { author: { contains: q, mode: 'insensitive' } },
      { targetClass: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (options?.type && options.type !== 'ALL') {
    where.type = options.type;
  }

  if (options?.displayMode && options.displayMode !== 'ALL') {
    where.displayMode = options.displayMode;
  }

  if (options?.targetRole && options.targetRole !== 'ALL') {
    where.targetRole = options.targetRole;
  }

  if (options?.status === 'ACTIVE') {
    where.isActive = true;
  } else if (options?.status === 'INACTIVE') {
    where.isActive = false;
  }

  return where;
}

export function buildUpdateAnnouncementData(data: UpdateAnnouncementInput): any {
  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.content !== undefined) updateData.content = data.content.trim();
  if (data.type !== undefined) updateData.type = data.type;
  if (data.displayMode !== undefined) updateData.displayMode = data.displayMode;
  if (data.targetRole !== undefined) updateData.targetRole = data.targetRole;
  if (data.targetClass !== undefined) updateData.targetClass = data.targetClass?.trim() || null;
  if (data.linkUrl !== undefined) updateData.linkUrl = data.linkUrl?.trim() || null;
  if (data.linkText !== undefined) updateData.linkText = data.linkText?.trim() || null;
  if (data.isPinned !== undefined) updateData.isPinned = Boolean(data.isPinned);
  if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
  if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

  return updateData;
}
