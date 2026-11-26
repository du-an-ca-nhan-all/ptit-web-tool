import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { ExternalAccountActionContext } from './types';

export async function handleDeleteAccountAction(ctx: ExternalAccountActionContext) {
  const { req, authUser, effectiveUsername, systemKey, finalSystemName } = ctx;

  await prisma.externalAccount.deleteMany({
    where: {
      username: effectiveUsername,
      systemKey: systemKey,
    },
  });

  await logActivity({
    req,
    userId: authUser.id,
    username: authUser.username,
    userRole: authUser.role,
    action: 'DELETE_EXTERNAL_ACCOUNT',
    targetType: 'EXTERNAL_ACCOUNT',
    targetId: effectiveUsername,
    description: `Hủy liên kết tài khoản hệ thống "${finalSystemName}" cho sinh viên ${effectiveUsername}`,
    metadata: { effectiveUsername, systemKey, finalSystemName },
  });

  return NextResponse.json({
    success: true,
    message: `Đã hủy liên kết tài khoản hệ thống "${finalSystemName}" cho sinh viên ${effectiveUsername}`,
  });
}
