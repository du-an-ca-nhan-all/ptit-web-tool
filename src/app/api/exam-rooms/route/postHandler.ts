import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/prisma';
import { parseJsonBody } from '@/src/lib/requestValidation';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { ACTIVITY_LOG_ACTIONS } from '@/src/features/activity-logs/types/activityLogActions';
import { getAuthUser, verifyIsMonitorOrAdmin } from './auth';

const postExamRoomBodySchema = z
  .object({
    roomKey: z.string().nullish(),
    mapThi: z.string().nullish(),
    maMH: z.string().nullish(),
    tenMH: z.string().nullish(),
    ngayThi: z.string().nullish(),
    gioThi: z.string().nullish(),
    maHTThi: z.string().nullish(),
    batchCode: z.string().nullish(),
    customPrice: z.union([z.number(), z.string()]).nullish(),
    note: z.string().nullish(),
  })
  .passthrough();

// POST /api/exam-rooms
// Thêm mới hoặc cập nhật mức giá phòng thi tùy chỉnh (Upsert theo roomKey)
export async function handlePostExamRoom(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!verifyIsMonitorOrAdmin(authUser)) {
      return NextResponse.json({ error: 'Chỉ Lớp Trưởng hoặc Quản trị viên mới có quyền cấu hình tiền phòng' }, { status: 403 });
    }
    const parsed = await parseJsonBody(req, postExamRoomBodySchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

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
