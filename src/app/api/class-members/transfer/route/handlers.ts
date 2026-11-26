import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import type {
  ExcludeActionPayload,
  ReceiveActionPayload,
  RestoreActionPayload,
  TransferActionContext,
} from './types';
import { appendStudentNote, resolveExcludeStatus } from './utils';

// 1. ACTION: RECEIVE (Nhận sinh viên vào lớp)
export async function handleReceiveAction(
  ctx: TransferActionContext,
  payload: ReceiveActionPayload
): Promise<NextResponse> {
  const { req, authUser, cleanMaSV, isAdmin, userClass } = ctx;
  const { currentClass, targetClass, reason, studentInfo } = payload;

  if (!targetClass) {
    return NextResponse.json({ error: 'targetClass là bắt buộc khi nhận sinh viên' }, { status: 400 });
  }

  const cleanTargetClass = String(targetClass).trim();

  // Guard: Check class permission
  if (!isAdmin && userClass !== cleanTargetClass) {
    return NextResponse.json(
      { error: `Bạn chỉ có quyền tiếp nhận sinh viên vào lớp của mình (${userClass}), không thể thao tác trên lớp ${cleanTargetClass}` },
      { status: 403 }
    );
  }

  // Find or create student
  let student = await prisma.student.findUnique({
    where: { maSV: cleanMaSV },
  });

  const oldClass = student?.maLop || currentClass || 'Chưa rõ lớp';
  const transferNote = reason ? `[Tiếp nhận từ ${oldClass}] ${reason}` : `[Tiếp nhận từ ${oldClass}]`;
  const updatedNote = appendStudentNote(student?.ghiChu, transferNote);

  if (!student) {
    student = await prisma.student.create({
      data: {
        maSV: cleanMaSV,
        hoLot: studentInfo?.hoLot || '',
        ten: studentInfo?.ten || cleanMaSV,
        hoTen: studentInfo?.hoTen || studentInfo?.ten || cleanMaSV,
        gioiTinh: studentInfo?.gioiTinh || 'Nam',
        ngaySinh: studentInfo?.ngaySinh || null,
        maLop: cleanTargetClass,
        trangThai: 'DANG_HOC',
        soDienThoai: studentInfo?.soDienThoai || null,
        ghiChu: updatedNote,
      },
    });

    // Create user account
    await prisma.user.upsert({
      where: { username: cleanMaSV },
      update: {},
      create: {
        username: cleanMaSV,
        passwordHash: '',
        role: 'sinh_vien',
      },
    });
  } else {
    student = await prisma.student.update({
      where: { maSV: cleanMaSV },
      data: {
        maLop: cleanTargetClass,
        trangThai: 'DANG_HOC',
        ghiChu: updatedNote,
      },
    });
  }

  await logActivity({
    req,
    userId: authUser.id,
    username: authUser.username,
    userRole: authUser.role,
    action: 'RECEIVE_STUDENT',
    targetType: 'STUDENT',
    targetId: cleanMaSV,
    description: `Tiếp nhận sinh viên ${cleanMaSV} (${student.hoTen || ''}) vào lớp ${cleanTargetClass} (${transferNote})`,
    metadata: {
      maSV: cleanMaSV,
      hoTen: student.hoTen,
      targetClass: cleanTargetClass,
      oldClass,
      reason,
      transferNote,
      executedBy: authUser.username,
    },
  });

  return NextResponse.json({
    success: true,
    message: `Đã tiếp nhận thành công sinh viên ${cleanMaSV} vào lớp ${cleanTargetClass}`,
    student,
  });
}

