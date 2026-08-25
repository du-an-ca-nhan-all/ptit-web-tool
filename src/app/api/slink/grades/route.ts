import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin } from '@/src/lib/auth';
import { getStudentSlinkGrades } from '@/src/features/external-portal/server/slinkGradesServerService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';

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

// GET /api/slink/grades
// Lấy kết quả học tập từ PTIT S-Link (Keycloak SSO & API qldt S-Link)
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
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
        return NextResponse.json(
          { error: 'Bạn không có quyền xem kết quả học tập của tài khoản khác' },
          { status: 403 }
        );
      }
      usernameToQuery = targetUsername;
    }

    const gradesData = await getStudentSlinkGrades(usernameToQuery, {
      forceRefresh: refresh,
    });

    if (refresh && gradesData.success) {
      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'SLINK_REFRESH_GRADES',
        targetType: 'EXTERNAL_ACCOUNT',
        targetId: usernameToQuery,
        description: `Làm mới và kéo kết quả học tập từ PTIT S-Link cho ${usernameToQuery}`,
      }).catch(() => {});
    }

    return NextResponse.json(gradesData);
  } catch (err: any) {
    console.error('[API slink/grades GET error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi khi tải kết quả học tập từ PTIT S-Link' },
      { status: 500 }
    );
  }
}

// POST /api/slink/grades
// Kích hoạt đồng bộ kết quả học tập từ PTIT S-Link
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const targetUsername = body.targetUsername?.trim().toUpperCase();

    let usernameToQuery = authUser.username.toUpperCase();
    if (targetUsername && targetUsername !== authUser.username.toUpperCase()) {
      const isAdmin = checkIsAdmin(authUser.role);
      const isMonitor = authUser.isMonitor;
      if (!isAdmin && !isMonitor) {
        return NextResponse.json(
          { error: 'Bạn không có quyền đồng bộ kết quả học tập của tài khoản khác' },
          { status: 403 }
        );
      }
      usernameToQuery = targetUsername;
    }

    const gradesData = await getStudentSlinkGrades(usernameToQuery, {
      forceRefresh: true,
    });

    if (gradesData.success) {
      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'SLINK_SYNC_GRADES',
        targetType: 'EXTERNAL_ACCOUNT',
        targetId: usernameToQuery,
        description: `Đồng bộ kết quả học tập từ PTIT S-Link cho ${usernameToQuery}`,
      }).catch(() => {});
    }

    return NextResponse.json(gradesData);
  } catch (err: any) {
    console.error('[API slink/grades POST error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi khi đồng bộ kết quả học tập từ PTIT S-Link' },
      { status: 500 }
    );
  }
}
