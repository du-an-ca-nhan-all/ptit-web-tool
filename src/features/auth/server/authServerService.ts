import { prisma } from '@/src/lib/prisma';
import {
  verifyPassword,
  createAuthToken,
  checkIsAdmin,
  checkIsMonitor,
  getUserRoles,
  hashPassword,
  hashSHA512,
} from '@/src/lib/auth';
import { logActivity } from '@/src/lib/activityLog';
import { NextRequest } from 'next/server';

export interface LoginResult {
  success: boolean;
  user?: any;
  token?: string;
  error?: string;
  status?: number;
}

export const authServerService = {
  /**
   * Xác thực thông tin đăng nhập
   */
  async login(usernameInput: string, passwordInput: string, req?: NextRequest): Promise<LoginResult> {
    if (!usernameInput || !passwordInput) {
      return { success: false, error: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu', status: 400 };
    }

    const normalizedUsername = String(usernameInput).trim().toUpperCase();

    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      include: { student: true },
    });

    if (!user) {
      return { success: false, error: 'Tài khoản hoặc mật khẩu không chính xác', status: 401 };
    }

    if (!user.passwordHash || user.passwordHash.trim() === '') {
      return {
        success: false,
        error:
          'Tài khoản chưa được kích hoạt mật khẩu. Vui lòng bấm "Đăng Ký Tài Khoản" để tạo mật khẩu và gửi yêu cầu kích hoạt.',
        status: 401,
      };
    }

    const isValid = await verifyPassword(passwordInput, user.passwordHash, user.username);
    if (!isValid) {
      if (req) {
        await logActivity({
          req,
          userId: user.id,
          username: user.username,
          userRole: user.role,
          action: 'LOGIN_FAILED',
          targetType: 'AUTH',
          targetId: user.username,
          description: `Đăng nhập thất bại cho tài khoản ${user.username}: Sai mật khẩu`,
        });
      }
      return { success: false, error: 'Tài khoản hoặc mật khẩu không chính xác', status: 401 };
    }

    if (!user.isActive) {
      return {
        success: false,
        error: 'Tài khoản của bạn đang bị tạm khoá. Vui lòng liên hệ Quản trị viên.',
        status: 403,
      };
    }

    // Cập nhật lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const isAdmin = checkIsAdmin(user.role);
    const isMonitor = checkIsMonitor(user.role);
    const roles = getUserRoles(user.role);

    const authPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      roles,
      activeRole: isAdmin ? 'admin' : isMonitor ? 'lop_truong' : 'sinh_vien',
      isAdmin,
      isMonitor,
      fullName: user.student?.hoTen || user.student?.ten || user.username,
      phoneNumber: user.student?.soDienThoai || null,
      lop: user.student?.maLop || null,
    };

    const token = await createAuthToken(authPayload);

    if (req) {
      await logActivity({
        req,
        userId: user.id,
        username: user.username,
        userRole: user.role,
        action: 'LOGIN_SUCCESS',
        targetType: 'AUTH',
        targetId: user.username,
        description: `Đăng nhập thành công với vai trò [${roles.join(', ')}]`,
      });
    }

    return {
      success: true,
      user: {
        ...authPayload,
        student: user.student,
      },
      token,
    };
  },

  /**
   * Lấy danh sách yêu cầu đăng ký cho Admin
   */
  async getRegistrationRequests(params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, search, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { lop: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { note: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [requests, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.registrationRequest.findMany({
        where,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.registrationRequest.count({ where }),
      prisma.registrationRequest.count({ where: { status: 'PENDING' } }),
      prisma.registrationRequest.count({ where: { status: 'APPROVED' } }),
      prisma.registrationRequest.count({ where: { status: 'REJECTED' } }),
    ]);

    return {
      requests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        totalAll: pendingCount + approvedCount + rejectedCount,
      },
    };
  },

  /**
   * Duyệt hoặc từ chối yêu cầu đăng ký
   */
  async reviewRegistrationRequest(params: {
    requestId: number;
    action: 'APPROVE' | 'REJECT';
    role?: string;
    adminUsername: string;
  }) {
    const { requestId, action, role = 'sinh_vien', adminUsername } = params;

    const request = await prisma.registrationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Không tìm thấy yêu cầu đăng ký');
    }

    if (action === 'APPROVE') {
      // 1. Tạo hoặc cập nhật User
      await prisma.user.upsert({
        where: { username: request.username },
        create: {
          username: request.username,
          passwordHash: request.passwordHash,
          role: role || 'sinh_vien',
          isActive: true,
        },
        update: {
          passwordHash: request.passwordHash,
          role: role || undefined,
          isActive: true,
        },
      });

      // 2. Cập nhật hoặc tạo Student nếu có thông tin
      if (request.fullName || request.lop || request.phoneNumber) {
        await prisma.student.upsert({
          where: { maSV: request.username },
          create: {
            maSV: request.username,
            hoTen: request.fullName || null,
            maLop: request.lop || null,
            soDienThoai: request.phoneNumber || null,
          },
          update: {
            hoTen: request.fullName || undefined,
            maLop: request.lop || undefined,
            soDienThoai: request.phoneNumber || undefined,
          },
        });
      }

      // 3. Cập nhật trạng thái yêu cầu
      await prisma.registrationRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewedBy: adminUsername,
          reviewedAt: new Date(),
        },
      });

      return { success: true, message: `Đã duyệt tài khoản ${request.username} thành công` };
    } else {
      await prisma.registrationRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          reviewedBy: adminUsername,
          reviewedAt: new Date(),
        },
      });

      return { success: true, message: `Đã từ chối yêu cầu đăng ký của ${request.username}` };
    }
  },
};
