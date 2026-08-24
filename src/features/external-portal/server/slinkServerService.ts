/**
 * PTIT S-Link (https://slink.ptit.edu.vn/) Authentication & Management Service
 * Hỗ trợ tự động đăng nhập PTIT S-Link (SSO Keycloak), quản lý và làm mới Access Token / Refresh Token,
 * xác thực phiên làm việc, lấy thông tin người dùng và danh sách thông báo.
 */

import { prisma } from '@/src/lib/prisma';
import { cleanHtml, decodeHtmlEntities, escapeTelegramHtml } from '@/src/lib/htmlUtils';

export { cleanHtml, decodeHtmlEntities, escapeTelegramHtml };

export const SLINK_BASE_URL = 'https://slink.ptit.edu.vn/';
export const SLINK_SSO_TOKEN_URL = 'https://gwdu.ptit.edu.vn/sso/realms/ptit/protocol/openid-connect/token';
export const SLINK_SSO_USERINFO_URL = 'https://gwdu.ptit.edu.vn/sso/realms/ptit/protocol/openid-connect/userinfo';
export const SLINK_NOTIFICATION_API_URL = 'https://gwdu.ptit.edu.vn/notification/notification/me/page';
export const SLINK_NOTIFICATION_READ_API_URL = 'https://gwdu.ptit.edu.vn/notification/notification/read';

export const SLINK_CLIENT_ID = 'ptit-connect';
export const SLINK_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface SlinkAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  expires_in: number;
  refresh_expires_in?: number;
  token_type?: string;
  scope?: string;
  [key: string]: any;
}

export interface SlinkUserInfo {
  sub?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  [key: string]: any;
}

export interface SlinkNotificationItem {
  id?: string | number;
  title: string;
  content?: string;
  createdAt?: string;
  read?: boolean;
  sender?: string;
  senderName?: string;
  type?: string;
  [key: string]: any;
}

export interface SlinkNotificationResponse {
  success: boolean;
  data?: {
    page: number;
    skip: number;
    limit: number;
    total: number;
    unread: number;
    result: SlinkNotificationItem[];
  };
  message?: string;
}

export interface SlinkLoginResult {
  token: string; // Bearer access_token
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  expiresIn: number;
  username: string;
}

/**
 * Đăng nhập vào PTIT SSO (Keycloak Direct Access Grant)
 * @param account - Tên tài khoản / Email / MSV và mật khẩu
 * @returns Promise<SlinkAuthTokenResponse>
 */
export async function loginSlink(account: {
  username: string;
  password: string;
}): Promise<SlinkAuthTokenResponse> {
  const cleanUser = account.username.trim();
  const cleanPass = account.password.trim();

  if (!cleanUser || !cleanPass) {
    throw new Error('Vui lòng cung cấp đầy đủ tên đăng nhập (MSV/Email) và mật khẩu PTIT S-Link.');
  }

  const params = new URLSearchParams({
    client_id: SLINK_CLIENT_ID,
    grant_type: 'password',
    username: cleanUser,
    password: cleanPass,
    scope: 'openid profile email',
  });

  const res = await fetch(SLINK_SSO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': SLINK_USER_AGENT,
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errBody = await res.text();
    let errMsg = `Đăng nhập S-Link thất bại (HTTP ${res.status})`;
    try {
      const jsonErr = JSON.parse(errBody);
      if (jsonErr.error_description) {
        errMsg = `Đăng nhập S-Link thất bại: ${jsonErr.error_description}`;
      } else if (jsonErr.error) {
        errMsg = `Đăng nhập S-Link thất bại: ${jsonErr.error}`;
      }
    } catch {
      errMsg = `Đăng nhập S-Link thất bại: ${errBody}`;
    }
    throw new Error(errMsg);
  }

  return (await res.json()) as SlinkAuthTokenResponse;
}

/**
 * Làm mới Access Token bằng Refresh Token
 * @param refreshToken - Chuỗi refresh token
 * @returns Promise<SlinkAuthTokenResponse>
 */
