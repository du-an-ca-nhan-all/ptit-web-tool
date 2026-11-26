import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { ACTIVITY_LOG_ACTIONS } from '@/src/features/activity-logs/types/activityLogActions';
import { getAuthUser, verifyIsMonitorOrAdmin } from './auth';
import { fetchEnvelopeConfirmationRecords, mapRecordsToAssignments } from './mappers';

// POST /api/envelope-assignments
// Xác nhận nhận đi phong bì cho phòng thi, cho phép gán sinh viên hỗ trợ
export async function handlePostEnvelopeAssignment(req: NextRequest) {
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
    await logActivity({
      req,
      userId: authUser.id,
      username: authUser.username,
      userRole: authUser.role || 'lop_truong',
      action: ACTIVITY_LOG_ACTIONS.CLAIM_ENVELOPE,
      targetType: 'ROOM_ENVELOPE_CONFIRMATION',
      targetId: targetSessionId,
      description: `${claimedByName || authUser.username} (${authUser.username}) đã xác nhận phụ trách nước uống phòng ${targetSessionId} cho lớp ${cleanClass}${
        finalAssistantName ? ` (Gán SV hỗ trợ: ${finalAssistantName} - ${finalAssistantId})` : ''
      }${finalCustomPrice ? ` (Định mức tùy chỉnh: ${finalCustomPrice.toLocaleString('vi-VN')} đ)` : ''}`,
      metadata: savedRecord,
    });

    // Fetch all records to return updated map
    const records = await fetchEnvelopeConfirmationRecords();
    const assignments = mapRecordsToAssignments(records, true);

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
