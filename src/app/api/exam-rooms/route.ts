import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin } from '@/src/lib/auth';
import { DEFAULT_PRICING_CONFIG, PricingConfig } from '@/src/config/pricingConfig';

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
    if (!verifyIsAdmin(authUser)) {
      return NextResponse.json({ error: 'Chỉ Quản trị viên mới có quyền cấu hình tiền phòng' }, { status: 403 });
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
      await prisma.examRoom.deleteMany({});
      return NextResponse.json({
        success: true,
        message: 'Đã xóa toàn bộ mức giá tùy chỉnh của các phòng thi',
      });
    }

    if (id) {
      await prisma.examRoom.delete({
        where: { id: parseInt(id, 10) },
      });
      return NextResponse.json({
        success: true,
        message: 'Đã xóa mức giá tùy chỉnh của phòng thi',
      });
    }

    if (roomKey) {
      await prisma.examRoom.delete({
        where: { roomKey: String(roomKey).trim() },
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