export async function refreshSlinkToken(refreshToken: string): Promise<SlinkAuthTokenResponse> {
  if (!refreshToken || !refreshToken.trim()) {
    throw new Error('Refresh token không hợp lệ hoặc bị trống');
  }

  const params = new URLSearchParams({
    client_id: SLINK_CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken.trim(),
  });

  const res = await fetch(SLINK_SSO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': SLINK_USER_AGENT,
    },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new Error(`Làm mới token S-Link thất bại (HTTP ${res.status})`);
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
 * Lấy Token S-Link hợp lệ:
 * - Nếu token cũ còn sống (check qua SSO UserInfo) -> giữ nguyên (isNew: false)
 * - Nếu token hết hạn hoặc chưa có:
 *   + Thử làm mới bằng refreshToken nếu có
 *   + Hoặc tự động đăng nhập lại bằng mật khẩu (isNew: true)
 */
export async function getValidSlinkTokenOrRefresh(account: {
  username: string;
  password?: string;
  existingToken?: string | null;
  refreshToken?: string | null;
}): Promise<{ token: string; isNew: boolean; refreshToken?: string }> {
  const existingRaw = account.existingToken ? account.existingToken.replace(/^Bearer\s+/i, '').trim() : '';

  if (existingRaw && !existingRaw.startsWith('ERROR')) {
    const isAlive = await validateSlinkToken(existingRaw);
    if (isAlive) {
      const fullBearer = account.existingToken?.startsWith('Bearer ')
        ? account.existingToken
        : `Bearer ${existingRaw}`;
      return { token: fullBearer, isNew: false };
    }
  }

  // Thử refresh token nếu có
  if (account.refreshToken && account.refreshToken.trim()) {
    try {
      const refreshed = await refreshSlinkToken(account.refreshToken);
      return {
        token: `Bearer ${refreshed.access_token}`,
        refreshToken: refreshed.refresh_token,
        isNew: true,
      };
    } catch (refreshErr) {
      console.warn('[S-Link] Refresh token expired/failed, falling back to password login if available.');
    }
  }

  // Token hết hạn và chưa refresh được -> Đăng nhập lấy token mới nếu có mật khẩu
  if (!account.password || !account.password.trim()) {
    throw new Error(
      'Phiên đăng nhập PTIT S-Link đã hết hạn và chưa có mật khẩu để tự động đăng nhập lại. Vui lòng cập nhật mật khẩu S-Link trong phần Tài khoản liên kết.'
    );
  }

  const fresh = await loginSlink({
    username: account.username,
    password: account.password,
  });

  return {
    token: `Bearer ${fresh.access_token}`,
    refreshToken: fresh.refresh_token,
    isNew: true,
  };
}

/**
 * Lấy thông tin tài khoản người dùng hiện tại từ PTIT SSO Keycloak
 * @param accessToken - Bearer token hoặc raw access token
 */
export async function getSlinkUserInfo(accessToken: string): Promise<SlinkUserInfo> {
  const rawToken = accessToken.replace(/^Bearer\s+/i, '').trim();
  const res = await fetch(SLINK_SSO_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${rawToken}`,
      'User-Agent': SLINK_USER_AGENT,
    },
  });

  if (!res.ok) {
    throw new Error(`Lấy thông tin người dùng S-Link thất bại (HTTP ${res.status})`);
  }

  return (await res.json()) as SlinkUserInfo;
}

/**
 * Lấy danh sách thông báo của người dùng từ PTIT S-Link
 * @param accessToken - Bearer token hoặc raw access token
 * @param page - Trang cần lấy (mặc định 1)
 * @param limit - Số lượng mỗi trang (mặc định 20)
 * @param unreadOnly - Chỉ lấy thông báo chưa đọc
 */
export async function getSlinkNotifications(
  accessToken: string,
  page: number = 1,
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<SlinkNotificationResponse> {
  const rawToken = accessToken.replace(/^Bearer\s+/i, '').trim();
  const url = `${SLINK_NOTIFICATION_API_URL}?page=${page}&limit=${limit}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${rawToken}`,
      Accept: 'application/json, text/plain, */*',
      'User-Agent': SLINK_USER_AGENT,
    },
  });

  if (!res.ok) {
    throw new Error(`Gọi API thông báo S-Link thất bại (HTTP ${res.status})`);
  }

  const json = (await res.json()) as SlinkNotificationResponse;

  if (json.data?.result && Array.isArray(json.data.result)) {
    json.data.result = json.data.result.map((item) => ({
      ...item,
      title: decodeHtmlEntities(item.title || ''),
      senderName: item.senderName ? decodeHtmlEntities(item.senderName) : item.senderName,
      sender: item.sender ? decodeHtmlEntities(item.sender) : item.sender,
    }));
  }

  if (unreadOnly && json.data?.result) {
    json.data.result = json.data.result.filter((item) => !item.read);
  }

  return json;
}

/**
 * Đánh dấu một thông báo hoặc tất cả thông báo là đã đọc trên PTIT S-Link
 * @param accessToken - Bearer token hoặc raw access token
 * @param notificationId - ID (_id) của thông báo (nếu type = 'ONE')
 * @param type - 'ONE' (1 thông báo) hoặc 'ALL' (tất cả thông báo)
 */
export async function markSlinkNotificationAsRead(
  accessToken: string,
  notificationId?: string,
  type: 'ONE' | 'ALL' = 'ONE'
): Promise<{ success: boolean; data?: any; message?: string }> {
  const rawToken = accessToken.replace(/^Bearer\s+/i, '').trim();
  const url = SLINK_NOTIFICATION_READ_API_URL;

  const bodyPayload: any = type === 'ALL'
    ? { type: 'ALL' }
    : { type: 'ONE', notificationId: String(notificationId || '') };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${rawToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      'User-Agent': SLINK_USER_AGENT,
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Đánh dấu đã đọc thông báo S-Link thất bại (HTTP ${res.status}): ${errText}`);
  }

  return (await res.json()) as { success: boolean; data?: any };
}

