import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from './auth';
import {
  handleCreateAnnouncement,
  handleUpdateAnnouncement,
} from './writeActions';
import {
  handleToggleAnnouncementStatus,
  handleDeleteAnnouncement,
  handleBulkDeleteAnnouncements,
} from './manageActions';

export async function handlePostAnnouncements(req: NextRequest) {
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
      return await handleCreateAnnouncement(req, body, authUser);
    }

    // 2. UPDATE
    if (action === 'UPDATE') {
      return await handleUpdateAnnouncement(req, body, authUser);
    }

    // 3. TOGGLE_STATUS
    if (action === 'TOGGLE_STATUS') {
      return await handleToggleAnnouncementStatus(req, body, authUser);
    }

    // 4. DELETE
    if (action === 'DELETE') {
      return await handleDeleteAnnouncement(req, body, authUser);
    }

    // 5. BULK_DELETE
    if (action === 'BULK_DELETE') {
      return await handleBulkDeleteAnnouncements(req, body, authUser);
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
