import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin } from '@/src/lib/auth';
import { getStudentQldtExamSchedule } from '@/src/features/external-portal/server/studentExamScheduleServerService';
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
        return NextResponse.json({ error: 'Bạn không có quyền xem lịch thi của tài khoản khác' }, { status: 403 });
      }
      usernameToQuery = targetUsername;
    }

    const examData = await getStudentQldtExamSchedule(usernameToQuery, {
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
        action: ACTIVITY_LOG_ACTIONS.PULL_STUDENT_EXAM_SCHEDULE,
        targetType: 'STUDENT_EXAM_SCHEDULE',
        targetId: usernameToQuery,
        description: isOther
          ? `${authUser.username} đã làm mới lịch thi của sinh viên ${usernameToQuery}`
          : `${authUser.username} đã làm mới lịch thi cá nhân từ Cổng QLDTTX`,
        metadata: {
          targetStudent: usernameToQuery,
          forcedRefresh: refresh,
          semesterId,
          isQueryOther: Boolean(isOther),
          totalExams: (examData as any)?.totalExams ?? (examData as any)?.exams?.length ?? null,
        },
      });
    }

    return NextResponse.json(examData);
  } catch (err: any) {
    console.error('[API student/exam-schedule GET error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi khi tải lịch thi cá nhân từ QLDTTX' },
      { status: 500 }
    );
  }
}
