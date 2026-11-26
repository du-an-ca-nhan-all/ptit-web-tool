import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { checkIsMonitor } from '@/src/lib/auth';

export async function handleGetClassMembers(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classCode = searchParams.get('classCode');

    if (!classCode) {
      return NextResponse.json({ error: 'Mã lớp (classCode) là bắt buộc' }, { status: 400 });
    }

    // 1. Query active students for this class
    const studentsRaw = await prisma.student.findMany({
      where: {
        maLop: classCode,
        trangThai: 'DANG_HOC',
      },
      include: {
        user: { select: { role: true } },
        examRecords: {
          orderBy: [{ ngayThi: 'asc' }, { gioThi: 'asc' }],
        },
      },
      orderBy: [{ ten: 'asc' }, { hoLot: 'asc' }],
    });

    // 2. Query excluded / deferred / transferred students for this class
    const excludedStudentsRaw = await prisma.student.findMany({
      where: {
        maLop: classCode,
        trangThai: { not: 'DANG_HOC' },
      },
      include: {
        examRecords: { select: { id: true } },
      },
      orderBy: [{ ten: 'asc' }, { hoLot: 'asc' }],
    });

    // 3. Find class monitor
    const users = await prisma.user.findMany({
      where: {
        student: { maLop: classCode },
      },
      include: { student: true },
    });

    const monitor = users.find((u) => checkIsMonitor(u.role));

    const students = studentsRaw.map((s) => {
      const isMon = checkIsMonitor(s.user?.role) || (monitor && monitor.username.toUpperCase() === s.maSV.toUpperCase());

      return {
        MaSV: s.maSV,
        HoLotSV: s.hoLot || '',
        TenSV: s.ten || '',
        HoTen: s.hoTen || `${s.hoLot || ''} ${s.ten || ''}`.trim(),
        PHAI: s.gioiTinh || 'Nam',
        NgaySinhC: s.ngaySinh || '',
        MaLop: classCode,
        trangThai: s.trangThai || 'DANG_HOC',
        isMonitor: !!isMon,
        isTransferred: (s.ghiChu || '').includes('[Tiếp nhận'),
        phone: s.soDienThoai || '',
        note: s.ghiChu || '',
        examCount: s.examRecords.length,
        exams: s.examRecords.map((r) => ({
          id: r.id,
          MaSV: r.maSV,
          HoLotSV: s.hoLot || '',
          TenSV: s.ten || '',
          PHAI: s.gioiTinh || 'Nam',
          NgaySinhC: s.ngaySinh || '',
          NhomThi: r.nhomThi || '',
          MAPTHI: r.mapThi || '',
          MaMH: r.maMH || '',
          TenMH: r.tenMH || '',
          MaHTThi: r.maHTThi || '',
          NhomHoc: r.nhomHoc || '',
          'To thi': r.toThi || '',
          ToThi: r.toThi || '',
          MaLop: classCode,
          NgayThi: r.ngayThi || '',
          GioThi: r.gioThi || '',
          SoPhutThi: r.soPhutThi || '',
          MaDotThi: r.maDotThi || '',
          TenDotThi: r.tenDotThi || '',
          isPostponed: Boolean(r.isPostponed),
        })),
      };
    });

    const excludedStudents = excludedStudentsRaw.map((s) => ({
      MaSV: s.maSV,
      HoLotSV: s.hoLot || '',
      TenSV: s.ten || '',
      HoTen: s.hoTen || `${s.hoLot || ''} ${s.ten || ''}`.trim(),
      PHAI: s.gioiTinh || 'Nam',
      NgaySinhC: s.ngaySinh || '',
      MaLop: classCode,
      trangThai: s.trangThai,
      phone: s.soDienThoai || '',
      note: s.ghiChu || '',
      examCount: s.examRecords.length,
    }));

    return NextResponse.json({
      students,
      excludedStudents,
      excludedCount: excludedStudents.length,
      monitor: monitor
        ? {
            username: monitor.username,
            fullName: monitor.student?.hoTen || monitor.student?.ten || monitor.username,
            phoneNumber: monitor.student?.soDienThoai || null,
          }
        : null,
      total: students.length,
    });
  } catch (error: any) {
    console.error('Class members API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
