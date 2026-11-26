import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getAuthUser, normalizeCode } from './utils';

// GET /api/class-monitors/review-registrations?batchCode=...&classCode=...
export async function handleGetReviewRegistrations(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để truy cập' }, { status: 401 });
    }

    if (!authUser.isAdmin && !authUser.isMonitor) {
      return NextResponse.json(
        { error: 'Chỉ Lớp trưởng hoặc Quản trị viên mới có quyền quản lý danh sách ôn tập' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const batchCode = normalizeCode(searchParams.get('batchCode'));
    const requestedClass = normalizeCode(searchParams.get('classCode'));
    const userClass = normalizeCode(authUser.lop);
    const classCode = authUser.isAdmin ? requestedClass || userClass : userClass || requestedClass;

    if (!batchCode) {
      return NextResponse.json({ error: 'Mã đợt thi (batchCode) là bắt buộc' }, { status: 400 });
    }

    if (!classCode) {
      return NextResponse.json({ error: 'Mã lớp (classCode) là bắt buộc' }, { status: 400 });
    }

    // Non-admin monitors can only manage their own class
    if (!authUser.isAdmin && userClass && classCode !== userClass) {
      return NextResponse.json(
        { error: `Bạn chỉ có quyền quản lý danh sách ôn tập của lớp ${userClass}` },
        { status: 403 }
      );
    }

    // 1. Fetch class students, exam records in this batch, and existing review registrations in parallel
    const [classStudents, batchExamRecords, registrations] = await Promise.all([
      prisma.student.findMany({
        where: {
          maLop: { equals: classCode, mode: 'insensitive' },
          OR: [{ trangThai: null }, { trangThai: 'DANG_HOC' }],
        },
        select: {
          maSV: true,
          hoLot: true,
          ten: true,
          hoTen: true,
          gioiTinh: true,
          soDienThoai: true,
          maLop: true,
          trangThai: true,
        },
        orderBy: [{ ten: 'asc' }, { hoLot: 'asc' }, { maSV: 'asc' }],
      }),
      prisma.examRecord.findMany({
        where: {
          batchCode,
          OR: [
            { student: { maLop: { equals: classCode, mode: 'insensitive' } } },
            { maLopMH: { equals: classCode, mode: 'insensitive' } },
          ],
        },
        select: {
          maSV: true,
          maMH: true,
          tenMH: true,
          isPostponed: true,
          student: {
            select: {
              hoLot: true,
              ten: true,
              hoTen: true,
              gioiTinh: true,
              soDienThoai: true,
              maLop: true,
            },
          },
        },
      }),
      prisma.examReviewRegistration.findMany({
        where: {
          batchCode,
          classCode,
        },
      }),
    ]);

    // Map registrations by maSV
    const regMap = new Map<string, (typeof registrations)[number]>();
    for (const reg of registrations) {
      regMap.set(normalizeCode(reg.maSV), reg);
    }

    // Group exam subjects per student in this batch
    const examMap = new Map<
      string,
      {
        subjects: Map<string, string>;
        studentInfo?: {
          hoLot: string | null;
          ten: string | null;
          hoTen: string | null;
          gioiTinh: string | null;
          soDienThoai: string | null;
          maLop: string | null;
        };
      }
    >();

    for (const rec of batchExamRecords) {
      const maSV = normalizeCode(rec.maSV);
      if (!maSV) continue;
      if (!examMap.has(maSV)) {
        examMap.set(maSV, {
          subjects: new Map(),
          studentInfo: rec.student || undefined,
        });
      }
      if (rec.maMH) {
        examMap.get(maSV)!.subjects.set(rec.maMH, rec.tenMH || rec.maMH);
      }
    }

    // Combine students from Student table + any student found in exam records of this batch/class
    const studentById = new Map<
      string,
      {
        maSV: string;
        hoLot: string;
        ten: string;
        hoTen: string;
        gioiTinh: string;
        soDienThoai: string;
        maLop: string;
      }
    >();

    for (const st of classStudents) {
      const maSV = normalizeCode(st.maSV);
      if (!maSV) continue;
      const hoTen = st.hoTen?.trim() || `${st.hoLot || ''} ${st.ten || ''}`.trim() || maSV;
      studentById.set(maSV, {
        maSV,
        hoLot: st.hoLot || '',
        ten: st.ten || '',
        hoTen,
        gioiTinh: st.gioiTinh || 'Nam',
        soDienThoai: st.soDienThoai || '',
        maLop: st.maLop || classCode,
      });
    }

    for (const [maSV, info] of examMap.entries()) {
      if (!studentById.has(maSV)) {
        const st = info.studentInfo;
        const hoTen = st?.hoTen?.trim() || `${st?.hoLot || ''} ${st?.ten || ''}`.trim() || maSV;
        studentById.set(maSV, {
          maSV,
          hoLot: st?.hoLot || '',
          ten: st?.ten || '',
          hoTen,
          gioiTinh: st?.gioiTinh || 'Nam',
          soDienThoai: st?.soDienThoai || '',
          maLop: st?.maLop || classCode,
        });
      }
    }

    const students = Array.from(studentById.values())
      .map((st) => {
        const reg = regMap.get(st.maSV);
        const exams = examMap.get(st.maSV);
        const examSubjects = exams
          ? Array.from(exams.subjects.entries()).map(([code, name]) => ({ code, name }))
          : [];

        return {
          ...st,
          isRegistered: Boolean(reg?.isRegistered),
          note: reg?.note || '',
          updatedBy: reg?.updatedBy || null,
          updatedAt: reg?.updatedAt ? reg.updatedAt.toISOString() : null,
          examCount: examSubjects.length,
          examSubjects,
        };
      })
      .sort((a, b) => {
        const tenCmp = (a.ten || '').localeCompare(b.ten || '', 'vi');
        if (tenCmp !== 0) return tenCmp;
        const hoCmp = (a.hoLot || '').localeCompare(b.hoLot || '', 'vi');
        if (hoCmp !== 0) return hoCmp;
        return a.maSV.localeCompare(b.maSV);
      });

    const registeredCount = students.filter((s) => s.isRegistered).length;
    const studentsWithExams = students.filter((s) => s.examCount > 0).length;

    return NextResponse.json({
      success: true,
      batchCode,
      classCode,
      students,
      summary: {
        totalStudents: students.length,
        registeredCount,
        unregisteredCount: students.length - registeredCount,
        studentsWithExams,
      },
    });
  } catch (error: any) {
    console.error('GET /api/class-monitors/review-registrations error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi tải danh sách đăng ký ôn tập' },
      { status: 500 }
    );
  }
}
