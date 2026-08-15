import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { ensureDatabaseSeeded } from '@/src/lib/dbSeeder';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded(false);

    const { searchParams } = new URL(req.url);
    const classCode = searchParams.get('classCode');

    if (!classCode) {
      return NextResponse.json({ error: 'Mã lớp (classCode) là bắt buộc' }, { status: 400 });
    }

    // Query students in this class with their exam records & user role
    const studentsRaw = await prisma.student.findMany({
      where: { maLop: classCode },
      include: {
        user: { select: { role: true } },
        examRecords: {
          orderBy: [{ ngayThi: 'asc' }, { gioThi: 'asc' }],
        },
      },
      orderBy: [{ ten: 'asc' }, { hoLot: 'asc' }],
    });

    // Find class monitor
    const monitor = await prisma.user.findFirst({
      where: {
        role: 'lop_truong',
        student: { maLop: classCode },
      },
      include: { student: true },
    });

    const students = studentsRaw.map((s) => {
      const isMonitor = s.user?.role === 'lop_truong' || (monitor && monitor.username.toUpperCase() === s.maSV.toUpperCase());

      return {
        MaSV: s.maSV,
        HoLotSV: s.hoLot || '',
        TenSV: s.ten || '',
        HoTen: s.hoTen || `${s.hoLot || ''} ${s.ten || ''}`.trim(),
        PHAI: s.gioiTinh || 'Nam',
        NgaySinhC: s.ngaySinh || '',
        MaLop: s.maLop || classCode,
        isMonitor: !!isMonitor,
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
          MaLop: s.maLop || r.maLopMH || classCode,
          NgayThi: r.ngayThi || '',
          GioThi: r.gioThi || '',
          SoPhutThi: r.soPhutThi || '',
          MaDotThi: r.maDotThi || '',
          TenDotThi: r.tenDotThi || '',
        })),
      };
    });

    return NextResponse.json({
      students,
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      MaSV,
      MaLop,
      HoLotSV,
      TenSV,
      PHAI,
      NgaySinhC,
      phone,
      note,
    } = body;

    if (!MaSV || !MaLop) {
      return NextResponse.json({ error: 'MaSV và MaLop là bắt buộc' }, { status: 400 });
    }

    const cleanMaSV = String(MaSV).trim().toUpperCase();
    const cleanLop = String(MaLop).trim();
    const hoLot = HoLotSV !== undefined ? String(HoLotSV).trim() : undefined;
    const ten = TenSV !== undefined ? String(TenSV).trim() : undefined;
    const hoTen = hoLot || ten ? `${hoLot || ''} ${ten || ''}`.trim() : undefined;

    const saved = await prisma.student.upsert({
      where: { maSV: cleanMaSV },
      update: {
        maLop: cleanLop,
        hoLot: hoLot !== undefined ? hoLot : undefined,
        ten: ten !== undefined ? ten : undefined,
        hoTen: hoTen !== undefined ? hoTen : undefined,
        gioiTinh: PHAI !== undefined ? PHAI : undefined,
        ngaySinh: NgaySinhC !== undefined ? NgaySinhC : undefined,
        soDienThoai: phone !== undefined ? phone : undefined,
        ghiChu: note !== undefined ? note : undefined,
      },
      create: {
        maSV: cleanMaSV,
        maLop: cleanLop,
        hoLot: hoLot || null,
        ten: ten || cleanMaSV,
        hoTen: hoTen || cleanMaSV,
        gioiTinh: PHAI || 'Nam',
        ngaySinh: NgaySinhC || null,
        soDienThoai: phone || null,
        ghiChu: note || null,
      },
    });

    // Ensure User account exists
    await prisma.user.upsert({
      where: { username: cleanMaSV },
      update: {},
      create: {
        username: cleanMaSV,
        passwordHash: '',
        role: 'sinh_vien',
      },
    });

    return NextResponse.json({ success: true, student: saved });
  } catch (error: any) {
    console.error('Class members POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const maSV = searchParams.get('maSV');

    if (!maSV) {
      return NextResponse.json({ error: 'maSV là bắt buộc' }, { status: 400 });
    }

    const cleanMaSV = maSV.toUpperCase();

    // Delete student & linked user (cascade)
    await prisma.student.deleteMany({
      where: {
        maSV: cleanMaSV,
      },
    });

    await prisma.user.deleteMany({
      where: {
        username: cleanMaSV,
      },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa sinh viên khỏi danh sách' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
