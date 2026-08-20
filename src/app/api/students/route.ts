import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { checkIsAdmin, getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';

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

// GET /api/students
// List all students with basic fields for standard users and full info for Admins
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    const isAdmin = Boolean(
      authUser &&
      (checkIsAdmin(authUser.role) || (authUser as any).isAdmin || authUser.activeRole === 'admin')
    );

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim();
    const classCode = (searchParams.get('classCode') || searchParams.get('maLop') || '').trim();
    const status = (searchParams.get('status') || searchParams.get('trangThai') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(500, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)));
    const all = searchParams.get('all') === 'true';

    const where: any = {};

    if (classCode && classCode !== 'ALL') {
      where.maLop = classCode;
    }

    if (status && status !== 'ALL') {
      where.trangThai = status;
    }

    if (search) {
      where.OR = [
        { maSV: { contains: search, mode: 'insensitive' } },
        { ten: { contains: search, mode: 'insensitive' } },
        { hoLot: { contains: search, mode: 'insensitive' } },
        { hoTen: { contains: search, mode: 'insensitive' } },
        { maLop: { contains: search, mode: 'insensitive' } },
        ...(isAdmin
          ? [
              { soDienThoai: { contains: search, mode: 'insensitive' } },
              { ghiChu: { contains: search, mode: 'insensitive' } },
            ]
          : []),
      ];
    }

    const [total, studentsRaw, classesGroup] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        include: {
          examRecords: {
            select: { id: true },
          },
          user: {
            select: {
              id: true,
              role: true,
              isActive: true,
              lastLogin: true,
              passwordHash: true,
            },
          },
        },
        orderBy: [{ maLop: 'asc' }, { ten: 'asc' }, { hoLot: 'asc' }, { maSV: 'asc' }],
        skip: all ? undefined : (page - 1) * limit,
        take: all ? undefined : limit,
      }),
      prisma.student.groupBy({
        by: ['maLop'],
        where: { maLop: { not: null } },
        _count: { maSV: true },
        orderBy: { maLop: 'asc' },
      }),
    ]);

    // Format output based on permissions
    const students = studentsRaw.map((s) => {
      const basic = {
        maSV: s.maSV,
        hoLot: s.hoLot || '',
        ten: s.ten || '',
        hoTen: s.hoTen || `${s.hoLot || ''} ${s.ten || ''}`.trim(),
        gioiTinh: s.gioiTinh || 'Nam',
        ngaySinh: s.ngaySinh || '',
        maLop: s.maLop || 'Chưa rõ lớp',
        trangThai: s.trangThai || 'DANG_HOC',
      };

      if (!isAdmin) {
        return basic;
      }

      // Admin Full Info
      const hasPassword = Boolean(s.user?.passwordHash && s.user.passwordHash.trim() !== '');
      return {
        ...basic,
        id: s.id,
        soDienThoai: s.soDienThoai || null,
        ghiChu: s.ghiChu || null,
        examCount: s.examRecords.length,
        user: s.user
          ? {
              id: s.user.id,
              role: s.user.role,
              isActive: s.user.isActive,
              lastLogin: s.user.lastLogin ? s.user.lastLogin.toISOString() : null,
              hasPassword,
            }
          : null,
        createdAt: s.createdAt.toISOString(),
      };
    });

    const classesList = classesGroup
      .map((c) => ({ classCode: c.maLop || '', count: c._count.maSV }))
      .filter((c) => Boolean(c.classCode));

    return NextResponse.json({
      success: true,
      isAdmin,
      students,
      classes: classesList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Fetch all students error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi tải danh sách sinh viên' }, { status: 500 });
  }
}
