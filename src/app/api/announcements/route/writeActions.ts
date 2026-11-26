import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import {
  createAnnouncement,
  updateAnnouncement,
} from '@/src/features/announcements/server/announcementsServerService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import type { AuthUser } from './auth';

export async function handleCreateAnnouncement(
  req: NextRequest,
  body: any,
  authUser: AuthUser
) {
  const {
    title,
    content,
    type,
    displayMode,
    targetRole,
    targetClass,
    linkUrl,
    linkText,
    isPinned,
    isActive,
    startDate,
    endDate,
  } = body;

  if (!title || !title.trim()) {
    return NextResponse.json({ error: 'Vui lòng nhập tiêu đề thông báo' }, { status: 400 });
  }
  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'Vui lòng nhập nội dung thông báo' }, { status: 400 });
  }

  const announcement = await createAnnouncement({
    title,
    content,
    type,
    displayMode,
    targetRole,
    targetClass,
    linkUrl,
    linkText,
    isPinned,
    isActive,
    startDate,
    endDate,
    author: authUser.username,
  });

  await logActivity({
    req,
    action: 'CREATE_ANNOUNCEMENT',
    targetType: 'ANNOUNCEMENT',
    targetId: String(announcement.id),
    description: `Admin ${authUser.username} tạo thông báo mới "${announcement.title}" (${announcement.type} - ${announcement.displayMode})`,
    metadata: {
      announcementId: announcement.id,
      title: announcement.title,
      type: announcement.type,
      displayMode: announcement.displayMode,
    },
  });

  // Invalidate cache
  revalidateTag('announcements', { expire: 0 });

  return NextResponse.json({
    success: true,
    message: 'Đã tạo thông báo mới thành công!',
    announcement,
  });
}

export async function handleUpdateAnnouncement(
  req: NextRequest,
  body: any,
  authUser: AuthUser
) {
  const {
    id,
    title,
    content,
    type,
    displayMode,
    targetRole,
    targetClass,
    linkUrl,
    linkText,
    isPinned,
    isActive,
    startDate,
    endDate,
  } = body;

  if (!id || typeof id !== 'number') {
    return NextResponse.json({ error: 'ID thông báo không hợp lệ' }, { status: 400 });
  }

  const announcement = await updateAnnouncement(id, {
    title,
    content,
    type,
    displayMode,
    targetRole,
    targetClass,
    linkUrl,
    linkText,
    isPinned,
    isActive,
    startDate,
    endDate,
    author: authUser.username,
  });

  await logActivity({
    req,
    action: 'UPDATE_ANNOUNCEMENT',
    targetType: 'ANNOUNCEMENT',
    targetId: String(id),
    description: `Admin ${authUser.username} cập nhật thông báo ID #${id} "${announcement.title}"`,
    metadata: {
      announcementId: id,
      title: announcement.title,
      type: announcement.type,
      displayMode: announcement.displayMode,
      isActive: announcement.isActive,
    },
  });

  // Invalidate cache
  revalidateTag('announcements', { expire: 0 });

  return NextResponse.json({
    success: true,
    message: 'Đã cập nhật thông báo thành công!',
    announcement,
  });
}
