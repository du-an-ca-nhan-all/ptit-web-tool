import { prisma } from '@/src/lib/prisma';
import { getValidSlinkTokenOrRefresh } from './tokenAuth';

// Khóa tránh race condition khi nhiều tiến trình cùng refresh một refresh_token xoay vòng (rotation)
const inFlightSlinkRefreshes = new Map<
  number,
  Promise<{
    token: string;
    refreshToken: string | null;
    isNew: boolean;
    tokenExpiresAt?: Date | null;
    refreshTokenExpiresAt?: Date | null;
  }>
>();

/**
 * Lấy hoặc làm mới token cho một bản ghi ExternalAccount (S-Link) và LƯU LẠI cả access_token + refresh_token mới vào DB.
 * Có cơ chế lock theo account.id để tránh xung đột Refresh Token Rotation.
 */
export async function refreshAndPersistSlinkAccountToken(
  extAccount: {
    id: number;
    extUsername: string;
    extPassword?: string | null;
    token?: string | null;
    refreshToken?: string | null;
  },
  options?: { force?: boolean; syncMessagePrefix?: string }
): Promise<{
  token: string;
  refreshToken: string | null;
  isNew: boolean;
  tokenExpiresAt?: Date | null;
  refreshTokenExpiresAt?: Date | null;
}> {
  const existingPromise = inFlightSlinkRefreshes.get(extAccount.id);
  if (existingPromise) {
    return existingPromise;
  }

  const runPromise = (async () => {
    try {
      // Đọc bản mới nhất từ DB để đảm bảo luôn dùng refresh_token mới nhất (tránh dùng lại token cũ đã rotate)
      const latestAccount = await prisma.externalAccount.findUnique({
        where: { id: extAccount.id },
        select: {
          id: true,
          extUsername: true,
          extPassword: true,
          token: true,
          refreshToken: true,
        },
      });

      const target = latestAccount || extAccount;

      const result = await getValidSlinkTokenOrRefresh({
        username: target.extUsername,
        password: target.extPassword || undefined,
        existingToken: target.token,
        refreshToken: target.refreshToken,
        forceRefresh: options?.force,
      });

      if (result.isNew) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        const prefix = options?.syncMessagePrefix || 'Đã tự động làm mới Token & Refresh Token S-Link';
        await prisma.externalAccount.update({
          where: { id: extAccount.id },
          data: {
            token: result.token,
            refreshToken: result.refreshToken || target.refreshToken,
            tokenExpiresAt: result.tokenExpiresAt ?? undefined,
            refreshTokenExpiresAt: result.refreshTokenExpiresAt ?? undefined,
            lastTokenRefreshedAt: now,
            status: 'CONNECTED',
            lastSyncAt: now,
            syncMessage: `${prefix} lúc ${timeStr}`,
          },
        });
      }

      return {
        token: result.token,
        refreshToken: result.refreshToken || target.refreshToken || null,
        isNew: result.isNew,
        tokenExpiresAt: result.tokenExpiresAt,
        refreshTokenExpiresAt: result.refreshTokenExpiresAt,
      };
    } catch (err: any) {
      await prisma.externalAccount
        .update({
          where: { id: extAccount.id },
          data: {
            status: 'ERROR',
            syncMessage: `Lỗi làm mới Token S-Link: ${err?.message || 'Refresh token đã hết hạn hoặc không hợp lệ'}`,
          },
        })
        .catch(() => {});
      throw err;
    } finally {
      inFlightSlinkRefreshes.delete(extAccount.id);
    }
  })();

  inFlightSlinkRefreshes.set(extAccount.id, runPromise);
  return runPromise;
}

/**
 * Tác vụ chạy định kỳ để giữ sống và xoay vòng (rotate) cả Access Token lẫn Refresh Token
 * cho toàn bộ tài khoản PTIT S-Link có lưu refreshToken.
 */
export async function refreshAllSlinkTokensPeriodic(options?: {
  force?: boolean;
  minIntervalMinutes?: number;
}): Promise<{
  total: number;
  refreshed: number;
  skipped: number;
  failed: number;
  errors: Array<{ username: string; error: string }>;
}> {
  const force = options?.force ?? false;
  const minIntervalMinutes = options?.minIntervalMinutes ?? 20;
  const minIntervalMs = minIntervalMinutes * 60 * 1000;
  const ACCESS_EXPIRY_BUFFER_MS = 10 * 60 * 1000; // Refresh sớm trước khi access_token hết hạn 10 phút
  const REFRESH_EXPIRY_BUFFER_MS = 60 * 60 * 1000; // Refresh sớm trước khi refresh_token hết hạn 60 phút

  const slinkAccounts = await prisma.externalAccount.findMany({
    where: {
      OR: [
        { systemKey: 'SLINK_PTIT' },
        { systemUrl: { contains: 'slink.ptit.edu.vn' } },
      ],
      refreshToken: {
        not: null,
      },
    },
    orderBy: { lastTokenRefreshedAt: 'asc' },
  });

  const validAccounts = slinkAccounts.filter((acc) => acc.refreshToken && acc.refreshToken.trim().length > 0);
  let refreshed = 0;
  let skipped = 0;
  let failed = 0;
  const errors: Array<{ username: string; error: string }> = [];

  for (const acc of validAccounts) {
    // Bỏ qua các tài khoản đã báo lỗi token hết hạn vĩnh viễn trừ khi force=true
    if (
      !force &&
      acc.status === 'ERROR' &&
      acc.syncMessage &&
      (acc.syncMessage.toLowerCase().includes('invalid_grant') ||
        acc.syncMessage.toLowerCase().includes('not active') ||
        acc.syncMessage.toLowerCase().includes('expired'))
    ) {
      skipped++;
      continue;
    }

    const now = Date.now();
    let shouldRefresh = force;

    if (!shouldRefresh) {
      const lastRefreshedMs = acc.lastTokenRefreshedAt
        ? new Date(acc.lastTokenRefreshedAt).getTime()
        : acc.lastSyncAt
        ? new Date(acc.lastSyncAt).getTime()
        : 0;

      const accessExpiringSoon =
        !acc.token ||
        (acc.tokenExpiresAt && new Date(acc.tokenExpiresAt).getTime() - now <= ACCESS_EXPIRY_BUFFER_MS);
      const refreshExpiringSoon =
        acc.refreshTokenExpiresAt && new Date(acc.refreshTokenExpiresAt).getTime() - now <= REFRESH_EXPIRY_BUFFER_MS;
      const intervalElapsed = now - lastRefreshedMs >= minIntervalMs;

      shouldRefresh = Boolean(accessExpiringSoon || refreshExpiringSoon || intervalElapsed);
    }

    if (!shouldRefresh) {
      skipped++;
      continue;
    }

    try {
      await refreshAndPersistSlinkAccountToken(acc, {
        force: true,
        syncMessagePrefix: 'Gia hạn định kỳ Token & Refresh Token S-Link thành công',
      });
      refreshed++;
    } catch (err: any) {
      failed++;
      errors.push({
        username: acc.username,
        error: err?.message || 'Lỗi không xác định',
      });
    }

    // Nghỉ ngắn giữa các tài khoản để tránh spam máy chủ SSO
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return {
    total: validAccounts.length,
    refreshed,
    skipped,
    failed,
    errors,
  };
}
