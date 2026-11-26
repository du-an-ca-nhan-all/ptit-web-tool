import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveAnnouncements,
  getAllAnnouncementsAdmin,
  incrementAnnouncementViews,
} from '@/src/features/announcements/server/announcementsServerService';
import { getAuthUser } from './auth';

export async function handleGetAnnouncements(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdminView = searchParams.get('admin') === 'true';

    const authUser = await getAuthUser(req);

    if (isAdminView) {
      if (!authUser || !authUser.isAdmin) {
        return NextResponse.json(
          { error: 'Chỉ Quản trị viên mới có quyền truy cập màn hình quản lý thông báo' },
          { status: 403 }
        );
      }

      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '15', 10);
      const search = searchParams.get('search') || undefined;
      const type = searchParams.get('type') || undefined;
      const displayMode = searchParams.get('displayMode') || undefined;
      const status = searchParams.get('status') || undefined;
      const targetRole = searchParams.get('targetRole') || undefined;

      const result = await getAllAnnouncementsAdmin({
        page,
        limit,
        search,
        type,
        displayMode,
        status,
        targetRole,
      });

      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    // Public / End-user view
    const userRole = authUser?.role || 'sinh_vien';
    const userClass = authUser?.lop || undefined;

    const announcements = await getActiveAnnouncements({
      role: userRole,
      classCode: userClass,
    });

    // Increment views in background
    if (announcements.length > 0) {
      const ids = announcements.map((a) => a.id);
      incrementAnnouncementViews(ids).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      announcements,
      total: announcements.length,
    });
  } catch (err: any) {
    console.error('GET /api/announcements error:', err);
    return NextResponse.json(
      { error: 'Lỗi khi tải danh sách thông báo', details: err.message },
      { status: 500 }
    );
  }
}
