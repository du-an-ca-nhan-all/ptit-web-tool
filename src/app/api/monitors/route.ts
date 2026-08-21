import { NextRequest, NextResponse } from 'next/server';
import { checkIsAdmin, getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { monitorsServerService } from '@/src/features/classes-monitor/server/monitorsServerService';

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeAll = searchParams.get('all') === 'true';

    const data = await monitorsServerService.getMonitorsAndUsers(includeAll);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Monitors API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện thao tác' }, { status: 401 });
    }

    const isAdmin = checkIsAdmin(authUser.role) || (authUser as any).isAdmin;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Chỉ Quản trị viên (Admin) mới có quyền chỉ định hoặc chuyển lớp trưởng' }, { status: 403 });
    }

    const body = await req.json();
    const { action = 'ASSIGN', classCode, newMonitorMaSV, fromMaSV, reason, monitorMaSV } = body;

    if (!classCode || typeof classCode !== 'string' || !classCode.trim()) {
      return NextResponse.json({ error: 'Mã lớp (classCode) là bắt buộc' }, { status: 400 });
    }

    if (action === 'ASSIGN' || action === 'TRANSFER') {
      if (!newMonitorMaSV || typeof newMonitorMaSV !== 'string' || !newMonitorMaSV.trim()) {
        return NextResponse.json({ error: 'Mã sinh viên của lớp trưởng mới là bắt buộc' }, { status: 400 });
      }

      const result = await monitorsServerService.assignOrTransferMonitor({
        classCode,
        newMonitorMaSV,
        fromMaSV,
        reason,
      });

      await logActivity({
        req,
        action: action === 'ASSIGN' ? 'ASSIGN_MONITOR' : 'TRANSFER_MONITOR',
        targetType: 'MONITOR',
        targetId: `${classCode}:${newMonitorMaSV}`,
        description: result.message,
        metadata: { classCode, newMonitorMaSV, fromMaSV, reason },
      });

      return NextResponse.json(result);
    } else if (action === 'REMOVE') {
      const targetMaSV = monitorMaSV || newMonitorMaSV;
      if (!targetMaSV) {
        return NextResponse.json({ error: 'Mã sinh viên cần thu hồi là bắt buộc' }, { status: 400 });
      }

      const result = await monitorsServerService.removeMonitor({
        classCode,
        monitorMaSV: targetMaSV,
        reason,
      });

      await logActivity({
        req,
        action: 'REMOVE_MONITOR',
        targetType: 'MONITOR',
        targetId: `${classCode}:${targetMaSV}`,
        description: result.message,
        metadata: { classCode, targetMaSV, reason },
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: `Hành động không hợp lệ: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('Monitors POST API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
