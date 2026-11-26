import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { ACTIVITY_LOG_ACTIONS } from '@/src/features/activity-logs/types/activityLogActions';
import { getAuthUser, verifyIsAdmin } from './auth';

// DELETE /api/exam-rooms
// Xóa phòng tùy chỉnh giá để hoàn về giá mặc định
export async function handleDeleteExamRoom(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!verifyIsAdmin(authUser)) {
      return NextResponse.json({ error: 'Chỉ Quản trị viên mới có quyền xóa cấu hình tiền phòng' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const roomKey = searchParams.get('roomKey');
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (clearAll) {
      const deleteCount = await prisma.examRoom.deleteMany({});
      await logActivity({
        req,
        userId: authUser?.id,
        username: authUser?.username,
        userRole: authUser?.role,
        action: ACTIVITY_LOG_ACTIONS.CLEAR_ALL_EXAM_ROOMS,
        targetType: 'EXAM_ROOM',
        description: `Quản trị viên ${authUser?.username} đã xóa toàn bộ định mức giá tùy chỉnh của tất cả phòng thi (${deleteCount.count} phòng)`,
        metadata: { deletedCount: deleteCount.count },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã xóa toàn bộ mức giá tùy chỉnh của các phòng thi',
      });
    }

    if (id) {
      const deleted = await prisma.examRoom.delete({
        where: { id: parseInt(id, 10) },
      });
      await logActivity({
        req,
        userId: authUser?.id,
        username: authUser?.username,
        userRole: authUser?.role,
        action: ACTIVITY_LOG_ACTIONS.DELETE_EXAM_ROOM,
        targetType: 'EXAM_ROOM',
        targetId: deleted.roomKey,
        description: `Quản trị viên ${authUser?.username} đã xóa mức giá tùy chỉnh của phòng thi ${deleted.mapThi} (${deleted.roomKey})`,
        metadata: deleted,
      });

      return NextResponse.json({
        success: true,
        message: 'Đã xóa mức giá tùy chỉnh của phòng thi',
      });
    }

    if (roomKey) {
      const deleted = await prisma.examRoom.delete({
        where: { roomKey: String(roomKey).trim() },
      });
      await logActivity({
        req,
        userId: authUser?.id,
        username: authUser?.username,
        userRole: authUser?.role,
        action: ACTIVITY_LOG_ACTIONS.DELETE_EXAM_ROOM,
        targetType: 'EXAM_ROOM',
        targetId: deleted.roomKey,
        description: `Quản trị viên ${authUser?.username} đã xóa mức giá tùy chỉnh của phòng thi ${deleted.mapThi} (${deleted.roomKey})`,
        metadata: deleted,
      });

      return NextResponse.json({
        success: true,
        message: 'Đã xóa mức giá tùy chỉnh của phòng thi',
      });
    }

    return NextResponse.json({ error: 'roomKey or id is required' }, { status: 400 });
  } catch (error: any) {
    console.error('Error deleting exam room:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
