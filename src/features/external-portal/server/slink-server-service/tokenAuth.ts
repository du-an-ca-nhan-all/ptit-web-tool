import {
  SLINK_CLIENT_ID,
  SLINK_SSO_TOKEN_URL,
  SLINK_SSO_USERINFO_URL,
  SLINK_USER_AGENT,
} from './constants';
import type { SlinkAuthTokenResponse } from './types';
import { computeSlinkTokenExpiry, decodeSlinkJwtPayload } from './utils';

/**
 * Làm mới Access Token và Refresh Token mới bằng Refresh Token (OAuth / Keycloak)
 * Tự động nhận diện client_id (azp) và token endpoint (iss) từ JWT payload của refresh_token.
 * @param refreshToken - Chuỗi refresh token
 * @returns Promise<SlinkAuthTokenResponse>
 */
export async function refreshSlinkToken(refreshToken: string): Promise<SlinkAuthTokenResponse> {
  const cleanRefreshToken = (refreshToken || '')
    .trim()
    .replace(/^["']|["']$/g, '');

  if (!cleanRefreshToken) {
    throw new Error('Refresh token không hợp lệ hoặc bị trống');
  }

  const jwtPayload = decodeSlinkJwtPayload(cleanRefreshToken);
  const clientId = jwtPayload?.azp || SLINK_CLIENT_ID;
  const tokenUrl =
    jwtPayload?.iss && typeof jwtPayload.iss === 'string' && jwtPayload.iss.startsWith('https://gwdu.ptit.edu.vn/sso/')
      ? `${jwtPayload.iss.replace(/\/$/, '')}/protocol/openid-connect/token`
      : SLINK_SSO_TOKEN_URL;

  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: 'refresh_token',
    refresh_token: cleanRefreshToken,
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': SLINK_USER_AGENT,
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    let errMsg = `Làm mới token S-Link thất bại (HTTP ${res.status})`;
    try {
      const jsonErr = JSON.parse(errBody);
      if (jsonErr.error_description) {
        errMsg = `Làm mới token S-Link thất bại: ${jsonErr.error_description}`;
      } else if (jsonErr.error) {
        errMsg = `Làm mới token S-Link thất bại: ${jsonErr.error}`;
      }
    } catch {
      if (errBody) {
        errMsg = `Làm mới token S-Link thất bại (HTTP ${res.status}): ${errBody.slice(0, 200)}`;
      }
    }
    throw new Error(errMsg);
  }

  return (await res.json()) as SlinkAuthTokenResponse;
}

/**
 * Kiểm tra xem Access Token S-Link hiện tại còn sống (alive) và hợp lệ không
 * @param token - Token dạng Bearer <token> hoặc raw token
 */
export async function validateSlinkToken(token: string): Promise<boolean> {
  const rawToken = token.replace(/^Bearer\s+/i, '').trim();
  if (!rawToken) return false;

  try {
    const res = await fetch(SLINK_SSO_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${rawToken}`,
        'User-Agent': SLINK_USER_AGENT,
      },
    });

    return res.status === 200;
  } catch {
    return false;
  }
}

/**
 * Lấy Token S-Link hợp lệ thông qua OAuth Refresh Token:
 * - Nếu không forceRefresh và token cũ còn sống (check qua SSO UserInfo) -> giữ nguyên (isNew: false)
 * - Nếu token hết hạn, chưa có, hoặc forceRefresh -> gọi refreshSlinkToken để lấy cả access_token & refresh_token mới
 * (S-Link đã ngừng hỗ trợ đăng nhập trực tiếp bằng username/password, chỉ dùng OAuth refresh_token)
 */
export async function getValidSlinkTokenOrRefresh(account: {
  username?: string;
  password?: string;
  existingToken?: string | null;
  refreshToken?: string | null;
  forceRefresh?: boolean;
}): Promise<{
  token: string;
  isNew: boolean;
  refreshToken?: string;
  tokenExpiresAt?: Date | null;
  refreshTokenExpiresAt?: Date | null;
}> {
  const existingRaw = account.existingToken ? account.existingToken.replace(/^Bearer\s+/i, '').trim() : '';

  if (!account.forceRefresh && existingRaw && !existingRaw.startsWith('ERROR')) {
    const isAlive = await validateSlinkToken(existingRaw);
    if (isAlive) {
      const fullBearer = account.existingToken?.startsWith('Bearer ')
        ? account.existingToken
        : `Bearer ${existingRaw}`;
      return {
        token: fullBearer,
        refreshToken: account.refreshToken || undefined,
        isNew: false,
      };
    }
  }

  // Làm mới bằng refresh_token (OAuth)
  if (!account.refreshToken || !account.refreshToken.trim()) {
    throw new Error(
      'PTIT S-Link đã chuyển sang đăng nhập OAuth và chưa có Refresh Token để làm mới phiên. Vui lòng cập nhật Refresh Token S-Link trong phần Tài khoản liên kết.'
    );
  }

  const refreshed = await refreshSlinkToken(account.refreshToken);
  const nextRefreshToken = refreshed.refresh_token || account.refreshToken.trim();
  const { tokenExpiresAt, refreshTokenExpiresAt } = computeSlinkTokenExpiry({
    ...refreshed,
    refresh_token: nextRefreshToken,
  });

  return {
    token: `Bearer ${refreshed.access_token}`,
    refreshToken: nextRefreshToken,
    tokenExpiresAt,
    refreshTokenExpiresAt,
    isNew: true,
  };
}
