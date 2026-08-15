import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { ensureDatabaseSeeded } from '@/src/lib/dbSeeder';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';

// Helper to get authenticated user
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

// Helper to get or create class config
async function getClassConfig(classCode: string) {
  let config = await prisma.classConfig.findUnique({
    where: { classCode },
  });

  if (!config) {
    config = await prisma.classConfig.create({
      data: {
        classCode,
        includedStudents: JSON.stringify([]),
        excludedStudents: JSON.stringify([]),
      },
    });
  }

  return {
    config,
    included: JSON.parse(config.includedStudents || '[]') as string[],
    excluded: JSON.parse(config.excludedStudents || '[]') as string[],
  };
}

// GET /api/class-members/transfer?classCode=...
// Fetch excluded/transferred students of a class
export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded(false);

    const { searchParams } = new URL(req.url);
    const classCode = searchParams.get('classCode');

    if (!classCode) {
      return NextResponse.json({ error: 'classCode is required' }, { status: 400 });
    }

    const { excluded } = await getClassConfig(classCode);

    if (excluded.length === 0) {
      return NextResponse.json({ excludedStudents: [], total: 0 });
    }

    const students = await prisma.student.findMany({
      where: {
        maSV: { in: excluded },
      },
      include: {
        examRecords: {
          select: { id: true },
        },
      },
    });

    const result = students.map((s) => ({
      maSV: s.maSV,
      hoLot: s.hoLot || '',
      ten: s.ten || '',
      hoTen: s.hoTen || `${s.hoLot || ''} ${s.ten || ''}`.trim(),
      gioiTinh: s.gioiTinh || 'Nam',
      ngaySinh: s.ngaySinh || '',
      maLop: s.maLop || 'Đã loại khỏi lớp',
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
    await ensureDatabaseSeeded(false);

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

    // 🔒 PERMISSION CHECK: Lớp trưởng chỉ có quyền thao tác trên lớp của chính mình
    const isAdmin = authUser.role === 'admin';
    const isMonitor = authUser.role === 'lop_truong';
    const userClass = authUser.lop;

    if (!isAdmin && !isMonitor) {
      return NextResponse.json(
        { error: 'Chỉ lớp trưởng hoặc quản trị viên mới có quyền thay đổi sĩ số lớp' },
        { status: 403 }
      );
    }

    // 1. ACTION: RECEIVE (Nhận sinh viên từ lớp khác sang lớp quản lý)
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
            ghiChu: updatedNote,
          },
        });
      }

      // Update target class config: add to included, remove from excluded
      const { included, excluded } = await getClassConfig(cleanTargetClass);
      const newIncluded = Array.from(new Set([...included, cleanMaSV]));
      const newExcluded = excluded.filter((id) => id !== cleanMaSV);

      await prisma.classConfig.update({
        where: { classCode: cleanTargetClass },
        data: {
          includedStudents: JSON.stringify(newIncluded),
          excludedStudents: JSON.stringify(newExcluded),
        },
      });

      // Update old class config if it exists: remove from included
      if (oldClass && oldClass !== cleanTargetClass) {
        const oldCfg = await prisma.classConfig.findUnique({ where: { classCode: oldClass } });
        if (oldCfg) {
          const oldInc = (JSON.parse(oldCfg.includedStudents || '[]') as string[]).filter((id) => id !== cleanMaSV);
          const oldExc = Array.from(new Set([...(JSON.parse(oldCfg.excludedStudents || '[]') as string[]), cleanMaSV]));
          await prisma.classConfig.update({
            where: { classCode: oldClass },
            data: {
              includedStudents: JSON.stringify(oldInc),
              excludedStudents: JSON.stringify(oldExc),
            },
          });
        }
      }

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

      // Update current class config: add to excluded, remove from included
      const { included, excluded } = await getClassConfig(cleanCurrentClass);
      const newExcluded = Array.from(new Set([...excluded, cleanMaSV]));
      const newIncluded = included.filter((id) => id !== cleanMaSV);

      await prisma.classConfig.update({
        where: { classCode: cleanCurrentClass },
        data: {
          includedStudents: JSON.stringify(newIncluded),
          excludedStudents: JSON.stringify(newExcluded),
        },
      });

      let statusNote = '';
      if (actionType === 'BAO_LUU') statusNote = `[Bảo lưu] ${actionReason}`.trim();
      else if (actionType === 'NGHI_HOC') statusNote = `[Nghỉ học] ${actionReason}`.trim();
      else if (actionType === 'CHUYEN_LOP') statusNote = `[Chuyển lớp sang ${targetClass || 'mới'}] ${actionReason}`.trim();
      else statusNote = `[Loại khỏi lớp ${cleanCurrentClass}] ${actionReason}`.trim();

      const existingStudent = await prisma.student.findUnique({ where: { maSV: cleanMaSV } });
      const updatedNote = existingStudent?.ghiChu ? `${existingStudent.ghiChu} • ${statusNote}` : statusNote;

      if (actionType === 'CHUYEN_LOP' && targetClass) {
        const cleanTargetClass = String(targetClass).trim();
        // Update student to new class
        await prisma.student.update({
          where: { maSV: cleanMaSV },
          data: {
            maLop: cleanTargetClass,
            ghiChu: updatedNote,
          },
        });

        // Add to new class included list
        const targetCfg = await getClassConfig(cleanTargetClass);
        const targetInc = Array.from(new Set([...targetCfg.included, cleanMaSV]));
        const targetExc = targetCfg.excluded.filter((id) => id !== cleanMaSV);
        await prisma.classConfig.update({
          where: { classCode: cleanTargetClass },
          data: {
            includedStudents: JSON.stringify(targetInc),
            excludedStudents: JSON.stringify(targetExc),
          },
        });
      } else {
        // Just update status note & clear maLop from current class
        await prisma.student.update({
          where: { maSV: cleanMaSV },
          data: {
            maLop: null,
            ghiChu: updatedNote,
          },
        });
      }

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

      // Update class config: remove from excluded, add to included
      const { included, excluded } = await getClassConfig(cleanTargetClass);
      const newExcluded = excluded.filter((id) => id !== cleanMaSV);
      const newIncluded = Array.from(new Set([...included, cleanMaSV]));

      await prisma.classConfig.update({
        where: { classCode: cleanTargetClass },
        data: {
          includedStudents: JSON.stringify(newIncluded),
          excludedStudents: JSON.stringify(newExcluded),
        },
      });

      const existingStudent = await prisma.student.findUnique({ where: { maSV: cleanMaSV } });
      const restoreNote = '[Khôi phục vào lớp]';
      const updatedNote = existingStudent?.ghiChu ? `${existingStudent.ghiChu} • ${restoreNote}` : restoreNote;

      await prisma.student.update({
        where: { maSV: cleanMaSV },
        data: {
          maLop: cleanTargetClass,
          ghiChu: updatedNote,
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
