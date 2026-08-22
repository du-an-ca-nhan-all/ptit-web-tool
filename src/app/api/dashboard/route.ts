import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import { getDashboardData } from '@/src/features/dashboard/server/dashboardServerService';

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
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để xem thông tin Dashboard' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetUsername = searchParams.get('username')?.trim().toUpperCase() || authUser.username;
    const requestedRole = searchParams.get('role')?.trim() || null;

    // If viewing another student, only Admin or Impersonator can do so
    const finalUsername =
      authUser.isAdmin || authUser.impersonatedBy ? targetUsername : authUser.username;

    const data = await getDashboardData(finalUsername, requestedRole);

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy dữ liệu Dashboard cho người dùng này' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      dashboard: data,
    });
  } catch (err: any) {
    console.error('Error fetching dashboard data:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi khi tải dữ liệu Dashboard' },
      { status: 500 }
    );
  }
}
