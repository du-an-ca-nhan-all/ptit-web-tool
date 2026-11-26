import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import {
  deleteAnnouncement,
  bulkDeleteAnnouncements,
  toggleAnnouncementStatus,
} from '@/src/features/announcements/server/announcementsServerService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import type { AuthUser } from './auth';

export async function handleToggleAnnouncementStatus(
  req: NextRequest,
  body: any,
  authUser: AuthUser
) {
  const { id, isActive } = body;
  if (!id || typeof id !== 'number') {
    return NextResponse.json({ error: 'ID thông báo không hợp lệ' }, { status: 400 });
  }

  const announcement = await toggleAnnouncementStatus(id, Boolean(isActive));

  await logActivity({
    req,
    action: 'TOGGLE_ANNOUNCEMENT_STATUS',
    targetType: 'ANNOUNCEMENT',
    targetId: String(id),
    description: `Admin ${authUser.username} ${isActive ? 'bật' : 'tắt'} thông báo ID #${id} "${announcement.title}"`,
    metadata: {
      announcementId: id,
      title: announcement.title,
      isActive: announcement.isActive,
      type: announcement.type,
      displayMode: announcement.displayMode,
      updatedBy: authUser.username,
    },
  });

  // Invalidate cache
  revalidateTag('announcements', { expire: 0 });

  return NextResponse.json({
    success: true,
    message: `Đã ${isActive ? 'kích hoạt' : 'tạm dừng'} thông báo thành công!`,
    announcement,
  });
}

export async function handleDeleteAnnouncement(
  req: NextRequest,
  body: any,
  authUser: AuthUser
) {
  const { id } = body;
  if (!id || typeof id !== 'number') {
    return NextResponse.json({ error: 'ID thông báo không hợp lệ' }, { status: 400 });
  }

  await deleteAnnouncement(id);

  await logActivity({
    req,
    action: 'DELETE_ANNOUNCEMENT',
    targetType: 'ANNOUNCEMENT',
    targetId: String(id),
    description: `Admin ${authUser.username} xóa thông báo ID #${id}`,
    metadata: {
      announcementId: id,
      deletedBy: authUser.username,
    },
  });

  // Invalidate cache
  revalidateTag('announcements', { expire: 0 });

  return NextResponse.json({
    success: true,
    message: 'Đã xóa thông báo thành công!',
  });
}

export async function handleBulkDeleteAnnouncements(
  req: NextRequest,
  body: any,
  authUser: AuthUser
) {
  const { ids } = body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'Danh sách ID không hợp lệ' }, { status: 400 });
  }

  const count = await bulkDeleteAnnouncements(ids);

  await logActivity({
    req,
    action: 'BULK_DELETE_ANNOUNCEMENTS',
    targetType: 'ANNOUNCEMENT',
    targetId: ids.join(','),
    description: `Admin ${authUser.username} xóa hàng loạt ${count} thông báo`,
    metadata: { ids, count },
  });

  // Invalidate cache
  revalidateTag('announcements', { expire: 0 });

  return NextResponse.json({
    success: true,
    message: `Đã xóa thành công ${count} thông báo!`,
    count,
  });
}
