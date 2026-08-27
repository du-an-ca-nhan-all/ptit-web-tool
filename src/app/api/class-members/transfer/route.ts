import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin, checkIsMonitor } from '@/src/lib/auth';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';

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

// GET /api/class-members/transfer?classCode=...
// Fetch excluded/transferred students of a class directly from Student table
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classCode = searchParams.get('classCode');

    if (!classCode) {
      return NextResponse.json({ error: 'classCode is required' }, { status: 400 });
    }

    const students = await prisma.student.findMany({
      where: {
        maLop: classCode,
        trangThai: { not: 'DANG_HOC' },
      },
      include: {
        examRecords: {
          select: { id: true },
        },
      },
      orderBy: [{ ten: 'asc' }, { hoLot: 'asc' }],
    });

    const result = students.map((s) => ({
      maSV: s.maSV,
      hoLot: s.hoLot || '',
      ten: s.ten || '',
      hoTen: s.hoTen || `${s.hoLot || ''} ${s.ten || ''}`.trim(),
      gioiTinh: s.gioiTinh || 'Nam',
      ngaySinh: s.ngaySinh || '',
      maLop: s.maLop || classCode,
      trangThai: s.trangThai || 'BAO_LUU',
      soDienThoai: s.soDienThoai || '',
      ghiChu: s.ghiChu || '',
      examCount: s.examRecords.length,
    }));

    return NextResponse.json({ excludedStudents: result, total: result.length });
  } catch (error: any) {
    console.error('Fetch excluded students error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/class-members/transfer
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để thực hiện thao tác này' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, maSV, currentClass, targetClass, type, reason, studentInfo } = body;

    if (!maSV) {
      return NextResponse.json({ error: 'Mã sinh viên (maSV) là bắt buộc' }, { status: 400 });
    }

    const cleanMaSV = String(maSV).trim().toUpperCase();

    // 🔒 PERMISSION CHECK
    const isAdmin = checkIsAdmin(authUser.role);
    const isMonitor = checkIsMonitor(authUser.role);
    const userClass = authUser.lop;

    if (!isAdmin && !isMonitor) {
      return NextResponse.json(
        { error: 'Chỉ lớp trưởng hoặc quản trị viên mới có quyền thay đổi sĩ số lớp' },
        { status: 403 }
      );
    }

    // 1. ACTION: RECEIVE (Nhận sinh viên vào lớp)
    if (action === 'RECEIVE') {
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
      const updatedNote = student?.ghiChu ? `${student.ghiChu} • ${transferNote}` : transferNote;

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
    if (action === 'EXCLUDE') {
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

      let statusNote = '';
      let targetTrangThai = 'BAO_LUU';

      if (actionType === 'BAO_LUU') {
        targetTrangThai = 'BAO_LUU';
        statusNote = `[Bảo lưu] ${actionReason}`.trim();
      } else if (actionType === 'NGHI_HOC') {
        targetTrangThai = 'NGHI_HOC';
        statusNote = `[Nghỉ học] ${actionReason}`.trim();
      } else if (actionType === 'CHUYEN_LOP') {
        targetTrangThai = 'CHUYEN_LOP';
        statusNote = `[Chuyển lớp sang ${targetClass || 'mới'}] ${actionReason}`.trim();
      } else {
        targetTrangThai = 'LOAI_BO';
        statusNote = `[Loại khỏi lớp ${cleanCurrentClass}] ${actionReason}`.trim();
      }

      const existingStudent = await prisma.student.findUnique({ where: { maSV: cleanMaSV } });
      const updatedNote = existingStudent?.ghiChu ? `${existingStudent.ghiChu} • ${statusNote}` : statusNote;

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
    if (action === 'RESTORE') {
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
      const updatedNote = existingStudent?.ghiChu ? `${existingStudent.ghiChu} • ${restoreNote}` : restoreNote;

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

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Class transfer error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
