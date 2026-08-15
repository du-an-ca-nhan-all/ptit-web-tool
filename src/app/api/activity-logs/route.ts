import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin } from '@/src/lib/auth';
import { logActivity } from '@/src/lib/activityLog';

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

// GET /api/activity-logs
// Query activity logs with filtering, searching, and pagination
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để xem nhật ký hoạt động' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const action = searchParams.get('action')?.trim();
    const targetType = searchParams.get('targetType')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    const isAdmin = checkIsAdmin(authUser.role);

    // Filter condition: Admin can view all, other users can only view their own logs
    const where: any = {};

    if (!isAdmin) {
      where.username = authUser.username;
    } else if (searchParams.get('username')) {
      where.username = searchParams.get('username')?.trim().toUpperCase();
    }

    if (action) {
      where.action = action;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { username: { contains: search } },
        { targetId: { contains: search } },
        { action: { contains: search } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    // Distinct actions for filter dropdown
    const distinctActionsRaw = await prisma.activityLog.findMany({
      distinct: ['action'],
      select: { action: true },
    });

    return NextResponse.json({
      success: true,
      logs: logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        username: l.username,
        userRole: l.userRole,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        description: l.description,
        metadata: l.metadata ? JSON.parse(l.metadata) : null,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        createdAt: l.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      availableActions: distinctActionsRaw.map((a) => a.action),
    });
  } catch (error: any) {
    console.error('Fetch activity logs error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi tải nhật ký hoạt động' }, { status: 500 });
  }
}

// POST /api/activity-logs
// Log client-side actions (e.g. SWITCH_ROLE, EXPORT_DATA, etc.)
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const body = await req.json();
    const { action, targetType, targetId, description, metadata } = body;

    if (!action || !description) {
      return NextResponse.json({ error: 'Action và description là bắt buộc' }, { status: 400 });
    }

    await logActivity({
      req,
      userId: authUser.id,
      username: authUser.username,
      userRole: authUser.role,
      action: String(action).toUpperCase(),
      targetType: targetType ? String(targetType).toUpperCase() : null,
      targetId: targetId ? String(targetId) : null,
      description: String(description),
      metadata,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Create activity log error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
