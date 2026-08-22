import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin } from '@/src/lib/auth';

export interface EnvelopeAssignment {
  id?: number;
  roomKey: string;
  sessionId?: string;
  batchCode?: string;
  room?: string;
  date?: string;
  time?: string;
  subjectCode?: string;
  subject?: string;
  assignedClass: string;
  claimedByUsername?: string;
  claimedByName?: string;
  assistantStudentId?: string;
  assistantStudentName?: string;
  customPrice?: number;
  claimedAt?: string;
  note?: string;
}

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

// GET /api/envelope-assignments
// Lấy danh sách tất cả các phòng thi đã được xác nhận đi phong bì từ bảng RoomEnvelopeConfirmation
export async function GET() {
  try {
    const records = await prisma.roomEnvelopeConfirmation.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    const assignments: Record<string, EnvelopeAssignment> = {};
    records.forEach((r) => {
      assignments[r.sessionId] = {
        id: r.id,
        roomKey: r.sessionId,
        sessionId: r.sessionId,
        batchCode: r.batchCode || undefined,
        room: r.room || undefined,
        date: r.date || undefined,
        time: r.time || undefined,
        subjectCode: r.subjectCode || undefined,
        subject: r.subject || undefined,
        assignedClass: r.assignedClass,
        claimedByUsername: r.claimedByUsername,
        claimedByName: r.claimedByName || undefined,
        assistantStudentId: r.assistantStudentId || undefined,
        assistantStudentName: r.assistantStudentName || undefined,
        customPrice: r.customPrice ?? undefined,
        claimedAt: r.updatedAt.toISOString(),
        note: r.note || undefined,
      };
    });

    return NextResponse.json({
      success: true,
      assignments,
      list: records,
    });
  } catch (error: any) {
    console.error('Error fetching envelope assignments from RoomEnvelopeConfirmation:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/envelope-assignments
// Xác nhận nhận đi phong bì cho phòng thi, cho phép gán sinh viên hỗ trợ
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!verifyIsMonitorOrAdmin(authUser)) {
      return NextResponse.json({ error: 'Chỉ Lớp Trưởng hoặc Quản trị viên mới có quyền xác nhận phụ trách nước uống & hỗ trợ' }, { status: 403 });
    }

    const body = await req.json();
    const {
      roomKey,
      sessionId,
      assignedClass,
      assistantStudentId,
      assistantStudentName,
      customPrice,
      batchCode,
      room,
      date,
      time,
      subjectCode,
      subject,
      note,
    } = body;

    const targetSessionId = String(sessionId || roomKey || '').trim();
    if (!targetSessionId || !assignedClass) {
      return NextResponse.json({ error: 'sessionId (hoặc roomKey) và assignedClass là bắt buộc' }, { status: 400 });
    }

    const cleanClass = String(assignedClass).trim().toUpperCase();

    // Get monitor user display name
    let claimedByName = authUser?.fullName || authUser?.username || 'Lớp trưởng';
    try {
      const student = await prisma.student.findUnique({
        where: { maSV: authUser.username },
        select: { hoTen: true },
      });
      if (student?.hoTen) {
        claimedByName = student.hoTen;
      }
    } catch {}

    // Resolve assistant student name if assistantStudentId provided
    let finalAssistantName = assistantStudentName ? String(assistantStudentName).trim() : null;
    const finalAssistantId = assistantStudentId ? String(assistantStudentId).trim() : null;

    if (finalAssistantId && !finalAssistantName) {
      try {
        const asstStudent = await prisma.student.findUnique({
          where: { maSV: finalAssistantId },
          select: { hoTen: true },
        });
        if (asstStudent?.hoTen) {
          finalAssistantName = asstStudent.hoTen;
        }
      } catch {}
    }

    // Process customPrice
    let finalCustomPrice: number | null = null;
    if (customPrice !== undefined && customPrice !== null && customPrice !== '') {
      const parsedPrice = parseInt(String(customPrice), 10);
      if (!isNaN(parsedPrice) && parsedPrice >= 0) {
        finalCustomPrice = parsedPrice;
      }
    }

    const savedRecord = await prisma.roomEnvelopeConfirmation.upsert({
      where: { sessionId: targetSessionId },
      create: {
        sessionId: targetSessionId,
        batchCode: batchCode ? String(batchCode).trim() : null,
        room: room ? String(room).trim() : null,
        date: date ? String(date).trim() : null,
        time: time ? String(time).trim() : null,
        subjectCode: subjectCode ? String(subjectCode).trim() : null,
        subject: subject ? String(subject).trim() : null,
        assignedClass: cleanClass,
        claimedByUsername: authUser.username,
        claimedByName,
        assistantStudentId: finalAssistantId,
        assistantStudentName: finalAssistantName,
        customPrice: finalCustomPrice,
        note: note ? String(note).trim() : null,
      },
      update: {
        assignedClass: cleanClass,
        claimedByUsername: authUser.username,
        claimedByName,
        assistantStudentId: finalAssistantId,
        assistantStudentName: finalAssistantName,
        customPrice: finalCustomPrice,
        note: note ? String(note).trim() : null,
        batchCode: batchCode ? String(batchCode).trim() : undefined,
        room: room ? String(room).trim() : undefined,
        date: date ? String(date).trim() : undefined,
        time: time ? String(time).trim() : undefined,
        subjectCode: subjectCode ? String(subjectCode).trim() : undefined,
        subject: subject ? String(subject).trim() : undefined,
      },
    });

    // Also sync custom price to ExamRoom table for global pricing calculations
    try {
      if (finalCustomPrice !== null && finalCustomPrice > 0) {
        await prisma.examRoom.upsert({
          where: { roomKey: targetSessionId },
          create: {
            roomKey: targetSessionId,
            mapThi: room ? String(room).trim() : targetSessionId.split('|')[0] || targetSessionId,
            maMH: subjectCode ? String(subjectCode).trim() : null,
            tenMH: subject ? String(subject).trim() : null,
            ngayThi: date ? String(date).trim() : null,
            gioThi: time ? String(time).trim() : null,
            batchCode: batchCode ? String(batchCode).trim() : null,
            customPrice: finalCustomPrice,
            note: note ? String(note).trim() : null,
            updatedBy: authUser.username,
          },
          update: {
            customPrice: finalCustomPrice,
            note: note ? String(note).trim() : undefined,
            updatedBy: authUser.username,
          },
        });
      } else if (customPrice === null || finalCustomPrice === 0) {
        await prisma.examRoom.deleteMany({
          where: { roomKey: targetSessionId },
        });
      }
    } catch (e) {
      console.warn('Sync to ExamRoom error:', e);
    }

    // Save activity log
    try {
      await prisma.activityLog.create({
        data: {
          username: authUser.username,
          userRole: authUser.role || 'lop_truong',
          action: 'CLAIM_ENVELOPE',
          targetType: 'ROOM_ENVELOPE_CONFIRMATION',
          targetId: targetSessionId,
          description: `${claimedByName} (${authUser.username}) đã xác nhận phụ trách nước uống phòng ${targetSessionId} cho lớp ${cleanClass}${
            finalAssistantName ? ` (Gán SV hỗ trợ: ${finalAssistantName} - ${finalAssistantId})` : ''
          }${finalCustomPrice ? ` (Định mức tùy chỉnh: ${finalCustomPrice.toLocaleString()} đ)` : ''}`,
          metadata: JSON.stringify(savedRecord),
        },
      });
    } catch {}

    // Fetch all records to return updated map
    const records = await prisma.roomEnvelopeConfirmation.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    const assignments: Record<string, EnvelopeAssignment> = {};
    records.forEach((r) => {
      assignments[r.sessionId] = {
        id: r.id,
        roomKey: r.sessionId,
        sessionId: r.sessionId,
        batchCode: r.batchCode || undefined,
        room: r.room || undefined,
        date: r.date || undefined,
        time: r.time || undefined,
        subjectCode: r.subjectCode || undefined,
        subject: r.subject || undefined,
        assignedClass: r.assignedClass,
        claimedByUsername: r.claimedByUsername,
        claimedByName: r.claimedByName || undefined,
        assistantStudentId: r.assistantStudentId || undefined,
        assistantStudentName: r.assistantStudentName || undefined,
        customPrice: r.customPrice ?? undefined,
        claimedAt: r.updatedAt.toISOString(),
        note: r.note || undefined,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Đã xác nhận lớp ${cleanClass} phụ trách nước uống thành công`,
      assignments,
      assignment: assignments[targetSessionId],
    });
  } catch (error: any) {
    console.error('Error saving envelope assignment:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/envelope-assignments
// Hủy xác nhận phụ trách nước trong bảng RoomEnvelopeConfirmation
export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!verifyIsMonitorOrAdmin(authUser)) {
      return NextResponse.json({ error: 'Chỉ Lớp Trưởng hoặc Quản trị viên mới có quyền hủy xác nhận phụ trách' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const roomKey = searchParams.get('roomKey') || searchParams.get('sessionId');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (clearAll) {
      const isAdmin = checkIsAdmin(authUser.role) || authUser.isAdmin || authUser.activeRole === 'admin';
      if (!isAdmin) {
        return NextResponse.json({ error: 'Chỉ Quản trị viên mới có quyền xóa toàn bộ xác nhận phụ trách' }, { status: 403 });
      }

      await prisma.roomEnvelopeConfirmation.deleteMany({});

      return NextResponse.json({
        success: true,
        message: 'Đã xóa toàn bộ xác nhận phụ trách, trở về tự động',
        assignments: {},
      });
    }

    if (!roomKey) {
      return NextResponse.json({ error: 'sessionId (hoặc roomKey) là bắt buộc' }, { status: 400 });
    }

    const targetSessionId = String(roomKey).trim();

    const existing = await prisma.roomEnvelopeConfirmation.findUnique({
      where: { sessionId: targetSessionId },
    });

    if (existing) {
      await prisma.roomEnvelopeConfirmation.delete({
        where: { sessionId: targetSessionId },
      });

      // Record activity log
      try {
        await prisma.activityLog.create({
          data: {
            username: authUser.username,
            userRole: authUser.role || 'lop_truong',
            action: 'CANCEL_ENVELOPE_CLAIM',
            targetType: 'ROOM_ENVELOPE_CONFIRMATION',
            targetId: targetSessionId,
            description: `${authUser.username} đã hủy xác nhận phụ trách nước phòng ${targetSessionId} (Lớp: ${existing.assignedClass})`,
            metadata: JSON.stringify(existing),
          },
        });
      } catch {}
    }

    // Fetch updated list
    const records = await prisma.roomEnvelopeConfirmation.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    const assignments: Record<string, EnvelopeAssignment> = {};
    records.forEach((r) => {
      assignments[r.sessionId] = {
        id: r.id,
        roomKey: r.sessionId,
        sessionId: r.sessionId,
        batchCode: r.batchCode || undefined,
        room: r.room || undefined,
        date: r.date || undefined,
        time: r.time || undefined,
        subjectCode: r.subjectCode || undefined,
        subject: r.subject || undefined,
        assignedClass: r.assignedClass,
        claimedByUsername: r.claimedByUsername,
        claimedByName: r.claimedByName || undefined,
        assistantStudentId: r.assistantStudentId || undefined,
        assistantStudentName: r.assistantStudentName || undefined,
        claimedAt: r.updatedAt.toISOString(),
        note: r.note || undefined,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Đã hủy xác nhận phụ trách nước, chuyển về tự động tính theo lớp đông SV nhất',
      assignments,
    });
  } catch (error: any) {
    console.error('Error deleting room envelope confirmation:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
