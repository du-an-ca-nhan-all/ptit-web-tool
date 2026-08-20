import { prisma } from '@/src/lib/prisma';
import { checkIsAdmin, checkIsMonitor } from '@/src/lib/auth';

export const monitorsServerService = {
  /**
   * Lấy danh sách các lớp và thông tin lớp trưởng
   */
  async getClassesWithDetails() {
    const classRecords = await prisma.student.findMany({
      where: { maLop: { not: null } },
      distinct: ['maLop'],
      select: { maLop: true },
    });

    const classNames = new Set(classRecords.map((r) => r.maLop!).filter(Boolean));

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { role: { contains: 'lop_truong', mode: 'insensitive' } },
          { role: { contains: 'admin', mode: 'insensitive' } },
        ],
      },
      include: { student: true },
    });

    const monitorMap = new Map<string, any>();
    users.forEach((u) => {
      if (checkIsMonitor(u.role) && u.student?.maLop) {
        monitorMap.set(u.student.maLop, u);
      }
    });

    const sortedClasses = Array.from(classNames).sort();

    const classesWithInfo = sortedClasses.map((cls) => {
      const monitor = monitorMap.get(cls) || null;

      return {
        classCode: cls,
        monitorName: monitor?.student?.hoTen || monitor?.student?.ten || monitor?.username || null,
        monitorPhone: monitor?.student?.soDienThoai || null,
      };
    });

    return { classes: sortedClasses, details: classesWithInfo };
  },

  /**
   * Lấy danh sách users và monitors
   */
  async getMonitorsAndUsers(includeAll: boolean = false) {
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

    return { users, monitors };
  },

  /**
   * Chỉ định hoặc chuyển giao lớp trưởng
   */
  async assignOrTransferMonitor(params: {
    classCode: string;
    newMonitorMaSV: string;
    fromMaSV?: string;
    reason?: string;
  }) {
    const { classCode, newMonitorMaSV, fromMaSV } = params;
    const cleanClassCode = classCode.trim();
    const cleanNewMaSV = newMonitorMaSV.trim().toUpperCase();

    // 1. Tìm thông tin sinh viên mới
    let newStudent = await prisma.student.findUnique({
      where: { maSV: cleanNewMaSV },
    });

    if (!newStudent) {
      const existingUser = await prisma.user.findUnique({
        where: { username: cleanNewMaSV },
        include: { student: true },
      });
      if (existingUser?.student) {
        newStudent = existingUser.student;
      } else {
        throw new Error(`Không tìm thấy thông tin sinh viên ${cleanNewMaSV}`);
      }
    }

    // 2. Cập nhật mã lớp cho sinh viên nếu khác
    if (newStudent.maLop !== cleanClassCode) {
      await prisma.student.update({
        where: { maSV: cleanNewMaSV },
        data: { maLop: cleanClassCode },
      });
    }

    // 3. Giáng chức các monitor hiện tại của lớp
    const currentClassUsers = await prisma.user.findMany({
      where: {
        student: { maLop: cleanClassCode },
        role: { contains: 'lop_truong', mode: 'insensitive' },
      },
      include: { student: true },
    });

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

    // 4. Nếu có fromMaSV rõ ràng
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

    // 5. Thăng chức monitor mới
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

    return {
      success: true,
      message: `Đã chỉ định ${newStudent.hoTen || cleanNewMaSV} (${cleanNewMaSV}) làm lớp trưởng lớp ${cleanClassCode}`,
    };
  },

  /**
   * Thu hồi quyền lớp trưởng
   */
  async removeMonitor(params: { classCode: string; monitorMaSV: string; reason?: string }) {
    const { classCode, monitorMaSV } = params;
    const cleanClassCode = classCode.trim();
    const cleanMaSV = monitorMaSV.trim().toUpperCase();

    const targetUser = await prisma.user.findUnique({
      where: { username: cleanMaSV },
    });

    if (!targetUser) {
      throw new Error(`Không tìm thấy tài khoản của sinh viên ${cleanMaSV}`);
    }

    let updatedRole = 'sinh_vien';
    if (targetUser.role.includes('admin')) {
      updatedRole = 'admin';
    }

    await prisma.user.update({
      where: { id: targetUser.id },
      data: { role: updatedRole },
    });

    return {
      success: true,
      message: `Đã thu hồi quyền lớp trưởng của sinh viên ${cleanMaSV} khỏi lớp ${cleanClassCode}`,
    };
  },
};