/**
 * Format ngày tháng ISO sang định dạng ngày giờ Việt Nam
 */
export function formatSlinkDate(isoStr?: string): string {
  if (!isoStr) return 'N/A';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

/**
 * Lấy hoặc đồng bộ danh sách thông báo và thông tin S-Link cho sinh viên dựa trên tài khoản trong DB
 */
export async function getOrFetchStudentSlinkOverview(
  username: string,
  options?: { page?: number; limit?: number; unreadOnly?: boolean; forceRefresh?: boolean }
) {
  const cleanUsername = username.trim().toUpperCase();
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const unreadOnly = options?.unreadOnly || false;

  const extAccount = await prisma.externalAccount.findFirst({
    where: {
      username: cleanUsername,
      OR: [
        { systemKey: 'SLINK_PTIT' },
        { systemUrl: { contains: 'slink.ptit.edu.vn' } },
      ],
    },
  });

  if (!extAccount) {
    return {
      isConfigured: false,
      hasLinkedAccount: false,
      userInfo: null,
      notifications: null,
      message: 'Chưa liên kết tài khoản Cổng Thông Tin PTIT S-Link',
    };
  }

  const { token, isNew } = await getValidSlinkTokenOrRefresh({
    username: extAccount.extUsername,
    password: extAccount.extPassword,
    existingToken: options?.forceRefresh ? null : extAccount.token,
  });

  if (isNew && token !== extAccount.token) {
    await prisma.externalAccount.update({
      where: { id: extAccount.id },
      data: {
        token,
        status: 'CONNECTED',
        lastSyncAt: new Date(),
        syncMessage: `Đã tự động làm mới Token S-Link lúc ${new Date().toLocaleTimeString('vi-VN')}`,
      },
    });
  }

  const [userInfoRes, notifRes] = await Promise.all([
    getSlinkUserInfo(token).catch((e) => {
      console.warn('[getOrFetchStudentSlinkOverview] Lỗi lấy thông tin user S-Link:', e.message);
      return null;
    }),
    getSlinkNotifications(token, page, limit, unreadOnly).catch((e) => {
      console.warn('[getOrFetchStudentSlinkOverview] Lỗi lấy thông báo S-Link:', e.message);
      return null;
    }),
  ]);

  return {
    isConfigured: true,
    hasLinkedAccount: true,
    userInfo: userInfoRes,
    notifications: notifRes?.data || null,
    lastSyncAt: new Date().toISOString(),
  };
}
