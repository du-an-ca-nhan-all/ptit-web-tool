import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getValidTokenOrRefresh } from '@/src/features/external-portal/server/qldttxServerService';
import { syncStudentProfileFromQLDTTX } from '@/src/features/external-portal/server/studentProfileSyncService';
import { getValidLmsTokenOrRefresh } from '@/src/features/external-portal/server/lmsServerService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { ExternalAccountActionContext } from './types';

export type ExistingExternalAccount = NonNullable<
  Awaited<ReturnType<typeof prisma.externalAccount.findUnique>>
>;

export async function testExistingQldttxAccount(
  ctx: ExternalAccountActionContext,
  existing: ExistingExternalAccount
) {
  const { req, authUser, effectiveUsername, finalSystemName } = ctx;

  try {
    const { token: validToken, isNew } = await getValidTokenOrRefresh({
      username: existing.extUsername,
      password: existing.extPassword,
      existingToken: existing.token,
    });

    const updated = await prisma.externalAccount.update({
      where: { id: existing.id },
      data: {
        token: validToken,
        status: 'CONNECTED',
        lastSyncAt: new Date(),
        syncMessage: isNew
          ? `Đã đăng nhập và cấp Token mới lúc ${new Date().toLocaleTimeString('vi-VN')}`
          : `Token hiện tại còn sống và hợp lệ lúc ${new Date().toLocaleTimeString('vi-VN')}`,
      },
    });

    let profileSynced = false;
    try {
      const syncRes = await syncStudentProfileFromQLDTTX({
        username: effectiveUsername,
        token: validToken,
        extUsername: existing.extUsername,
        extPassword: existing.extPassword,
      });
      profileSynced = syncRes.synced;
    } catch (syncErr: any) {
      console.warn(`[TEST_EXTERNAL_ACCOUNT] Auto sync QLHT profile failed for ${effectiveUsername}:`, syncErr?.message || syncErr);
    }

    await logActivity({
      req,
      userId: authUser.id,
      username: authUser.username,
      userRole: authUser.role,
      action: 'TEST_EXTERNAL_ACCOUNT',
      targetType: 'EXTERNAL_ACCOUNT',
      targetId: effectiveUsername,
      description: `Kiểm tra/làm mới kết nối ${finalSystemName} cho ${effectiveUsername}: Thành công (${isNew ? 'Cấp token mới' : 'Token hợp lệ'}${profileSynced ? ', đã đồng bộ hồ sơ' : ''})`,
      metadata: { effectiveUsername, isNew, profileSynced },
    });

    return NextResponse.json({
      success: true,
      message: isNew
        ? `Đã lấy Token mới thành công cho ${existing.extUsername}!${profileSynced ? ' Đã đồng bộ thông tin cá nhân.' : ''}`
        : `Token hiện tại còn sống và hợp lệ!${profileSynced ? ' Đã đồng bộ thông tin cá nhân.' : ''}`,
      token: updated.token,
      isNew,
      profileSynced,
      lastSyncAt: updated.lastSyncAt?.toISOString(),
    });
  } catch (loginErr: any) {
    await prisma.externalAccount.update({
      where: { id: existing.id },
      data: {
        status: 'ERROR',
        syncMessage: `Lỗi lấy Token: ${loginErr.message}`,
      },
    });

    await logActivity({
      req,
      userId: authUser.id,
      username: authUser.username,
      userRole: authUser.role,
      action: 'TEST_EXTERNAL_ACCOUNT_FAILED',
      targetType: 'EXTERNAL_ACCOUNT',
      targetId: effectiveUsername,
      description: `Kiểm tra kết nối ${finalSystemName} cho ${effectiveUsername} thất bại: ${loginErr.message}`,
      metadata: { effectiveUsername, error: loginErr.message },
    });

    return NextResponse.json(
      {
        error: `Không thể lấy token: ${loginErr.message}`,
      },
      { status: 400 }
    );
  }
}

export async function testExistingLmsAccount(
  ctx: ExternalAccountActionContext,
  existing: ExistingExternalAccount
) {
  const { req, authUser, effectiveUsername } = ctx;

  try {
    const { token: validToken, isNew, sesskey } = await getValidLmsTokenOrRefresh({
      username: existing.extUsername,
      password: existing.extPassword,
      existingToken: existing.token,
    });

    const updated = await prisma.externalAccount.update({
      where: { id: existing.id },
      data: {
        token: validToken,
        status: 'CONNECTED',
        lastSyncAt: new Date(),
        syncMessage: isNew
          ? `Đã đăng nhập và cấp Session LMS mới lúc ${new Date().toLocaleTimeString('vi-VN')}`
          : `Session LMS hiện tại còn sống lúc ${new Date().toLocaleTimeString('vi-VN')}`,
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
      description: `Kiểm tra/làm mới session LMS cho ${effectiveUsername}: Thành công (${isNew ? 'Cấp session mới' : 'Session hợp lệ'})`,
      metadata: { effectiveUsername, isNew },
    });

    return NextResponse.json({
      success: true,
      message: isNew
        ? `Đã đăng nhập và lấy Session LMS mới thành công cho ${existing.extUsername}!`
        : `Session LMS hiện tại còn sống và hợp lệ!`,
      token: updated.token,
      sesskey,
      isNew,
      lastSyncAt: updated.lastSyncAt?.toISOString(),
    });
  } catch (loginErr: any) {
    await prisma.externalAccount.update({
      where: { id: existing.id },
      data: {
        status: 'ERROR',
        syncMessage: `Lỗi kết nối LMS: ${loginErr.message}`,
      },
    });

    await logActivity({
      req,
      userId: authUser.id,
      username: authUser.username,
      userRole: authUser.role,
      action: 'TEST_EXTERNAL_ACCOUNT_FAILED',
      targetType: 'EXTERNAL_ACCOUNT',
      targetId: effectiveUsername,
      description: `Kiểm tra kết nối LMS cho ${effectiveUsername} thất bại: ${loginErr.message}`,
      metadata: { effectiveUsername, error: loginErr.message },
    });

    return NextResponse.json(
      {
        error: `Không thể kết nối LMS: ${loginErr.message}`,
      },
      { status: 400 }
    );
  }
}
