import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { syncStudentProfileFromQLDTTX } from '@/src/features/external-portal/server/studentProfileSyncService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { ExternalAccountActionBody, ExternalAccountActionContext } from './types';
import { verifySaveCredentials } from './verifySaveCredentials';

// 2. ACTION: SAVE / CONNECT (Enforce successful login/refresh test before saving!)
export async function handleSaveAccountAction(
  ctx: ExternalAccountActionContext,
  body: ExternalAccountActionBody
) {
  const { req, authUser, effectiveUsername, systemKey, finalSystemName, finalSystemUrl } = ctx;
  const { extUsername, extPassword, refreshToken, accessToken } = body;

  const isSlink = systemKey === 'SLINK_PTIT';
  const cleanInputRefresh = refreshToken ? String(refreshToken).trim() : '';
  const cleanInputAccess = accessToken ? String(accessToken).trim() : '';

  if (!isSlink && (!extUsername || !extUsername.trim())) {
    return NextResponse.json(
      { error: 'Vui lòng nhập tên đăng nhập / mã sinh viên hệ thống ngoài' },
      { status: 400 }
    );
  }
  if (!isSlink && (!extPassword || !extPassword.trim())) {
    return NextResponse.json(
      { error: 'Vui lòng nhập mật khẩu tài khoản hệ thống ngoài' },
      { status: 400 }
    );
  }
  if (isSlink && !cleanInputRefresh) {
    return NextResponse.json(
      { error: 'PTIT S-Link sử dụng đăng nhập OAuth. Vui lòng nhập Refresh Token hợp lệ.' },
      { status: 400 }
    );
  }

  const initialCleanUsername = extUsername ? String(extUsername).trim() : effectiveUsername;
  const cleanPassword = isSlink ? '' : String(extPassword || '').trim();

  // Ensure user exists before creating external account
  const existingUser = await prisma.user.findUnique({
    where: { username: effectiveUsername },
  });

  if (!existingUser) {
    return NextResponse.json(
      { error: `Không tìm thấy tài khoản sinh viên ${effectiveUsername} trong hệ thống` },
      { status: 404 }
    );
  }

  // Test logging in / refreshing token on external system to verify credentials and extract access token
  const verification = await verifySaveCredentials({
    ctx,
    extUsername,
    cleanUsername: initialCleanUsername,
    cleanPassword,
    cleanInputRefresh,
    cleanInputAccess,
  });

  if (verification.ok === false) {
    return verification.response;
  }

  const {
    cleanUsername,
    fetchedToken,
    fetchedRefreshToken,
    tokenExpiresAt,
    refreshTokenExpiresAt,
    lastTokenRefreshedAt,
    syncMessage,
  } = verification.data;
  const status = 'CONNECTED';

  const account = await prisma.externalAccount.upsert({
    where: {
      username_systemKey: {
        username: effectiveUsername,
        systemKey: systemKey,
      },
    },
    create: {
      username: effectiveUsername,
      systemKey: systemKey,
      systemName: finalSystemName,
      systemUrl: finalSystemUrl,
      extUsername: cleanUsername,
      extPassword: cleanPassword,
      token: fetchedToken,
      refreshToken: fetchedRefreshToken,
      tokenExpiresAt,
      refreshTokenExpiresAt,
      lastTokenRefreshedAt,
      status,
      lastSyncAt: new Date(),
      syncMessage,
    },
    update: {
      systemName: finalSystemName,
      systemUrl: finalSystemUrl,
      extUsername: cleanUsername,
      extPassword: cleanPassword,
      token: fetchedToken,
      ...(isSlink
        ? {
            refreshToken: fetchedRefreshToken,
            tokenExpiresAt,
            refreshTokenExpiresAt,
            lastTokenRefreshedAt,
          }
        : {}),
      status,
      lastSyncAt: new Date(),
      syncMessage,
    },
  });

  let profileSynced = false;
  if (systemKey === 'QLDTTX_PTTC1' && fetchedToken) {
    try {
      const syncRes = await syncStudentProfileFromQLDTTX({
        username: effectiveUsername,
        token: fetchedToken,
        extUsername: cleanUsername,
        extPassword: cleanPassword,
      });
      profileSynced = syncRes.synced;
    } catch (syncErr: any) {
      console.warn(`[SAVE_EXTERNAL_ACCOUNT] Auto sync QLHT profile failed for ${effectiveUsername}:`, syncErr?.message || syncErr);
    }
  }

  await logActivity({
    req,
    userId: authUser.id,
    username: authUser.username,
    userRole: authUser.role,
    action: 'SAVE_EXTERNAL_ACCOUNT',
    targetType: 'EXTERNAL_ACCOUNT',
    targetId: effectiveUsername,
    description: `Lưu cấu hình liên kết ${finalSystemName} cho ${effectiveUsername} thành công${fetchedToken ? ' (Đã cấp Token/Session)' : ''}${profileSynced ? ' & đã đồng bộ thông tin cá nhân' : ''}`,
    metadata: { effectiveUsername, systemKey, status, hasToken: !!fetchedToken, profileSynced },
  });

  return NextResponse.json({
    success: true,
    message: `Đã kết nối và lưu cấu hình tài khoản ${finalSystemName} (${effectiveUsername}) thành công!${profileSynced ? ' Đã tự động đồng bộ thông tin cá nhân từ QLHT.' : ''}`,
    hasToken: !!account.token,
    profileSynced,
    account: {
      systemKey: account.systemKey,
      systemName: account.systemName,
      systemUrl: account.systemUrl,
      extUsername: account.extUsername,
      token: account.token,
      status: account.status,
      lastSyncAt: account.lastSyncAt?.toISOString() || null,
      syncMessage: account.syncMessage,
    },
  });
}
