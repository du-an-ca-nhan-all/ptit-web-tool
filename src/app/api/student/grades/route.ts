import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin } from '@/src/lib/auth';
import { getStudentGrades } from '@/src/features/external-portal/server/studentGradesServerService';
import { getStudentSlinkGrades } from '@/src/features/external-portal/server/slinkGradesServerService';
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
    const source = (searchParams.get('source') || searchParams.get('system') || 'qldttx').toLowerCase();

    let usernameToQuery = authUser.username.toUpperCase();
    if (targetUsername && targetUsername !== authUser.username.toUpperCase()) {
      const isAdmin = checkIsAdmin(authUser.role);
      const isMonitor = authUser.isMonitor;
      if (!isAdmin && !isMonitor) {
        return NextResponse.json({ error: 'Bạn không có quyền xem kết quả học tập của tài khoản khác' }, { status: 403 });
      }
      usernameToQuery = targetUsername;
    }

    const gradesData = source === 'slink'
      ? await getStudentSlinkGrades(usernameToQuery, { forceRefresh: refresh })
      : await getStudentGrades(usernameToQuery, { forceRefresh: refresh });

    // Ghi log khi người dùng bấm Làm mới hoặc khi Cán sự/Admin tra cứu sinh viên khác
    if (refresh || (targetUsername && targetUsername !== authUser.username.toUpperCase())) {
      const isOther = targetUsername && targetUsername !== authUser.username.toUpperCase();
      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: ACTIVITY_LOG_ACTIONS.PULL_STUDENT_GRADES,
        targetType: 'STUDENT_GRADES',
        targetId: usernameToQuery,
        description: isOther
          ? `${authUser.username} đã làm mới bảng điểm (${source === 'slink' ? 'S-Link' : 'QLDTTX'}) của sinh viên ${usernameToQuery}`
          : `${authUser.username} đã làm mới kết quả học tập từ cổng ${source === 'slink' ? 'PTIT S-Link' : 'QLDTTX'}`,
        metadata: {
          targetStudent: usernameToQuery,
          source,
          forcedRefresh: refresh,
          isQueryOther: Boolean(isOther),
          gpa10: (gradesData as any)?.summary?.gpa10 ?? (gradesData as any)?.data?.stats?.gpa10 ?? null,
          gpa4: (gradesData as any)?.summary?.gpa4 ?? (gradesData as any)?.data?.stats?.gpa4 ?? null,
          totalSubjects: (gradesData as any)?.summary?.totalPassedCredits ?? (gradesData as any)?.courses?.length ?? null,
        },
      });
    }

    return NextResponse.json(gradesData);
  } catch (err: any) {
    console.error('[API student/grades GET error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi khi tải kết quả học tập cá nhân' },
      { status: 500 }
    );
  }
}

