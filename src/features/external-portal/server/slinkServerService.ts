/**
 * PTIT S-Link (https://slink.ptit.edu.vn/) Authentication & Management Service
 * Hỗ trợ tự động đăng nhập PTIT S-Link (SSO Keycloak), quản lý và làm mới Access Token / Refresh Token,
 * xác thực phiên làm việc, lấy thông tin người dùng và danh sách thông báo.
 */

import { prisma } from '@/src/lib/prisma';
import { cleanHtml, decodeHtmlEntities, escapeTelegramHtml } from '@/src/lib/htmlUtils';
import {
  getSlinkNotifications,
  getSlinkUserInfo,
  markSlinkNotificationAsRead,
} from './slink-server-service/slinkApi';
import {
  refreshAllSlinkTokensPeriodic,
  refreshAndPersistSlinkAccountToken,
} from './slink-server-service/tokenPersistence';

export { cleanHtml, decodeHtmlEntities, escapeTelegramHtml };

export {
  SLINK_BASE_URL,
  SLINK_SSO_TOKEN_URL,
  SLINK_SSO_USERINFO_URL,
  SLINK_NOTIFICATION_API_URL,
  SLINK_NOTIFICATION_READ_API_URL,
  SLINK_CLIENT_ID,
  SLINK_USER_AGENT,
} from './slink-server-service/constants';

export type {
  SlinkAuthTokenResponse,
  SlinkUserInfo,
  SlinkNotificationItem,
  SlinkNotificationResponse,
  SlinkLoginResult,
  SlinkJwtPayload,
} from './slink-server-service/types';

export {
  decodeSlinkJwtPayload,
  computeSlinkTokenExpiry,
  formatSlinkEmail,
  formatSlinkDate,
} from './slink-server-service/utils';

export {
  refreshSlinkToken,
  validateSlinkToken,
  getValidSlinkTokenOrRefresh,
} from './slink-server-service/tokenAuth';

export {
  refreshAndPersistSlinkAccountToken,
  refreshAllSlinkTokensPeriodic,
};

export {
  getSlinkUserInfo,
  getSlinkNotifications,
  markSlinkNotificationAsRead,
};

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

  const { token } = await refreshAndPersistSlinkAccountToken(extAccount, {
    force: options?.forceRefresh,
  });

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
