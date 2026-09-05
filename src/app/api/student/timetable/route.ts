import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin } from '@/src/lib/auth';
import { getStudentTimetableCalendar } from '@/src/features/external-portal/server/studentTimetableServerService';
import { prisma } from '@/src/lib/prisma';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { ACTIVITY_LOG_ACTIONS } from '@/src/features/activity-logs/types/activityLogActions';

export async function GET(req: NextRequest) {
  try {
    let authUser = await getCurrentUserFromCookie();
    if (!authUser) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        authUser = await verifyAuthToken(token);
      }
    }

    if (!authUser) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const refresh = searchParams.get('refresh') === 'true';
    const targetUsername = searchParams.get('targetUsername')?.trim().toUpperCase();
    const semesterIdParam = searchParams.get('semesterId');
    const semesterId = semesterIdParam ? parseInt(semesterIdParam, 10) : undefined;

    let usernameToQuery = authUser.username.toUpperCase();
    if (targetUsername && targetUsername !== authUser.username.toUpperCase()) {
      const isAdmin = checkIsAdmin(authUser.role);
      const isMonitor = authUser.isMonitor;
      if (!isAdmin && !isMonitor) {
        return NextResponse.json({ error: 'Bạn không có quyền xem lịch học của tài khoản khác' }, { status: 403 });
      }
      usernameToQuery = targetUsername;
    }

    const timetableData = await getStudentTimetableCalendar(usernameToQuery, {
      forceRefresh: refresh,
      semesterId,
    });

    // Ghi log khi người dùng bấm Làm mới hoặc khi Cán sự/Admin tra cứu sinh viên khác
    if (refresh || (targetUsername && targetUsername !== authUser.username.toUpperCase())) {
      const isOther = targetUsername && targetUsername !== authUser.username.toUpperCase();
      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: ACTIVITY_LOG_ACTIONS.PULL_STUDENT_TIMETABLE,
        targetType: 'STUDENT_TIMETABLE',
        targetId: usernameToQuery,
        description: isOther
          ? `${authUser.username} đã làm mới thời khóa biểu của sinh viên ${usernameToQuery}`
          : `${authUser.username} đã làm mới thời khóa biểu cá nhân từ Cổng QLDTTX`,
        metadata: {
          targetStudent: usernameToQuery,
          forcedRefresh: refresh,
          semesterId,
          isQueryOther: Boolean(isOther),
          totalSubjects: (timetableData as any)?.uniqueSubjectsCount ?? (timetableData as any)?.subjects?.length ?? null,
          totalEvents: (timetableData as any)?.totalEvents ?? (timetableData as any)?.events?.length ?? null,
        },
      });
    }

    const { getRemindersForUser } = await import('@/src/features/reminders');
    const reminders = await getRemindersForUser(usernameToQuery, { status: 'ACTIVE' }).catch(() => []);

    return NextResponse.json({
      ...timetableData,
      reminders,
    });
  } catch (err: any) {
    console.error('[API student/timetable GET error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi khi tải lịch học cá nhân' },
      { status: 500 }
    );
  }
}
