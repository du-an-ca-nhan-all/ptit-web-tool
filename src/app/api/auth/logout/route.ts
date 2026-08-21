import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/src/lib/auth';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (authUser) {
      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'LOGOUT',
        targetType: 'AUTH',
        targetId: authUser.username,
        description: `Người dùng ${authUser.username} (${authUser.fullName || ''}) đăng xuất khỏi hệ thống`,
      });
    }
  } catch {}

  const response = NextResponse.json({ success: true, message: 'Đăng xuất thành công' });
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return response;
}
