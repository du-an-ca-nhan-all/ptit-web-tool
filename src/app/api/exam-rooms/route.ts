import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin } from '@/src/lib/auth';
import { DEFAULT_PRICING_CONFIG, PricingConfig } from '@/src/config/pricingConfig';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { ACTIVITY_LOG_ACTIONS } from '@/src/features/activity-logs/types/activityLogActions';

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

function verifyIsMonitorOrAdmin(authUser: any): boolean {
  if (!authUser) return false;
  if (checkIsAdmin(authUser.role) || authUser.isAdmin || authUser.activeRole === 'admin') return true;
  if (authUser.isMonitor) return true;
  if (typeof authUser.role === 'string') {
    const roles = authUser.role.split(',').map((r: string) => r.trim().toLowerCase());
    if (roles.includes('lop_truong') || roles.includes('admin')) return true;
  }
  return false;
}

function verifyIsAdmin(authUser: any): boolean {
  if (!authUser) return false;
  return Boolean(
    checkIsAdmin(authUser.role) ||
    authUser.isAdmin ||
    authUser.activeRole === 'admin'
  );
}

// GET /api/exam-rooms
// Trả về danh sách tất cả các phòng thi có mức giá tùy chỉnh và cấu hình giá chung
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const batchCode = searchParams.get('batchCode') || undefined;
    const mapThi = searchParams.get('mapThi') || undefined;

    const where: any = {};
    if (batchCode) where.batchCode = batchCode;
    if (mapThi) where.mapThi = mapThi;

    const [examRooms, globalConfigRecord] = await Promise.all([
      prisma.examRoom.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      }),
      prisma.globalConfig.findUnique({
        where: { key: 'pricing_config' },
      }),
    ]);

    let globalPricing: PricingConfig = DEFAULT_PRICING_CONFIG;
    if (globalConfigRecord?.value) {
      try {
        const parsed = JSON.parse(globalConfigRecord.value);
        globalPricing = {
          commonRoom: typeof parsed.commonRoom === 'number' && parsed.commonRoom >= 0 ? parsed.commonRoom : DEFAULT_PRICING_CONFIG.commonRoom,
          englishOralRoom: typeof parsed.englishOralRoom === 'number' && parsed.englishOralRoom >= 0 ? parsed.englishOralRoom : DEFAULT_PRICING_CONFIG.englishOralRoom,
        };
      } catch {}
    }

    return NextResponse.json({
      success: true,
      examRooms,
      globalPricing,
    });
  } catch (error: any) {
    console.error('Error fetching exam rooms:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/exam-rooms
// Thêm mới hoặc cập nhật mức giá phòng thi tùy chỉnh (Upsert theo roomKey)
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!verifyIsMonitorOrAdmin(authUser)) {
      return NextResponse.json({ error: 'Chỉ Lớp Trưởng hoặc Quản trị viên mới có quyền cấu hình tiền phòng' }, { status: 403 });
    }
    const body = await req.json();

    const {
      roomKey,
      mapThi,
      maMH,
      tenMH,
      ngayThi,
      gioThi,
      maHTThi,
      batchCode,
      customPrice,
      note,
    } = body;

    if (!roomKey || !mapThi) {
      return NextResponse.json({ error: 'roomKey and mapThi are required' }, { status: 400 });
    }

    const priceNum = Math.max(0, parseInt(String(customPrice), 10) || 0);

    const examRoom = await prisma.examRoom.upsert({
      where: { roomKey: String(roomKey).trim() },
      create: {
        roomKey: String(roomKey).trim(),
        mapThi: String(mapThi).trim(),
        maMH: maMH ? String(maMH).trim() : null,
        tenMH: tenMH ? String(tenMH).trim() : null,
        ngayThi: ngayThi ? String(ngayThi).trim() : null,
        gioThi: gioThi ? String(gioThi).trim() : null,
        maHTThi: maHTThi ? String(maHTThi).trim() : null,
        batchCode: batchCode ? String(batchCode).trim() : null,
        customPrice: priceNum,
        note: note ? String(note).trim() : null,
        updatedBy: authUser?.username || 'SYSTEM',
      },
      update: {
        mapThi: String(mapThi).trim(),
        maMH: maMH ? String(maMH).trim() : undefined,
        tenMH: tenMH ? String(tenMH).trim() : undefined,
        ngayThi: ngayThi ? String(ngayThi).trim() : undefined,
        gioThi: gioThi ? String(gioThi).trim() : undefined,
        maHTThi: maHTThi ? String(maHTThi).trim() : undefined,
        batchCode: batchCode ? String(batchCode).trim() : undefined,
        customPrice: priceNum,
        note: note !== undefined ? (note ? String(note).trim() : null) : undefined,
        updatedBy: authUser?.username || 'SYSTEM',
      },
    });

    await logActivity({
      req,
      userId: authUser?.id,
      username: authUser?.username,
      userRole: authUser?.role,
      action: ACTIVITY_LOG_ACTIONS.UPDATE_EXAM_ROOM_PRICE,
      targetType: 'EXAM_ROOM',
      targetId: examRoom.roomKey,
      description: `${authUser?.username || 'Người dùng'} đã cập nhật định mức tiền phòng thi ${examRoom.mapThi} (${examRoom.tenMH || examRoom.maMH || examRoom.roomKey}) thành ${examRoom.customPrice.toLocaleString('vi-VN')} đ`,
      metadata: {
        roomKey: examRoom.roomKey,
        mapThi: examRoom.mapThi,
        maMH: examRoom.maMH,
        tenMH: examRoom.tenMH,
        ngayThi: examRoom.ngayThi,
        gioThi: examRoom.gioThi,
        customPrice: examRoom.customPrice,
        note: examRoom.note,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Lưu mức giá phòng thi thành công',
      examRoom,
    });
  } catch (error: any) {
    console.error('Error saving exam room:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/exam-rooms
// Lưu cấu hình định mức giá chung toàn hệ thống
export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!verifyIsAdmin(authUser)) {
      return NextResponse.json({ error: 'Chỉ Quản trị viên mới có quyền cấu hình định mức tiền phòng' }, { status: 403 });
    }
    const body = await req.json();

    const commonRoom = Math.max(0, parseInt(String(body.commonRoom), 10) || DEFAULT_PRICING_CONFIG.commonRoom);
    const englishOralRoom = Math.max(0, parseInt(String(body.englishOralRoom), 10) || DEFAULT_PRICING_CONFIG.englishOralRoom);

    const configValue = JSON.stringify({ commonRoom, englishOralRoom });

    await prisma.globalConfig.upsert({
      where: { key: 'pricing_config' },
      create: {
        key: 'pricing_config',
        value: configValue,
        description: 'Cấu hình định mức giá tiền phòng thi',
      },
      update: {
        value: configValue,
      },
    });

    await logActivity({
      req,
      userId: authUser?.id,
      username: authUser?.username,
      userRole: authUser?.role,
      action: ACTIVITY_LOG_ACTIONS.UPDATE_GLOBAL_PRICING_CONFIG,
      targetType: 'GLOBAL_CONFIG',
      targetId: 'pricing_config',
      description: `Quản trị viên ${authUser?.username} đã cập nhật định mức tiền phòng chung: Phòng thường = ${commonRoom.toLocaleString('vi-VN')} đ, Vấn đáp TA = ${englishOralRoom.toLocaleString('vi-VN')} đ`,
      metadata: { commonRoom, englishOralRoom },
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật cấu hình định mức tiền phòng thành công',
      globalPricing: { commonRoom, englishOralRoom },
    });
  } catch (error: any) {
    console.error('Error updating pricing config:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/exam-rooms
// Xóa phòng tùy chỉnh giá để hoàn về giá mặc định
export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!verifyIsAdmin(authUser)) {
      return NextResponse.json({ error: 'Chỉ Quản trị viên mới có quyền xóa cấu hình tiền phòng' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const roomKey = searchParams.get('roomKey');
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (clearAll) {
      const deleteCount = await prisma.examRoom.deleteMany({});
      await logActivity({
        req,
        userId: authUser?.id,
        username: authUser?.username,
        userRole: authUser?.role,
        action: ACTIVITY_LOG_ACTIONS.CLEAR_ALL_EXAM_ROOMS,
        targetType: 'EXAM_ROOM',
        description: `Quản trị viên ${authUser?.username} đã xóa toàn bộ định mức giá tùy chỉnh của tất cả phòng thi (${deleteCount.count} phòng)`,
        metadata: { deletedCount: deleteCount.count },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã xóa toàn bộ mức giá tùy chỉnh của các phòng thi',
      });
    }

    if (id) {
      const deleted = await prisma.examRoom.delete({
        where: { id: parseInt(id, 10) },
      });
      await logActivity({
        req,
        userId: authUser?.id,
        username: authUser?.username,
        userRole: authUser?.role,
        action: ACTIVITY_LOG_ACTIONS.DELETE_EXAM_ROOM,
        targetType: 'EXAM_ROOM',
        targetId: deleted.roomKey,
        description: `Quản trị viên ${authUser?.username} đã xóa mức giá tùy chỉnh của phòng thi ${deleted.mapThi} (${deleted.roomKey})`,
        metadata: deleted,
      });

      return NextResponse.json({
        success: true,
        message: 'Đã xóa mức giá tùy chỉnh của phòng thi',
      });
    }

    if (roomKey) {
      const deleted = await prisma.examRoom.delete({
        where: { roomKey: String(roomKey).trim() },
      });
      await logActivity({
        req,
        userId: authUser?.id,
        username: authUser?.username,
        userRole: authUser?.role,
        action: ACTIVITY_LOG_ACTIONS.DELETE_EXAM_ROOM,
        targetType: 'EXAM_ROOM',
        targetId: deleted.roomKey,
        description: `Quản trị viên ${authUser?.username} đã xóa mức giá tùy chỉnh của phòng thi ${deleted.mapThi} (${deleted.roomKey})`,
        metadata: deleted,
      });

      return NextResponse.json({
        success: true,
        message: 'Đã xóa mức giá tùy chỉnh của phòng thi',
      });
    }

    return NextResponse.json({ error: 'roomKey or id is required' }, { status: 400 });
  } catch (error: any) {
    console.error('Error deleting exam room:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
