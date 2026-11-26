import { prisma } from '@/src/lib/prisma';
import { AnnouncementItem } from '../../types/announcement.types';
import {
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from './types';
import {
  buildUpdateAnnouncementData,
  formatAnnouncement,
} from './utils';

/**
 * Tạo thông báo mới
 */
export async function createAnnouncement(
  data: CreateAnnouncementInput
): Promise<AnnouncementItem> {
  const created = await (prisma as any).announcement.create({
    data: {
      title: data.title.trim(),
      content: data.content.trim(),
      type: data.type || 'INFO',
      displayMode: data.displayMode || 'BANNER',
      targetRole: data.targetRole || 'ALL',
      targetClass: data.targetClass?.trim() || null,
      linkUrl: data.linkUrl?.trim() || null,
      linkText: data.linkText?.trim() || null,
      isPinned: Boolean(data.isPinned),
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : null,
      author: data.author || 'Admin',
    },
  });

  return formatAnnouncement(created);
}

/**
 * Cập nhật thông báo
 */
export async function updateAnnouncement(
  id: number,
  data: UpdateAnnouncementInput
): Promise<AnnouncementItem> {
  const updateData = buildUpdateAnnouncementData(data);

  const updated = await (prisma as any).announcement.update({
    where: { id },
    data: updateData,
  });

  return formatAnnouncement(updated);
}

/**
 * Bật / tắt trạng thái hiển thị
 */
export async function toggleAnnouncementStatus(
  id: number,
  isActive: boolean
): Promise<AnnouncementItem> {
  const updated = await (prisma as any).announcement.update({
    where: { id },
    data: { isActive },
  });
  return formatAnnouncement(updated);
}

/**
 * Xóa thông báo
 */
export async function deleteAnnouncement(id: number): Promise<void> {
  await (prisma as any).announcement.delete({
    where: { id },
  });
}

/**
 * Xóa nhiều thông báo
 */
export async function bulkDeleteAnnouncements(ids: number[]): Promise<number> {
  const res = await (prisma as any).announcement.deleteMany({
    where: { id: { in: ids } },
  });
  return res.count;
}

/**
 * Tăng lượt xem cho danh sách thông báo
 */
export async function incrementAnnouncementViews(ids: number[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  try {
    await (prisma as any).announcement.updateMany({
      where: { id: { in: ids } },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  } catch (err) {
    console.warn(`[announcementsMutationService] Non-fatal error:`, err);
  }
}
