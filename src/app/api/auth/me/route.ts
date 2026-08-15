import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin, checkIsMonitor } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    let authUser = await getCurrentUserFromCookie();

    if (!authUser) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        authUser = await verifyAuthToken(token);
      }
    }

    if (!authUser) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        student: {
          include: {
            examRecords: {
              orderBy: [{ ngayThi: 'asc' }, { gioThi: 'asc' }],
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const isAdmin = checkIsAdmin(user.role);
    const isMonitor = checkIsMonitor(user.role);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        isAdmin,
        isMonitor,
        fullName: user.student?.hoTen || user.student?.ten || user.username,
        phoneNumber: user.student?.soDienThoai || null,
        lop: user.student?.maLop || null,
        student: user.student
          ? {
              maSV: user.student.maSV,
              hoLot: user.student.hoLot || '',
              ten: user.student.ten || '',
              hoTen: user.student.hoTen || `${user.student.hoLot || ''} ${user.student.ten || ''}`.trim(),
              gioiTinh: user.student.gioiTinh || 'Nam',
              ngaySinh: user.student.ngaySinh || '',
              maLop: user.student.maLop || '',
              soDienThoai: user.student.soDienThoai || '',
              ghiChu: user.student.ghiChu || '',
              examCount: user.student.examRecords.length,
              exams: user.student.examRecords.map((r) => ({
                id: r.id,
                MaMH: r.maMH || '',
                TenMH: r.tenMH || '',
                MAPTHI: r.mapThi || '',
                NgayThi: r.ngayThi || '',
                GioThi: r.gioThi || '',
                MaHTThi: r.maHTThi || '',
                SoPhutThi: r.soPhutThi || '',
              })),
            }
          : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    let authUser = await getCurrentUserFromCookie();

    if (!authUser) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        authUser = await verifyAuthToken(token);
      }
    }

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { soDienThoai, ghiChu } = body;

    // Update student info
    const updatedStudent = await prisma.student.update({
      where: { maSV: authUser.username },
      data: {
        soDienThoai: soDienThoai !== undefined ? String(soDienThoai).trim() : undefined,
        ghiChu: ghiChu !== undefined ? String(ghiChu).trim() : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      student: updatedStudent,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
