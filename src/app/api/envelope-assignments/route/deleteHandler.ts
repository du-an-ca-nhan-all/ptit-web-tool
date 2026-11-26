import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { checkIsAdmin } from '@/src/lib/auth';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { ACTIVITY_LOG_ACTIONS } from '@/src/features/activity-logs/types/activityLogActions';
import { getAuthUser, verifyIsMonitorOrAdmin } from './auth';
import { fetchEnvelopeConfirmationRecords, mapRecordsToAssignments } from './mappers';

// DELETE /api/envelope-assignments
// Hủy xác nhận phụ trách nước trong bảng RoomEnvelopeConfirmation
export async function handleDeleteEnvelopeAssignment(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!verifyIsMonitorOrAdmin(authUser)) {
      return NextResponse.json({ error: 'Chỉ Lớp Trưởng hoặc Quản trị viên mới có quyền hủy xác nhận phụ trách' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const roomKey = searchParams.get('roomKey') || searchParams.get('sessionId');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (clearAll) {
      const isAdmin = checkIsAdmin(authUser.role) || authUser.isAdmin || authUser.activeRole === 'admin';
      if (!isAdmin) {
        return NextResponse.json({ error: 'Chỉ Quản trị viên mới có quyền xóa toàn bộ xác nhận phụ trách' }, { status: 403 });
      }

      const deletedCount = await prisma.roomEnvelopeConfirmation.deleteMany({});

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role || 'admin',
        action: ACTIVITY_LOG_ACTIONS.CLEAR_ALL_ENVELOPE_CLAIMS,
        targetType: 'ROOM_ENVELOPE_CONFIRMATION',
        description: `Quản trị viên ${authUser.username} đã xóa toàn bộ danh sách xác nhận phụ trách nước uống (${deletedCount.count} phòng)`,
        metadata: { deletedCount: deletedCount.count },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã xóa toàn bộ xác nhận phụ trách, trở về tự động',
        assignments: {},
      });
    }

    if (!roomKey) {
      return NextResponse.json({ error: 'sessionId (hoặc roomKey) là bắt buộc' }, { status: 400 });
    }

    const targetSessionId = String(roomKey).trim();

    const existing = await prisma.roomEnvelopeConfirmation.findUnique({
      where: { sessionId: targetSessionId },
    });

    if (existing) {
      await prisma.roomEnvelopeConfirmation.delete({
        where: { sessionId: targetSessionId },
      });

      // Record activity log
      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role || 'lop_truong',
        action: ACTIVITY_LOG_ACTIONS.CANCEL_ENVELOPE_CLAIM,
        targetType: 'ROOM_ENVELOPE_CONFIRMATION',
        targetId: targetSessionId,
        description: `${authUser.username} đã hủy xác nhận phụ trách nước phòng ${targetSessionId} (Lớp: ${existing.assignedClass})`,
        metadata: existing,
      });
    }

    // Fetch updated list
    const records = await fetchEnvelopeConfirmationRecords();
    const assignments = mapRecordsToAssignments(records, false);

    return NextResponse.json({
      success: true,
      message: 'Đã hủy xác nhận phụ trách nước, chuyển về tự động tính theo lớp đông SV nhất',
      assignments,
    });
  } catch (error: any) {
    console.error('Error deleting room envelope confirmation:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
