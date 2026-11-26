import { NextResponse } from 'next/server';
import { loginAndGetToken } from '@/src/features/external-portal/server/qldttxServerService';
import { loginLMS } from '@/src/features/external-portal/server/lmsServerService';
import {
  refreshSlinkToken,
  getSlinkUserInfo,
  decodeSlinkJwtPayload,
} from '@/src/features/external-portal/server/slinkServerService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { ExternalAccountActionBody, ExternalAccountActionContext } from './types';

// Tests credentials provided directly in request body.
// Returns NextResponse if direct credentials were provided and tested, or null to fall back to DB account.
export async function handleTestDirectCredentials(
  ctx: ExternalAccountActionContext,
  body: ExternalAccountActionBody
): Promise<NextResponse | null> {
  const { req, authUser, effectiveUsername, systemKey, finalSystemName } = ctx;
  const { extUsername, extPassword, refreshToken } = body;

  const cleanInputUser = extUsername ? String(extUsername).trim() : '';
  const cleanInputPass = extPassword ? String(extPassword).trim() : '';
  const cleanInputRefresh = refreshToken ? String(refreshToken).trim() : '';

  // Special case: SLINK_PTIT test directly using OAuth refresh_token
  if (systemKey === 'SLINK_PTIT' && cleanInputRefresh) {
    try {
      const slinkRes = await refreshSlinkToken(cleanInputRefresh);
      const rotatedRefreshToken = slinkRes.refresh_token || cleanInputRefresh;
      const bearerToken = `Bearer ${slinkRes.access_token}`;
      const userInfo = await getSlinkUserInfo(slinkRes.access_token).catch(() => null);
      const jwtPayload = decodeSlinkJwtPayload(slinkRes.access_token);
      const detectedUsername =
        userInfo?.email ||
        userInfo?.preferred_username ||
        jwtPayload?.email ||
        jwtPayload?.preferred_username ||
        cleanInputUser ||
        effectiveUsername;

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'TEST_EXTERNAL_ACCOUNT_CREDENTIALS',
        targetType: 'EXTERNAL_ACCOUNT',
        targetId: effectiveUsername,
        description: `Kiểm tra OAuth Refresh Token PTIT S-Link (${detectedUsername}) thành công`,
        metadata: { effectiveUsername, targetSystemUser: detectedUsername },
      });

      return NextResponse.json({
        success: true,
        message: `Kiểm tra Refresh Token PTIT S-Link thành công! Tài khoản: ${userInfo?.name || detectedUsername}.`,
        token: bearerToken,
        refreshToken: rotatedRefreshToken,
        detectedUsername,
        userInfo: userInfo
          ? { name: userInfo.name, email: userInfo.email, preferred_username: userInfo.preferred_username }
          : null,
      });
    } catch (testErr: any) {
      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'TEST_EXTERNAL_ACCOUNT_FAILED',
        targetType: 'EXTERNAL_ACCOUNT',
        targetId: effectiveUsername,
        description: `Kiểm tra Refresh Token PTIT S-Link thất bại: ${testErr.message}`,
        metadata: { effectiveUsername, error: testErr.message },
      });

      return NextResponse.json(
        {
          error: `Kiểm tra Refresh Token PTIT S-Link thất bại: ${testErr.message}`,
        },
        { status: 400 }
      );
    }
  }

  // If credentials provided directly in request body, test them directly
  if (cleanInputUser && cleanInputPass) {
    if (systemKey === 'QLDTTX_PTTC1') {
      try {
        const fetchedToken = await loginAndGetToken({
          username: cleanInputUser,
          password: cleanInputPass,
        });

        await logActivity({
          req,
          userId: authUser.id,
          username: authUser.username,
          userRole: authUser.role,
          action: 'TEST_EXTERNAL_ACCOUNT_CREDENTIALS',
          targetType: 'EXTERNAL_ACCOUNT',
          targetId: effectiveUsername,
          description: `Kiểm tra kết nối tài khoản ${finalSystemName} (${cleanInputUser}) thành công`,
          metadata: { effectiveUsername, targetSystemUser: cleanInputUser },
        });

        return NextResponse.json({
          success: true,
          message: `Kiểm tra kết nối tới ${finalSystemName} thành công! Thông tin tài khoản chính xác.`,
          token: fetchedToken,
        });
      } catch (testErr: any) {
        await logActivity({
          req,
          userId: authUser.id,
          username: authUser.username,
          userRole: authUser.role,
          action: 'TEST_EXTERNAL_ACCOUNT_FAILED',
          targetType: 'EXTERNAL_ACCOUNT',
          targetId: effectiveUsername,
          description: `Kiểm tra kết nối ${finalSystemName} (${cleanInputUser}) thất bại: ${testErr.message}`,
          metadata: { effectiveUsername, targetSystemUser: cleanInputUser, error: testErr.message },
        });

        return NextResponse.json(
          {
            error: `Kiểm tra kết nối thất bại: ${testErr.message}`,
          },
          { status: 400 }
        );
      }
    } else if (systemKey === 'LMS_PTTC1') {
      try {
        const lmsRes = await loginLMS({
          username: cleanInputUser,
          password: cleanInputPass,
        });

        await logActivity({
          req,
          userId: authUser.id,
          username: authUser.username,
          userRole: authUser.role,
          action: 'TEST_EXTERNAL_ACCOUNT_CREDENTIALS',
          targetType: 'EXTERNAL_ACCOUNT',
          targetId: effectiveUsername,
          description: `Kiểm tra kết nối tài khoản LMS (${cleanInputUser}) thành công`,
          metadata: { effectiveUsername, targetSystemUser: cleanInputUser },
        });

        return NextResponse.json({
          success: true,
          message: `Kiểm tra kết nối tới Hệ thống học tập trực tuyến (LMS) thành công! Đăng nhập chính xác.`,
          token: lmsRes.token,
          sesskey: lmsRes.sesskey,
        });
      } catch (testErr: any) {
        await logActivity({
          req,
          userId: authUser.id,
          username: authUser.username,
          userRole: authUser.role,
          action: 'TEST_EXTERNAL_ACCOUNT_FAILED',
          targetType: 'EXTERNAL_ACCOUNT',
          targetId: effectiveUsername,
          description: `Kiểm tra kết nối LMS (${cleanInputUser}) thất bại: ${testErr.message}`,
          metadata: { effectiveUsername, targetSystemUser: cleanInputUser, error: testErr.message },
        });

        return NextResponse.json(
          {
            error: `Kiểm tra kết nối LMS thất bại: ${testErr.message}`,
          },
          { status: 400 }
        );
      }
    } else if (systemKey === 'SLINK_PTIT') {
      return NextResponse.json(
        {
          error:
            'PTIT S-Link không còn hỗ trợ đăng nhập bằng tài khoản/mật khẩu. Vui lòng sử dụng Refresh Token (OAuth) để kết nối.',
        },
        { status: 400 }
      );
    } else {
      // For other external systems
      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'TEST_EXTERNAL_ACCOUNT_CREDENTIALS',
        targetType: 'EXTERNAL_ACCOUNT',
        targetId: effectiveUsername,
        description: `Kiểm tra định dạng tài khoản ${finalSystemName} (${cleanInputUser}) thành công`,
        metadata: { effectiveUsername, targetSystemUser: cleanInputUser },
      });

      return NextResponse.json({
        success: true,
        message: `Thông tin tài khoản ${finalSystemName} hợp lệ! Đã sẵn sàng lưu cấu hình.`,
      });
    }
  }

  return null;
}
