import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin } from '@/src/lib/auth';
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

// GET /api/activity-logs
// Query activity logs with filtering, searching, and pagination
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để xem nhật ký hoạt động' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const action = searchParams.get('action')?.trim();
    const targetType = searchParams.get('targetType')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    const isAdmin = checkIsAdmin(authUser.role);

    // Filter condition: Admin can view all, other users can only view their own logs
    const where: any = {};

    if (!isAdmin) {
      where.username = authUser.username;
    } else if (searchParams.get('username')) {
      where.username = searchParams.get('username')?.trim().toUpperCase();
    }

    if (action) {
      where.action = action;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { targetId: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    // Distinct actions for filter dropdown
    const distinctActionsRaw = await prisma.activityLog.findMany({
      distinct: ['action'],
      select: { action: true },
    });

    return NextResponse.json({
      success: true,
      logs: logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        username: l.username,
        userRole: l.userRole,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        description: l.description,
        metadata: l.metadata ? JSON.parse(l.metadata) : null,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        createdAt: l.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      availableActions: distinctActionsRaw.map((a) => a.action),
    });
  } catch (error: any) {
    console.error('Fetch activity logs error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi tải nhật ký hoạt động' }, { status: 500 });
  }
}

// POST /api/activity-logs
// Log client-side actions (e.g. SWITCH_ROLE, EXPORT_DATA, etc.)
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const body = await req.json();
    const { action, targetType, targetId, description, metadata } = body;

    if (!action || !description) {
      return NextResponse.json({ error: 'Action và description là bắt buộc' }, { status: 400 });
    }

    await logActivity({
      req,
      userId: authUser.id,
      username: authUser.username,
      userRole: authUser.role,
      action: String(action).toUpperCase(),
      targetType: targetType ? String(targetType).toUpperCase() : null,
      targetId: targetId ? String(targetId) : null,
      description: String(description),
      metadata,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Create activity log error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/activity-logs
// Clear logs (ALL, N oldest logs, older than X days, or selected IDs)
export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện' }, { status: 401 });
    }

    const isAdmin = checkIsAdmin(authUser.role) || (authUser as any).isAdmin;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Chỉ Quản trị viên (Admin) mới có quyền xoá nhật ký hoạt động' }, { status: 403 });
    }

    const body = await req.json();
    const { mode, count, days, ids, cleanReminderLogs } = body;
    let totalDeleted = 0;
    const details: any = {};

    if (mode === 'ALL') {
      const deleteRes = await prisma.activityLog.deleteMany({});
      totalDeleted += deleteRes.count;
      details.activityLogsDeleted = deleteRes.count;

      if (cleanReminderLogs) {
        const [r1, r2, r3] = await Promise.all([
          prisma.examReminderLog.deleteMany({}),
          prisma.classScheduleReminderLog.deleteMany({}),
          prisma.qldtAnnouncementLog.deleteMany({}),
        ]);
        details.examReminderLogsDeleted = r1.count;
        details.classScheduleLogsDeleted = r2.count;
        details.qldtAnnouncementLogsDeleted = r3.count;
        totalDeleted += r1.count + r2.count + r3.count;
      }
    } else if (mode === 'COUNT' || count) {
      const numToDelete = Math.max(1, parseInt(count, 10) || 100);
      const oldest = await prisma.activityLog.findMany({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
        take: numToDelete,
      });

      if (oldest.length > 0) {
        const deleteRes = await prisma.activityLog.deleteMany({
          where: { id: { in: oldest.map((l) => l.id) } },
        });
        totalDeleted += deleteRes.count;
        details.activityLogsDeleted = deleteRes.count;
      }
    } else if (mode === 'DAYS' || days) {
      const numDays = Math.max(1, parseInt(days, 10) || 30);
      const cutoffDate = new Date(Date.now() - numDays * 24 * 60 * 60 * 1000);

      const deleteRes = await prisma.activityLog.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      });
      totalDeleted += deleteRes.count;
      details.activityLogsDeleted = deleteRes.count;

      if (cleanReminderLogs) {
        const [r1, r2, r3] = await Promise.all([
          prisma.examReminderLog.deleteMany({ where: { sentAt: { lt: cutoffDate } } }),
          prisma.classScheduleReminderLog.deleteMany({ where: { sentAt: { lt: cutoffDate } } }),
          prisma.qldtAnnouncementLog.deleteMany({ where: { sentAt: { lt: cutoffDate } } }),
        ]);
        details.examReminderLogsDeleted = r1.count;
        details.classScheduleLogsDeleted = r2.count;
        details.qldtAnnouncementLogsDeleted = r3.count;
        totalDeleted += r1.count + r2.count + r3.count;
      }
    } else if (mode === 'SELECTED' && Array.isArray(ids) && ids.length > 0) {
      const numericIds = ids.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
      const deleteRes = await prisma.activityLog.deleteMany({
        where: { id: { in: numericIds } },
      });
      totalDeleted += deleteRes.count;
      details.activityLogsDeleted = deleteRes.count;
    } else {
      return NextResponse.json({ error: 'Chế độ xoá không hợp lệ. Vui lòng chọn ALL, COUNT, DAYS hoặc SELECTED' }, { status: 400 });
    }

    // Log the deletion action for auditing
    await logActivity({
      req,
      userId: authUser.id,
      username: authUser.username,
      userRole: authUser.role,
      action: 'DELETE_LOGS',
      targetType: 'ACTIVITY_LOG',
      targetId: mode || 'CLEANUP',
      description: `Admin ${authUser.username} đã dọn dẹp xoá ${totalDeleted} bản ghi log (${
        mode === 'ALL'
          ? 'Xoá tất cả log'
          : mode === 'COUNT'
          ? `Xoá ${count} bản ghi cũ nhất`
          : mode === 'DAYS'
          ? `Xoá log cũ hơn ${days} ngày`
          : `Xoá ${ids?.length || 0} log được chọn`
      })`,
      metadata: details,
    });

    return NextResponse.json({
      success: true,
      message: `Đã dọn dẹp xoá thành công ${totalDeleted} bản ghi nhật ký!`,
      totalDeleted,
      details,
    });
  } catch (error: any) {
    console.error('Delete activity logs error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi xoá nhật ký' }, { status: 500 });
  }
}
