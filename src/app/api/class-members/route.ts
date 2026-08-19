import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { ensureDatabaseSeeded } from '@/src/lib/dbSeeder';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin, checkIsMonitor } from '@/src/lib/auth';
import { logActivity } from '@/src/lib/activityLog';

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

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded(false);

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

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

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
      trangThai,
    } = body;

    if (!MaSV || !MaLop) {
      return NextResponse.json({ error: 'MaSV và MaLop là bắt buộc' }, { status: 400 });
    }

    const cleanMaSV = String(MaSV).trim().toUpperCase();
    const cleanLop = String(MaLop).trim();

    // Guard: Class permission check
    const isAdmin = checkIsAdmin(authUser.role);
    if (!isAdmin && authUser.lop !== cleanLop) {
      return NextResponse.json(
        { error: `Bạn chỉ có quyền chỉnh sửa thông tin thành viên thuộc lớp của mình (${authUser.lop})` },
        { status: 403 }
      );
    }

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
        trangThai: trangThai !== undefined ? trangThai : undefined,
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
        trangThai: trangThai || 'DANG_HOC',
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

    await logActivity({
      req,
      userId: authUser.id,
      username: authUser.username,
      userRole: authUser.role,
      action: 'UPDATE_STUDENT_INFO',
      targetType: 'STUDENT',
      targetId: cleanMaSV,
      description: `Cập nhật thông tin sinh viên ${cleanMaSV} (${saved.hoTen || ''}) thuộc lớp ${cleanLop}`,
      metadata: { cleanMaSV, cleanLop, phone, note, trangThai },
    });

    return NextResponse.json({ success: true, student: saved });
  } catch (error: any) {
    console.error('Class members POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const maSV = searchParams.get('maSV');
    const classCode = searchParams.get('classCode');

    if (!maSV) {
      return NextResponse.json({ error: 'maSV là bắt buộc' }, { status: 400 });
    }

    const cleanMaSV = maSV.toUpperCase();

    // Check student's class
    const student = await prisma.student.findUnique({ where: { maSV: cleanMaSV } });
    const targetClass = classCode || student?.maLop;

    const isAdmin = checkIsAdmin(authUser.role);
    if (!isAdmin && targetClass && authUser.lop !== targetClass) {
      return NextResponse.json(
        { error: `Bạn chỉ có quyền xóa sinh viên thuộc lớp của mình (${authUser.lop})` },
        { status: 403 }
      );
    }

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

    await logActivity({
      req,
      userId: authUser.id,
      username: authUser.username,
      userRole: authUser.role,
      action: 'DELETE_STUDENT',
      targetType: 'STUDENT',
      targetId: cleanMaSV,
      description: `Đã xóa sinh viên ${cleanMaSV} khỏi lớp ${targetClass || ''}`,
      metadata: { cleanMaSV, targetClass },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa sinh viên khỏi danh sách' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
