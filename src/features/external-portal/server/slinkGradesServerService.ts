import { prisma } from '@/src/lib/prisma';
import { StudentGradesResult } from './studentGradesServerService';
import {
  SLINK_QLDT_API_BASE,
  SLINK_COMPONENT_NAMES,
} from './slink-grades-server-service/constants';
import { fetchStudentGradesFromSlink } from './slink-grades-server-service/slinkApiClient';
import { buildSlinkGradeResultFromRawData } from './slink-grades-server-service/gradeAnalytics';
import {
  createEmptySlinkGradesErrorResult,
  isSlinkAuthError,
  persistSlinkGradeRecord,
  readCachedSlinkGradeResult,
} from './slink-grades-server-service/gradePersistence';

export {
  SLINK_QLDT_API_BASE,
  SLINK_COMPONENT_NAMES,
  fetchStudentGradesFromSlink,
  buildSlinkGradeResultFromRawData,
};

/**
 * Lấy kết quả học tập từ S-Link của sinh viên (ưu tiên đọc từ DB StudentSlinkGradeRecord nếu chưa yêu cầu refresh)
 */
export async function getStudentSlinkGrades(
  username: string,
  options?: { forceRefresh?: boolean }
): Promise<StudentGradesResult> {
  const cleanUsername = username.trim().toUpperCase();

  // 1. Tìm ExternalAccount S-Link
  const extAccount = await prisma.externalAccount.findFirst({
    where: {
      username: cleanUsername,
      OR: [
        { systemKey: 'SLINK_PTIT' },
        { systemUrl: { contains: 'slink.ptit.edu.vn' } },
      ],
    },
  });

  const isConfigured = !!(extAccount && (extAccount.token || extAccount.refreshToken));

  if (!isConfigured) {
    return createEmptySlinkGradesErrorResult({
      cleanUsername,
      isConfigured: false,
      lastSyncAt: null,
      classification: 'Chưa liên kết',
      errorType: 'NOT_CONFIGURED',
      error: 'Chưa cấu hình tài khoản Cổng Thông Tin PTIT S-Link. Vui lòng cấu hình tài khoản để xem Kết Quả Học Tập từ S-Link.',
    });
  }

  // 2. Nếu KHÔNG yêu cầu forceRefresh -> Kiểm tra cache bảng StudentSlinkGradeRecord trong DB trước
  if (!options?.forceRefresh) {
    try {
      const cached = await readCachedSlinkGradeResult({
        cleanUsername,
        fallbackLastSyncAt: extAccount?.lastSyncAt,
        requireNonEmptyPayload: true,
      });
      if (cached) {
        return cached;
      }
    } catch (cacheErr) {
      console.warn('[getStudentSlinkGrades] Đọc cache StudentSlinkGradeRecord thất bại, chuyển sang gọi S-Link:', cacheErr);
    }
  }

  // 3. Gọi trực tiếp tới S-Link khi forceRefresh hoặc chưa có cache trong DB
  let fetchedResult: any = null;

  try {
    fetchedResult = await fetchStudentGradesFromSlink({
      username: extAccount!.extUsername || cleanUsername,
      password: extAccount!.extPassword || undefined,
      token: extAccount!.token,
      refreshToken: extAccount!.refreshToken,
    });

    // Cập nhật token, refreshToken và trạng thái CONNECTED vào ExternalAccount
    await prisma.externalAccount
      .update({
        where: { id: extAccount!.id },
        data: {
          ...(fetchedResult.newToken ? { token: fetchedResult.newToken } : {}),
          ...(fetchedResult.newRefreshToken ? { refreshToken: fetchedResult.newRefreshToken } : {}),
          ...(fetchedResult.tokenExpiresAt ? { tokenExpiresAt: fetchedResult.tokenExpiresAt } : {}),
          ...(fetchedResult.refreshTokenExpiresAt ? { refreshTokenExpiresAt: fetchedResult.refreshTokenExpiresAt } : {}),
          ...(fetchedResult.newToken || fetchedResult.newRefreshToken ? { lastTokenRefreshedAt: new Date() } : {}),
          lastSyncAt: new Date(),
          status: 'CONNECTED',
          syncMessage: 'Đồng bộ kết quả học tập thành công từ PTIT S-Link.',
        },
      })
      .catch((err) => console.warn("[slinkGradesServerService] Non-fatal async error:", err));

    // Xây dựng dữ liệu hoàn chỉnh
    const resultObj = buildSlinkGradeResultFromRawData(cleanUsername, fetchedResult, {
      isConfigured: true,
      isLiveSync: true,
      isCachedDb: false,
      lastSyncAt: new Date().toISOString(),
    });

    // 4. Lưu / Persist vào bảng StudentSlinkGradeRecord trong Database
    try {
      await persistSlinkGradeRecord(cleanUsername, fetchedResult, resultObj);
    } catch (saveErr) {
      console.warn('[getStudentSlinkGrades] Lưu StudentSlinkGradeRecord thất bại:', saveErr);
    }

    return resultObj;
  } catch (err: any) {
    const errMsg = (err?.message || '').toLowerCase();
    console.warn(`[getStudentSlinkGrades] Lỗi kết nối S-Link cho ${cleanUsername}:`, err?.message);

    const isAuthErr = isSlinkAuthError(errMsg);

    if (isAuthErr) {
      await prisma.externalAccount
        .update({
          where: { id: extAccount!.id },
          data: {
            status: 'ERROR',
            syncMessage: 'Phiên PTIT S-Link đã hết hạn hoặc Refresh Token không hợp lệ. Vui lòng cập nhật lại Refresh Token.',
          },
        })
        .catch((err) => console.warn("[slinkGradesServerService] Non-fatal async error:", err));
    }

    // Nếu lỗi mạng / timeout, thử fallback sang StudentSlinkGradeRecord trong DB
    try {
      const fallbackResult = await readCachedSlinkGradeResult({
        cleanUsername,
        fallbackLastSyncAt: extAccount?.lastSyncAt,
        requireNonEmptyPayload: false,
      });
      if (fallbackResult) {
        return fallbackResult;
      }
    } catch (fallbackErr) {
      console.warn('[getStudentSlinkGrades] Đọc fallback DB thất bại:', fallbackErr);
    }

    return createEmptySlinkGradesErrorResult({
      cleanUsername,
      isConfigured: true,
      lastSyncAt: extAccount?.lastSyncAt ? extAccount.lastSyncAt.toISOString() : null,
      classification: 'Lỗi đồng bộ',
      errorType: isAuthErr ? 'INVALID_CREDENTIALS' : 'SERVER_ERROR',
      error: `Không thể kéo dữ liệu từ Cổng S-Link: ${err.message || 'Lỗi không xác định'}`,
    });
  }
}
