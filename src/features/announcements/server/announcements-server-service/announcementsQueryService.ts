import { unstable_cache } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { AnnouncementItem } from '../../types/announcement.types';
import {
  AnnouncementsAdminResult,
  GetActiveAnnouncementsOptions,
  GetAllAnnouncementsAdminOptions,
} from './types';
import {
  buildAdminAnnouncementsWhere,
  formatAnnouncement,
  matchesAnnouncementAudience,
} from './utils';

async function fetchActiveAnnouncementsRaw() {
  const now = new Date();
  const rawList = await (prisma as any).announcement.findMany({
    where: {
      isActive: true,
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      ],
    },
    orderBy: [
      { isPinned: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 50,
  });

  return rawList.map(formatAnnouncement);
}

const getCachedActiveAnnouncements = unstable_cache(
  fetchActiveAnnouncementsRaw,
  ['announcements-active-list'],
  {
    revalidate: 300,
    tags: ['announcements'],
  }
);

/**
 * Lấy danh sách các thông báo đang có hiệu lực dành cho người dùng (Cached with Next.js Cache)
 */
export async function getActiveAnnouncements(
  options?: GetActiveAnnouncementsOptions
): Promise<AnnouncementItem[]> {
  const limit = options?.limit || 20;
  const role = options?.role || 'sinh_vien';
  const classCode = options?.classCode?.trim();

  try {
    const activeList = await getCachedActiveAnnouncements();

    // Lọc theo targetRole và targetClass phía application logic
    const filtered = activeList.filter((item) =>
      matchesAnnouncementAudience(item, role, classCode)
    );

    return filtered.slice(0, limit);
  } catch (err) {
    console.error('getActiveAnnouncements error:', err);
    return [];
  }
}

/**
 * Lấy danh sách toàn bộ thông báo cho màn hình quản trị Admin
 */
export async function getAllAnnouncementsAdmin(
  options?: GetAllAnnouncementsAdminOptions
): Promise<AnnouncementsAdminResult> {
  const page = Math.max(1, options?.page || 1);
  const limit = Math.max(1, options?.limit || 15);
  const skip = (page - 1) * limit;
  const where = buildAdminAnnouncementsWhere(options);

  try {
    const [rawList, total, allRecords] = await Promise.all([
      (prisma as any).announcement.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      (prisma as any).announcement.count({ where }),
      (prisma as any).announcement.findMany({
        select: { isActive: true, displayMode: true, viewCount: true },
      }),
    ]);

    const activeCount = allRecords.filter((r: any) => r.isActive).length;
    const modalCount = allRecords.filter(
      (r: any) => r.displayMode === 'MODAL' || r.displayMode === 'BOTH'
    ).length;
    const totalViews = allRecords.reduce((sum: number, r: any) => sum + (r.viewCount || 0), 0);

    return {
      announcements: rawList.map(formatAnnouncement),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        total: allRecords.length,
        activeCount,
        modalCount,
        totalViews,
      },
    };
  } catch (err) {
    console.error('getAllAnnouncementsAdmin error:', err);
    return {
      announcements: [],
      pagination: { page: 1, limit, total: 0, totalPages: 1 },
      stats: { total: 0, activeCount: 0, modalCount: 0, totalViews: 0 },
    };
  }
}
