import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJsonBody } from '@/src/lib/requestValidation';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin, checkIsMonitor, getUserRoles } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { ACTIVITY_LOG_ACTIONS } from '@/src/features/activity-logs/types/activityLogActions';
import { syncStudentProfileFromQLDTTX } from '@/src/features/external-portal/server/studentProfileSyncService';

const updateMeSchema = z.object({
  soDienThoai: z.union([z.string(), z.number()]).nullish(),
  ghiChu: z.string().nullish(),
}).passthrough();

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
    const roles = authUser.roles || getUserRoles(user.role);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        roles,
        isAdmin,
        isMonitor,
        fullName: user.student?.hoTen || user.student?.ten || user.username,
        phoneNumber: user.student?.soDienThoai || null,
        lop: user.student?.maLop || null,
        impersonatedBy: authUser.impersonatedBy || null,
        student: user.student
          ? {
              maSV: user.student.maSV,
              hoLot: user.student.hoLot || '',
              ten: user.student.ten || '',
              hoTen: user.student.hoTen || `${user.student.hoLot || ''} ${user.student.ten || ''}`.trim(),
              gioiTinh: user.student.gioiTinh || null,
              ngaySinh: user.student.ngaySinh || null,
              maLop: user.student.maLop || '',
              soDienThoai: user.student.soDienThoai || null,
              soCMND: user.student.soCMND || null,
              email1: user.student.email1 || null,
              email2: user.student.email2 || null,
              noiSinh: user.student.noiSinh || null,
              quocTich: user.student.quocTich || null,
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
                isPostponed: Boolean(r.isPostponed),
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

    const parsed = await parseJsonBody(req, updateMeSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const { soDienThoai, ghiChu } = body;

    // Update student info
    const updatedStudent = await prisma.student.update({
      where: { maSV: authUser.username },
      data: {
        soDienThoai: soDienThoai !== undefined ? String(soDienThoai).trim() : undefined,
        ghiChu: ghiChu !== undefined ? String(ghiChu).trim() : undefined,
      },
    });

    await logActivity({
      req,
      userId: authUser.id,
      username: authUser.username,
      userRole: authUser.role,
      action: ACTIVITY_LOG_ACTIONS.UPDATE_MY_PROFILE,
      targetType: 'STUDENT',
      targetId: authUser.username,
      description: `${authUser.username} đã cập nhật thông tin liên hệ / ghi chú cá nhân`,
      metadata: {
        soDienThoai: updatedStudent.soDienThoai,
        ghiChu: updatedStudent.ghiChu,
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

export async function POST(req: NextRequest) {
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

    const syncRes = await syncStudentProfileFromQLDTTX({
      username: authUser.username,
      skipIfNoAccount: false,
    });

    if (!syncRes.synced || !syncRes.student) {
      return NextResponse.json(
        { error: 'Không thể đồng bộ thông tin sinh viên từ QLHT' },
        { status: 400 }
      );
    }

    await logActivity({
      req,
      userId: authUser.id,
      username: authUser.username,
      userRole: authUser.role,
      action: ACTIVITY_LOG_ACTIONS.UPDATE_MY_PROFILE,
      targetType: 'STUDENT',
      targetId: authUser.username,
      description: `${authUser.username} đã đồng bộ thông tin cá nhân từ Cổng QLHT`,
      metadata: { source: 'QLDTTX_PTTC1' },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã đồng bộ thông tin cá nhân từ Cổng QLHT thành công!',
      student: syncRes.student,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Lỗi khi đồng bộ thông tin từ QLHT' },
      { status: 400 }
    );
  }
}
