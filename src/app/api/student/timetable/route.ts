import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin } from '@/src/lib/auth';
import { getStudentTimetableCalendar } from '@/src/features/external-portal/server/studentTimetableServerService';
import { prisma } from '@/src/lib/prisma';

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

    return NextResponse.json(timetableData);
  } catch (err: any) {
    console.error('[API student/timetable GET error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi khi tải lịch học cá nhân' },
      { status: 500 }
    );
  }
}
