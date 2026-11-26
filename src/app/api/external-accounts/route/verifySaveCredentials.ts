import { NextResponse } from 'next/server';
import { loginAndGetToken } from '@/src/features/external-portal/server/qldttxServerService';
import { loginLMS } from '@/src/features/external-portal/server/lmsServerService';
import {
  refreshSlinkToken,
  validateSlinkToken,
  getSlinkUserInfo,
  computeSlinkTokenExpiry,
  decodeSlinkJwtPayload,
} from '@/src/features/external-portal/server/slinkServerService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { ExternalAccountActionContext } from './types';

export interface VerifiedSaveCredentials {
  cleanUsername: string;
  fetchedToken: string | null;
  fetchedRefreshToken: string | null;
  tokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
  lastTokenRefreshedAt: Date | null;
  syncMessage: string;
}

export type VerifySaveCredentialsResult =
  | { ok: true; data: VerifiedSaveCredentials }
  | { ok: false; response: NextResponse };

interface VerifySaveCredentialsParams {
  ctx: ExternalAccountActionContext;
  extUsername?: string;
  cleanUsername: string;
  cleanPassword: string;
  cleanInputRefresh: string;
  cleanInputAccess: string;
}

export async function verifySaveCredentials(
  params: VerifySaveCredentialsParams
): Promise<VerifySaveCredentialsResult> {
  const { ctx, extUsername, cleanPassword, cleanInputRefresh, cleanInputAccess } = params;
  const { req, authUser, effectiveUsername, systemKey, finalSystemName } = ctx;

  let cleanUsername = params.cleanUsername;
  let fetchedToken: string | null = null;
  let fetchedRefreshToken: string | null = null;
  let tokenExpiresAt: Date | null = null;
  let refreshTokenExpiresAt: Date | null = null;
  let lastTokenRefreshedAt: Date | null = null;
  let syncMessage = `Đã lưu cấu hình tài khoản ${finalSystemName} thành công!`;

  if (systemKey === 'QLDTTX_PTTC1') {
    try {
      fetchedToken = await loginAndGetToken({
        username: cleanUsername,
        password: cleanPassword,
      });
      syncMessage = 'Đã xác thực và cấp Token kết nối QLDTTX thành công!';
    } catch (tokenErr: any) {
      console.warn(`Test login failed for ${cleanUsername} during SAVE:`, tokenErr.message);

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'SAVE_EXTERNAL_ACCOUNT_FAILED',
        targetType: 'EXTERNAL_ACCOUNT',
        targetId: effectiveUsername,
        description: `Lưu cấu hình ${finalSystemName} cho ${effectiveUsername} thất bại do kiểm tra kết nối không thành công: ${tokenErr.message}`,
        metadata: { effectiveUsername, systemKey, error: tokenErr.message },
      });

      return {
        ok: false,
        response: NextResponse.json(
          {
            error: `Kiểm tra kết nối thất bại: ${tokenErr.message}. Vui lòng kiểm tra lại Tên đăng nhập và Mật khẩu chính xác trước khi lưu cấu hình.`,
          },
          { status: 400 }
        ),
      };
    }
  } else if (systemKey === 'LMS_PTTC1') {
    try {
      const lmsRes = await loginLMS({
        username: cleanUsername,
        password: cleanPassword,
      });
      fetchedToken = lmsRes.token;
      syncMessage = 'Đã xác thực và lưu phiên kết nối LMS PTTC1 thành công!';
    } catch (tokenErr: any) {
      console.warn(`LMS login failed for ${cleanUsername} during SAVE:`, tokenErr.message);

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'SAVE_EXTERNAL_ACCOUNT_FAILED',
        targetType: 'EXTERNAL_ACCOUNT',
        targetId: effectiveUsername,
        description: `Lưu cấu hình LMS cho ${effectiveUsername} thất bại do đăng nhập không thành công: ${tokenErr.message}`,
        metadata: { effectiveUsername, systemKey, error: tokenErr.message },
      });

      return {
        ok: false,
        response: NextResponse.json(
          {
            error: `Kiểm tra kết nối LMS thất bại: ${tokenErr.message}. Vui lòng kiểm tra lại Tên đăng nhập và Mật khẩu LMS trước khi lưu.`,
          },
          { status: 400 }
        ),
      };
    }
  } else if (systemKey === 'SLINK_PTIT') {
    try {
      // Nếu client vừa test và gửi kèm accessToken hợp lệ + rotated refreshToken, tránh gọi refresh lần 2 (Single-Use Rotation)
      let rawAccessToken = '';
      const usedRefreshToken = cleanInputRefresh;

      if (cleanInputAccess && (await validateSlinkToken(cleanInputAccess))) {
        rawAccessToken = cleanInputAccess.replace(/^Bearer\s+/i, '').trim();
        fetchedToken = `Bearer ${rawAccessToken}`;
        fetchedRefreshToken = usedRefreshToken;
        const expiries = computeSlinkTokenExpiry({
          access_token: rawAccessToken,
          refresh_token: usedRefreshToken,
        });
        tokenExpiresAt = expiries.tokenExpiresAt;
        refreshTokenExpiresAt = expiries.refreshTokenExpiresAt;
        lastTokenRefreshedAt = new Date();
      } else {
        const slinkRes = await refreshSlinkToken(cleanInputRefresh);
        rawAccessToken = slinkRes.access_token;
        fetchedToken = `Bearer ${slinkRes.access_token}`;
        fetchedRefreshToken = slinkRes.refresh_token || cleanInputRefresh;
        const expiries = computeSlinkTokenExpiry({
          ...slinkRes,
          refresh_token: fetchedRefreshToken,
        });
        tokenExpiresAt = expiries.tokenExpiresAt;
        refreshTokenExpiresAt = expiries.refreshTokenExpiresAt;
        lastTokenRefreshedAt = new Date();
      }

      // Tự động điền email/username từ S-Link userinfo hoặc JWT nếu chưa nhập
      if (!extUsername || !extUsername.trim()) {
        const userInfo = await getSlinkUserInfo(rawAccessToken).catch(() => null);
        const jwtPayload = decodeSlinkJwtPayload(rawAccessToken);
        cleanUsername =
          userInfo?.email ||
          userInfo?.preferred_username ||
          jwtPayload?.email ||
          jwtPayload?.preferred_username ||
          effectiveUsername;
      }

      syncMessage = `Đã xác thực OAuth Refresh Token và lưu phiên PTIT S-Link thành công! Hệ thống sẽ tự động gia hạn định kỳ.`;
    } catch (tokenErr: any) {
      console.warn(`S-Link refresh_token failed for ${effectiveUsername} during SAVE:`, tokenErr.message);

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'SAVE_EXTERNAL_ACCOUNT_FAILED',
        targetType: 'EXTERNAL_ACCOUNT',
        targetId: effectiveUsername,
        description: `Lưu cấu hình PTIT S-Link cho ${effectiveUsername} thất bại do Refresh Token không hợp lệ: ${tokenErr.message}`,
        metadata: { effectiveUsername, systemKey, error: tokenErr.message },
      });

      return {
        ok: false,
        response: NextResponse.json(
          {
            error: `Kiểm tra Refresh Token PTIT S-Link thất bại: ${tokenErr.message}. Vui lòng lấy Refresh Token mới từ phiên đăng nhập OAuth trên slink.ptit.edu.vn.`,
          },
          { status: 400 }
        ),
      };
    }
  }

  return {
    ok: true,
    data: {
      cleanUsername,
      fetchedToken,
      fetchedRefreshToken,
      tokenExpiresAt,
      refreshTokenExpiresAt,
      lastTokenRefreshedAt,
      syncMessage,
    },
  };
}
