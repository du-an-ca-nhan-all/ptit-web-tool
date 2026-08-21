import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin } from '@/src/lib/auth';
import { getStudentGrades } from '@/src/features/external-portal/server/studentGradesServerService';

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

    let usernameToQuery = authUser.username.toUpperCase();
    if (targetUsername && targetUsername !== authUser.username.toUpperCase()) {
      const isAdmin = checkIsAdmin(authUser.role);
      const isMonitor = authUser.isMonitor;
      if (!isAdmin && !isMonitor) {
        return NextResponse.json({ error: 'Bạn không có quyền xem kết quả học tập của tài khoản khác' }, { status: 403 });
      }
      usernameToQuery = targetUsername;
    }

    const gradesData = await getStudentGrades(usernameToQuery, {
      forceRefresh: refresh,
    });

    return NextResponse.json(gradesData);
  } catch (err: any) {
    console.error('[API student/grades GET error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi khi tải kết quả học tập cá nhân' },
      { status: 500 }
    );
  }
}
