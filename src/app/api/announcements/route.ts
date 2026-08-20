import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import {
  getActiveAnnouncements,
  getAllAnnouncementsAdmin,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  bulkDeleteAnnouncements,
  toggleAnnouncementStatus,
  incrementAnnouncementViews,
} from '@/src/lib/announcements';
import { logActivity } from '@/src/lib/activityLog';

async function getAuthUser(req: NextRequest) {
  let authUser = await getCurrentUserFromCookie();
  if (!authUser) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      authUser = await verifyAuthToken(token);
    }
  }
  return authUser;
}

// GET /api/announcements or /api/announcements?admin=true
export async function GET(req: NextRequest) {
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

// POST /api/announcements
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !authUser.isAdmin) {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên mới có quyền thực hiện thao tác này' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action } = body;

    // 1. CREATE
    if (action === 'CREATE') {
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

      return NextResponse.json({
        success: true,
        message: 'Đã tạo thông báo mới thành công!',
        announcement,
      });
    }

    // 2. UPDATE
    if (action === 'UPDATE') {
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

      return NextResponse.json({
        success: true,
        message: 'Đã cập nhật thông báo thành công!',
        announcement,
      });
    }

    // 3. TOGGLE_STATUS
    if (action === 'TOGGLE_STATUS') {
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
      });

      return NextResponse.json({
        success: true,
        message: `Đã ${isActive ? 'kích hoạt' : 'tạm dừng'} thông báo thành công!`,
        announcement,
      });
    }

    // 4. DELETE
    if (action === 'DELETE') {
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
      });

      return NextResponse.json({
        success: true,
        message: 'Đã xóa thông báo thành công!',
      });
    }

    // 5. BULK_DELETE
    if (action === 'BULK_DELETE') {
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

      return NextResponse.json({
        success: true,
        message: `Đã xóa thành công ${count} thông báo!`,
        count,
      });
    }

    return NextResponse.json({ error: 'Hành động không được hỗ trợ' }, { status: 400 });
  } catch (err: any) {
    console.error('POST /api/announcements error:', err);
    return NextResponse.json(
      { error: 'Lỗi khi xử lý thông báo', details: err.message },
      { status: 500 }
    );
  }
}
