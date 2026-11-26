import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { checkIsAdmin, checkIsMonitor } from '@/src/lib/auth';
import { getAuthUser } from './route/utils';
import {
  handleExcludeAction,
  handleReceiveAction,
  handleRestoreAction,
} from './route/handlers';

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

    const ctx = { req, authUser, cleanMaSV, isAdmin, userClass };

    if (action === 'RECEIVE') {
      return handleReceiveAction(ctx, { currentClass, targetClass, reason, studentInfo });
    }

    if (action === 'EXCLUDE') {
      return handleExcludeAction(ctx, { currentClass, targetClass, type, reason });
    }

    if (action === 'RESTORE') {
      return handleRestoreAction(ctx, { targetClass });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Class transfer error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
