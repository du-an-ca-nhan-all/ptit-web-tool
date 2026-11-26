import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { AuthUser, getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import { fetchOpenCourseGroupsFromQLDTTX } from '@/src/features/external-portal/server/courseRegistrationServerService';

export type QldttxAccountCreds = Parameters<typeof fetchOpenCourseGroupsFromQLDTTX>[0];

export async function getAuthUser(req: NextRequest) {
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

export async function findQldttxExternalAccount(username: string) {
  return prisma.externalAccount.findFirst({
    where: {
      username,
      systemKey: 'QLDTTX_PTTC1',
    },
  });
}

export type QldttxExternalAccount = NonNullable<Awaited<ReturnType<typeof findQldttxExternalAccount>>>;

export async function getMonitorFlowConfigForStudent(targetUsername: string) {
  const followerFlowConfig = await prisma.monitorFlowConfig.findFirst({
    where: { followerUsername: targetUsername },
    orderBy: [{ isEnabled: 'desc' }, { updatedAt: 'desc' }],
  });

  if (!followerFlowConfig) {
    return null;
  }

  const monitorStudent = await prisma.student.findUnique({
    where: { maSV: followerFlowConfig.monitorUsername },
    select: { maSV: true, hoTen: true, ten: true, maLop: true, soDienThoai: true },
  });

  return {
    isConfigured: true,
    isEnabled: followerFlowConfig.isEnabled,
    classCode: followerFlowConfig.classCode,
    monitorUsername: followerFlowConfig.monitorUsername,
    monitorFullName: monitorStudent?.hoTen || monitorStudent?.ten || followerFlowConfig.monitorUsername,
    monitorPhone: monitorStudent?.soDienThoai || null,
    allowRegisterCourse: followerFlowConfig.allowRegisterCourse,
    allowCancelCourse: followerFlowConfig.allowCancelCourse,
    autoSyncOnAction: followerFlowConfig.autoSyncOnAction,
    note: followerFlowConfig.note,
    lastActionAt: followerFlowConfig.lastActionAt?.toISOString() || null,
    lastActionType: followerFlowConfig.lastActionType,
    lastActionResult: followerFlowConfig.lastActionResult,
    lastActionMessage: followerFlowConfig.lastActionMessage,
  };
}

export async function checkFlowLockForAction(
  effectiveUsername: string,
  authUser: AuthUser
): Promise<NextResponse | null> {
  const followerFlowConfig = await prisma.monitorFlowConfig.findFirst({
    where: { followerUsername: effectiveUsername },
    orderBy: [{ isEnabled: 'desc' }, { updatedAt: 'desc' }],
  });

  if (followerFlowConfig && followerFlowConfig.isEnabled) {
    // Cho phép nếu người thực hiện là Admin hoặc chính Lớp trưởng đang phát lệnh cho sinh viên
    const isMonitorOrAdmin =
      authUser.isAdmin ||
      (authUser.isMonitor &&
        followerFlowConfig.monitorUsername.toUpperCase() === authUser.username.toUpperCase());

    if (!isMonitorOrAdmin) {
      return NextResponse.json(
        {
          error: `Tài khoản của bạn đang được cấu hình Flow tự động theo Lớp trưởng (${followerFlowConfig.monitorUsername} - Lớp ${followerFlowConfig.classCode}). Tính năng tự đăng ký/hủy môn thủ công bị tạm khóa để đảm bảo học chung lịch với lớp. Vui lòng liên hệ Lớp trưởng nếu bạn muốn tự thao tác.`,
          isFlowLocked: true,
          monitorFlowConfig: {
            monitorUsername: followerFlowConfig.monitorUsername,
            classCode: followerFlowConfig.classCode,
          },
        },
        { status: 403 }
      );
    }
  }

  return null;
}