// 2. ACTION: EXCLUDE (Loại bỏ / Bảo lưu / Nghỉ học / Chuyển lớp)
export async function handleExcludeAction(
  ctx: TransferActionContext,
  payload: ExcludeActionPayload
): Promise<NextResponse> {
  const { req, authUser, cleanMaSV, isAdmin, userClass } = ctx;
  const { currentClass, targetClass, type, reason } = payload;

  if (!currentClass) {
    return NextResponse.json({ error: 'currentClass là bắt buộc khi loại bỏ sinh viên' }, { status: 400 });
  }

  const cleanCurrentClass = String(currentClass).trim();

  // Guard: Check class permission
  if (!isAdmin && userClass !== cleanCurrentClass) {
    return NextResponse.json(
      { error: `Bạn chỉ có quyền loại bỏ/điều chuyển sinh viên thuộc lớp của mình (${userClass}), không thể thao tác trên lớp ${cleanCurrentClass}` },
      { status: 403 }
    );
  }

  const actionType = type || 'LOAI_BO'; // 'BAO_LUU' | 'NGHI_HOC' | 'CHUYEN_LOP' | 'LOAI_BO'
  const actionReason = reason ? String(reason).trim() : '';
  const { targetTrangThai, statusNote } = resolveExcludeStatus(
    actionType,
    actionReason,
    cleanCurrentClass,
    targetClass
  );

  const existingStudent = await prisma.student.findUnique({ where: { maSV: cleanMaSV } });
  const updatedNote = appendStudentNote(existingStudent?.ghiChu, statusNote);

  if (actionType === 'CHUYEN_LOP' && targetClass) {
    const cleanTargetClass = String(targetClass).trim();
    // Update student to new class
    await prisma.student.update({
      where: { maSV: cleanMaSV },
      data: {
        maLop: cleanTargetClass,
        trangThai: 'DANG_HOC',
        ghiChu: updatedNote,
      },
    });
  } else {
    // Keep maLop for class-level history reference, set trangThai to non-active
    await prisma.student.update({
      where: { maSV: cleanMaSV },
      data: {
        maLop: cleanCurrentClass,
        trangThai: targetTrangThai,
        ghiChu: updatedNote,
      },
    });
  }

  await logActivity({
    req,
    userId: authUser.id,
    username: authUser.username,
    userRole: authUser.role,
    action: 'EXCLUDE_STUDENT',
    targetType: 'STUDENT',
    targetId: cleanMaSV,
    description: `Điều chuyển/cập nhật trạng thái sinh viên ${cleanMaSV} (${existingStudent?.hoTen || ''}) thuộc lớp ${cleanCurrentClass}: ${statusNote}`,
    metadata: {
      maSV: cleanMaSV,
      hoTen: existingStudent?.hoTen,
      currentClass: cleanCurrentClass,
      actionType,
      targetTrangThai,
      targetClass,
      reason,
      statusNote,
      executedBy: authUser.username,
    },
  });

  return NextResponse.json({
    success: true,
    message: `Đã cập nhật trạng thái (${statusNote}) cho sinh viên ${cleanMaSV}`,
  });
}

// 3. ACTION: RESTORE (Khôi phục sinh viên quay lại lớp)
export async function handleRestoreAction(
  ctx: TransferActionContext,
  payload: RestoreActionPayload
): Promise<NextResponse> {
  const { req, authUser, cleanMaSV, isAdmin, userClass } = ctx;
  const { targetClass } = payload;

  if (!targetClass) {
    return NextResponse.json({ error: 'targetClass là bắt buộc khi khôi phục sinh viên' }, { status: 400 });
  }

  const cleanTargetClass = String(targetClass).trim();

  // Guard: Check class permission
  if (!isAdmin && userClass !== cleanTargetClass) {
    return NextResponse.json(
      { error: `Bạn chỉ có quyền khôi phục sinh viên vào lớp của mình (${userClass}), không thể thao tác trên lớp ${cleanTargetClass}` },
      { status: 403 }
    );
  }

  const existingStudent = await prisma.student.findUnique({ where: { maSV: cleanMaSV } });
  const restoreNote = '[Khôi phục vào lớp]';
  const updatedNote = appendStudentNote(existingStudent?.ghiChu, restoreNote);

  await prisma.student.update({
    where: { maSV: cleanMaSV },
    data: {
      maLop: cleanTargetClass,
      trangThai: 'DANG_HOC',
      ghiChu: updatedNote,
    },
  });

  await logActivity({
    req,
    userId: authUser.id,
    username: authUser.username,
    userRole: authUser.role,
    action: 'RESTORE_STUDENT',
    targetType: 'STUDENT',
    targetId: cleanMaSV,
    description: `Khôi phục sinh viên ${cleanMaSV} (${existingStudent?.hoTen || ''}) quay trở lại học tại lớp ${cleanTargetClass}`,
    metadata: {
      maSV: cleanMaSV,
      hoTen: existingStudent?.hoTen,
      targetClass: cleanTargetClass,
      previousStatus: existingStudent?.trangThai,
      executedBy: authUser.username,
    },
  });

  return NextResponse.json({
    success: true,
    message: `Đã khôi phục thành công sinh viên ${cleanMaSV} vào lớp ${cleanTargetClass}`,
  });
}
