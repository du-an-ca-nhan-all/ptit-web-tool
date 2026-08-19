import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin } from '@/src/lib/auth';
import { getStudentQldtExamSchedule } from '@/src/lib/studentExamScheduleService';

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

    return NextResponse.json(examData);
  } catch (err: any) {
    console.error('[API student/exam-schedule GET error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi khi tải lịch thi cá nhân từ QLDTTX' },
      { status: 500 }
    );
  }
}
