import { decodeHtmlEntities } from '@/src/lib/htmlUtils';
import {
  SLINK_NOTIFICATION_API_URL,
  SLINK_NOTIFICATION_READ_API_URL,
  SLINK_SSO_USERINFO_URL,
  SLINK_USER_AGENT,
} from './constants';
import type { SlinkNotificationResponse, SlinkUserInfo } from './types';

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

export interface GetSlinkNotificationsParams {
  accessToken: string;
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

/**
 * Lấy danh sách thông báo của người dùng từ PTIT S-Link
 */
export async function getSlinkNotifications(
  params: GetSlinkNotificationsParams
): Promise<SlinkNotificationResponse> {
  const { accessToken, page = 1, limit = 20, unreadOnly = false } = params;
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
