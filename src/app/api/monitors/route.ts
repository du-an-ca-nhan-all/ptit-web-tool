import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { ensureDatabaseSeeded } from '@/src/lib/dbSeeder';
import { checkIsAdmin, checkIsMonitor, getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
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
    const includeAll = searchParams.get('all') === 'true';

    const where: any = includeAll
      ? {}
      : {
          OR: [
            { role: { contains: 'lop_truong', mode: 'insensitive' } },
            { role: { contains: 'admin', mode: 'insensitive' } },
          ],
        };

    const usersRaw = await prisma.user.findMany({
      where,
      include: {
        student: true,
      },
      orderBy: [{ student: { maLop: 'asc' } }, { username: 'asc' }],
    });

    const users = usersRaw.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      isAdmin: checkIsAdmin(u.role),
      isMonitor: checkIsMonitor(u.role),
      fullName: u.student?.hoTen || u.student?.ten || u.username,
      phoneNumber: u.student?.soDienThoai || null,
      lop: u.student?.maLop || null,
    }));

    const monitors = users.filter((u) => u.isMonitor);

    return NextResponse.json({ users, monitors });
  } catch (error: any) {
    console.error('Monitors API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/monitors
// Actions: 'ASSIGN' | 'TRANSFER' | 'REMOVE'
// Only Admin is authorized
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện thao tác' }, { status: 401 });
    }

    const isAdmin = checkIsAdmin(authUser.role) || (authUser as any).isAdmin;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Chỉ Quản trị viên (Admin) mới có quyền chỉ định hoặc chuyển lớp trưởng' }, { status: 403 });
    }

    const body = await req.json();
    const { action = 'ASSIGN', classCode, newMonitorMaSV, fromMaSV, reason } = body;

    if (!classCode || typeof classCode !== 'string' || !classCode.trim()) {
      return NextResponse.json({ error: 'Mã lớp (classCode) là bắt buộc' }, { status: 400 });
    }

    const cleanClassCode = classCode.trim();

    if (action === 'ASSIGN' || action === 'TRANSFER') {
      if (!newMonitorMaSV || typeof newMonitorMaSV !== 'string' || !newMonitorMaSV.trim()) {
        return NextResponse.json({ error: 'Mã sinh viên của lớp trưởng mới là bắt buộc' }, { status: 400 });
      }

      const cleanNewMaSV = newMonitorMaSV.trim().toUpperCase();

      // Find target student
      let newStudent = await prisma.student.findUnique({
        where: { maSV: cleanNewMaSV },
      });

      if (!newStudent) {
        // Check if student exists in user table
        const existingUser = await prisma.user.findUnique({
          where: { username: cleanNewMaSV },
          include: { student: true },
        });
        if (existingUser?.student) {
          newStudent = existingUser.student;
        } else {
          return NextResponse.json({ error: `Không tìm thấy thông tin sinh viên ${cleanNewMaSV}` }, { status: 404 });
        }
      }

      // If student is not in this class, update student's maLop to cleanClassCode
      if (newStudent.maLop !== cleanClassCode) {
        await prisma.student.update({
          where: { maSV: cleanNewMaSV },
          data: { maLop: cleanClassCode },
        });
      }

      // Find all current monitors of this class
      const currentClassUsers = await prisma.user.findMany({
        where: {
          student: { maLop: cleanClassCode },
          role: { contains: 'lop_truong', mode: 'insensitive' },
        },
        include: { student: true },
      });

      // Demote existing monitors (except the new one if same)
      for (const oldUser of currentClassUsers) {
        if (oldUser.username !== cleanNewMaSV) {
          let updatedRole = 'sinh_vien';
          if (oldUser.role.includes('admin')) {
            updatedRole = 'admin';
          }
          await prisma.user.update({
            where: { id: oldUser.id },
            data: { role: updatedRole },
          });
        }
      }

      // If fromMaSV is explicitly passed and different
      if (fromMaSV && fromMaSV.trim().toUpperCase() !== cleanNewMaSV) {
        const cleanFromMaSV = fromMaSV.trim().toUpperCase();
        const oldSpecificUser = await prisma.user.findUnique({
          where: { username: cleanFromMaSV },
        });
        if (oldSpecificUser && oldSpecificUser.role.includes('lop_truong')) {
          let updatedRole = 'sinh_vien';
          if (oldSpecificUser.role.includes('admin')) {
            updatedRole = 'admin';
          }
          await prisma.user.update({
            where: { id: oldSpecificUser.id },
            data: { role: updatedRole },
          });
        }
      }

      // Promote new student to monitor
      const existingNewUser = await prisma.user.findUnique({
        where: { username: cleanNewMaSV },
      });

      let finalRole = 'lop_truong';
      if (existingNewUser && existingNewUser.role.includes('admin')) {
        finalRole = 'admin,lop_truong';
      }

      await prisma.user.upsert({
        where: { username: cleanNewMaSV },
        update: { role: finalRole },
        create: {
          username: cleanNewMaSV,
          passwordHash: '',
          role: finalRole,
        },
      });

      const oldMonitorNames = currentClassUsers
        .filter((u) => u.username !== cleanNewMaSV)
        .map((u) => `${u.student?.hoTen || u.username} (${u.username})`)
        .join(', ');

      const descText =
        action === 'TRANSFER' && oldMonitorNames
          ? `Admin ${authUser.username} đã chuyển vai trò Lớp trưởng lớp ${cleanClassCode} từ [${oldMonitorNames}] sang ${newStudent.hoTen || cleanNewMaSV} (${cleanNewMaSV})${reason ? ` - Lý do: ${reason}` : ''}`
          : `Admin ${authUser.username} đã chỉ định ${newStudent.hoTen || cleanNewMaSV} (${cleanNewMaSV}) làm Lớp trưởng lớp ${cleanClassCode}${reason ? ` - Lý do: ${reason}` : ''}`;

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: action === 'TRANSFER' ? 'TRANSFER_CLASS_MONITOR' : 'ASSIGN_CLASS_MONITOR',
        targetType: 'CLASS',
        targetId: cleanClassCode,
        description: descText,
        metadata: {
          classCode: cleanClassCode,
          newMonitor: cleanNewMaSV,
          newMonitorName: newStudent.hoTen,
          oldMonitors: oldMonitorNames || null,
          fromMaSV: fromMaSV || null,
          reason: reason || null,
        },
      });

      // Refetch all users & monitors
      const usersRaw = await prisma.user.findMany({
        include: { student: true },
        orderBy: [{ student: { maLop: 'asc' } }, { username: 'asc' }],
      });

      const users = usersRaw.map((u) => ({
        id: u.id,
        username: u.username,
        role: u.role,
        isAdmin: checkIsAdmin(u.role),
        isMonitor: checkIsMonitor(u.role),
        fullName: u.student?.hoTen || u.student?.ten || u.username,
        phoneNumber: u.student?.soDienThoai || null,
        lop: u.student?.maLop || null,
      }));

      return NextResponse.json({
        success: true,
        message: `Đã chỉ định thành công ${newStudent.hoTen || cleanNewMaSV} (${cleanNewMaSV}) làm Lớp trưởng lớp ${cleanClassCode}!`,
        newMonitor: {
          username: cleanNewMaSV,
          fullName: newStudent.hoTen || cleanNewMaSV,
          lop: cleanClassCode,
          phoneNumber: newStudent.soDienThoai || null,
        },
        users,
        monitors: users.filter((u) => u.isMonitor),
      });
    } else if (action === 'REMOVE') {
      // Find all current monitors of this class or specific fromMaSV
      const currentClassUsers = await prisma.user.findMany({
        where: fromMaSV
          ? { username: fromMaSV.trim().toUpperCase() }
          : {
              student: { maLop: cleanClassCode },
              role: { contains: 'lop_truong', mode: 'insensitive' },
            },
        include: { student: true },
      });

      for (const oldUser of currentClassUsers) {
        let updatedRole = 'sinh_vien';
        if (oldUser.role.includes('admin')) {
          updatedRole = 'admin';
        }
        await prisma.user.update({
          where: { id: oldUser.id },
          data: { role: updatedRole },
        });
      }

      const removedNames = currentClassUsers
        .map((u) => `${u.student?.hoTen || u.username} (${u.username})`)
        .join(', ');

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'REMOVE_CLASS_MONITOR',
        targetType: 'CLASS',
        targetId: cleanClassCode,
        description: `Admin ${authUser.username} đã hủy vai trò Lớp trưởng lớp ${cleanClassCode} của [${removedNames || 'Lớp trưởng hiện tại'}]${reason ? ` - Lý do: ${reason}` : ''}`,
        metadata: {
          classCode: cleanClassCode,
          removedMonitors: removedNames,
          reason: reason || null,
        },
      });

      // Refetch all users & monitors
      const usersRaw = await prisma.user.findMany({
        include: { student: true },
        orderBy: [{ student: { maLop: 'asc' } }, { username: 'asc' }],
      });

      const users = usersRaw.map((u) => ({
        id: u.id,
        username: u.username,
        role: u.role,
        isAdmin: checkIsAdmin(u.role),
        isMonitor: checkIsMonitor(u.role),
        fullName: u.student?.hoTen || u.student?.ten || u.username,
        phoneNumber: u.student?.soDienThoai || null,
        lop: u.student?.maLop || null,
      }));

      return NextResponse.json({
        success: true,
        message: `Đã hủy vai trò Lớp trưởng lớp ${cleanClassCode} thành công!`,
        users,
        monitors: users.filter((u) => u.isMonitor),
      });
    } else {
      return NextResponse.json({ error: 'Hành động không hợp lệ (ASSIGN, TRANSFER, REMOVE)' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Monitors POST error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi xử lý chỉ định lớp trưởng' }, { status: 500 });
  }
}
