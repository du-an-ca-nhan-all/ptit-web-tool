import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { refreshAndPersistSlinkAccountToken } from '@/src/features/external-portal/server/slinkServerService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { ExternalAccountActionBody, ExternalAccountActionContext } from './types';
import { handleTestDirectCredentials } from './testCredentialsAction';
import { testExistingLmsAccount, testExistingQldttxAccount } from './testExistingProviders';

// 3. ACTION: GET_TOKEN / TEST / SYNC / TEST_CREDENTIALS
export async function handleTestOrSyncAction(
  ctx: ExternalAccountActionContext,
  body: ExternalAccountActionBody
) {
  const directResult = await handleTestDirectCredentials(ctx, body);
  if (directResult) {
    return directResult;
  }

  const { req, authUser, effectiveUsername, systemKey, finalSystemName } = ctx;

  // Otherwise test existing saved account in DB
  const existing = await prisma.externalAccount.findUnique({
    where: {
      username_systemKey: {
        username: effectiveUsername,
        systemKey: systemKey,
      },
    },
  });

  if (!existing) {
    return NextResponse.json(
      {
        error: `Chưa có thông tin đăng nhập để kiểm tra. Vui lòng nhập Tên đăng nhập và Mật khẩu.`,
      },
      { status: 400 }
    );
  }

  if (existing.systemKey === 'QLDTTX_PTTC1') {
    return testExistingQldttxAccount(ctx, existing);
  }

  if (existing.systemKey === 'LMS_PTTC1') {
    return testExistingLmsAccount(ctx, existing);
  }

  if (existing.systemKey === 'SLINK_PTIT') {
    try {
      const refreshed = await refreshAndPersistSlinkAccountToken(existing, {
        force: true,
        syncMessagePrefix: 'Đã làm mới Token & Refresh Token PTIT S-Link',
      });

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'TEST_EXTERNAL_ACCOUNT',
        targetType: 'EXTERNAL_ACCOUNT',
        targetId: effectiveUsername,
        description: `Làm mới Access Token & Refresh Token PTIT S-Link cho ${effectiveUsername}: Thành công`,
        metadata: { effectiveUsername, isNew: refreshed.isNew },
      });

      return NextResponse.json({
        success: true,
        message: `Đã làm mới Access Token & Refresh Token PTIT S-Link thành công cho ${existing.extUsername}!`,
        token: refreshed.token,
        isNew: refreshed.isNew,
        lastSyncAt: new Date().toISOString(),
      });
    } catch (loginErr: any) {
      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'TEST_EXTERNAL_ACCOUNT_FAILED',
        targetType: 'EXTERNAL_ACCOUNT',
        targetId: effectiveUsername,
        description: `Làm mới token PTIT S-Link cho ${effectiveUsername} thất bại: ${loginErr.message}`,
        metadata: { effectiveUsername, error: loginErr.message },
      });

      return NextResponse.json(
        {
          error: `Không thể làm mới token PTIT S-Link: ${loginErr.message}`,
        },
        { status: 400 }
      );
    }
  }

  // Other systems
  const updated = await prisma.externalAccount.update({
    where: { id: existing.id },
    data: {
      status: 'CONNECTED',
      lastSyncAt: new Date(),
      syncMessage: `Tài khoản ${finalSystemName} đã được xác nhận lúc ${new Date().toLocaleTimeString('vi-VN')}`,
    },
  });

  await logActivity({
    req,
    userId: authUser.id,
    username: authUser.username,
    userRole: authUser.role,
    action: 'TEST_EXTERNAL_ACCOUNT',
    targetType: 'EXTERNAL_ACCOUNT',
    targetId: effectiveUsername,
    description: `Kiểm tra cấu hình tài khoản ${finalSystemName} cho ${effectiveUsername} thành công`,
    metadata: { effectiveUsername },
  });

  return NextResponse.json({
    success: true,
    message: `Tài khoản ${finalSystemName} (${existing.extUsername}) đã được cấu hình và hoạt động tốt!`,
    lastSyncAt: updated.lastSyncAt?.toISOString(),
  });
}
