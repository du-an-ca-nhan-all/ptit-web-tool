import { prisma } from './prisma';

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

/**
 * Lấy danh sách các thông báo đang có hiệu lực dành cho người dùng
 */
export async function getActiveAnnouncements(options?: {
  role?: string | null;
  classCode?: string | null;
  limit?: number;
}): Promise<AnnouncementItem[]> {
  const now = new Date();
  const limit = options?.limit || 20;

  const role = options?.role || 'sinh_vien';
  const classCode = options?.classCode?.trim();

  try {
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
      take: limit,
    });

    // Lọc theo targetRole và targetClass phía application logic
    const filtered = rawList.filter((item: any) => {
      // Role match
      if (item.targetRole && item.targetRole !== 'ALL') {
        const itemRoles = item.targetRole.split(',').map((r: string) => r.trim());
        const userRoles = role.split(',').map((r: string) => r.trim());
        const hasRoleMatch = itemRoles.some((r: string) => userRoles.includes(r));
        if (!hasRoleMatch) return false;
      }

      // Class match (nếu có chỉ định targetClass)
      if (item.targetClass && item.targetClass.trim() && item.targetClass.trim() !== 'ALL') {
        if (!classCode || classCode.toUpperCase() !== item.targetClass.trim().toUpperCase()) {
          return false;
        }
      }

      return true;
    });

    return filtered.map(formatAnnouncement);
  } catch (err) {
    console.error('getActiveAnnouncements error:', err);
    return [];
  }
}

/**
 * Lấy danh sách toàn bộ thông báo cho màn hình quản trị Admin
 */
export async function getAllAnnouncementsAdmin(options?: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  displayMode?: string;
  status?: string;
  targetRole?: string;
}): Promise<{
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
}> {
  const page = Math.max(1, options?.page || 1);
  const limit = Math.max(1, options?.limit || 15);
  const skip = (page - 1) * limit;

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
    const modalCount = allRecords.filter((r: any) => r.displayMode === 'MODAL' || r.displayMode === 'BOTH').length;
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

/**
 * Tạo thông báo mới
 */
export async function createAnnouncement(data: {
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
}): Promise<AnnouncementItem> {
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
  data: Partial<{
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
  }>
): Promise<AnnouncementItem> {
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

  const updated = await (prisma as any).announcement.update({
    where: { id },
    data: updateData,
  });

  return formatAnnouncement(updated);
}

/**
 * Bật / tắt trạng thái hiển thị
 */
export async function toggleAnnouncementStatus(id: number, isActive: boolean): Promise<AnnouncementItem> {
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
    // Ignore view count increment errors
  }
}

function formatAnnouncement(item: any): AnnouncementItem {
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
