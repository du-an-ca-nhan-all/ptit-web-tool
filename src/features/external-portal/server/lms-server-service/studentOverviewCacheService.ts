import { prisma } from '@/src/lib/prisma';
import { fetchLmsDashboardOverview } from './dashboardFetcher';
import type { LmsDashboardOverview } from './types';

/**
 * Quản lý Cache và Lấy Dữ Liệu Khóa Học LMS:
 * - Khi chưa có cache: Pull dữ liệu từ LMS và lưu vào DB.
 * - Khi có cache còn mới (< 24h) và người dùng không yêu cầu forceRefresh: Trả về Cache tức thì (tiết kiệm tài nguyên).
 * - Khi cache quá 24h hoặc người dùng ấn "Cập nhật mới nhất": Thử tải về dữ liệu mới từ LMS.
 * - NẾU TẢI VỀ BỊ LỖI: KHÔNG GHI ĐÈ, giữ nguyên cache cũ và hiển thị thông báo.
 */
export async function getOrFetchStudentLmsOverview(
  username: string,
  options?: { forceRefresh?: boolean }
): Promise<LmsDashboardOverview & { isConfigured: boolean; hasLinkedAccount: boolean }> {
  const cleanUsername = username.trim().toUpperCase();

  // 1. Kiểm tra tài khoản liên kết LMS trong ExternalAccount
  const extAccount = await prisma.externalAccount.findFirst({
    where: {
      username: cleanUsername,
      OR: [
        { systemKey: 'LMS_PTTC1' },
        { systemUrl: { contains: 'lms.pttc1.edu.vn' } },
      ],
    },
  });

  if (!extAccount || (!extAccount.extPassword && !extAccount.token)) {
    return {
      isConfigured: false,
      hasLinkedAccount: false,
      userFullName: cleanUsername,
      username: cleanUsername,
      stats: { enrolledCourses: 0, completedActivities: 0, completedCourses: 0, dueActivities: 0 },
      courses: [],
      lastSyncAt: new Date().toISOString(),
    };
  }

  // 2. Kiểm tra Cache trong Database (bảng StudentLmsRecord)
  let cachedDb: any = null;
  try {
    cachedDb = await prisma.studentLmsRecord.findUnique({
      where: { username: cleanUsername },
    });
  } catch (e) {
    console.warn('[getOrFetchStudentLmsOverview] Đọc cache StudentLmsRecord thất bại:', e);
  }

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const syncTimeCached = cachedDb?.lastPulledAt || cachedDb?.updatedAt || cachedDb?.createdAt || extAccount.lastSyncAt;
  const isCacheFresh =
    cachedDb &&
    cachedDb.rawData &&
    syncTimeCached &&
    Date.now() - new Date(syncTimeCached).getTime() < ONE_DAY_MS;

  // Nếu KHÔNG yêu cầu forceRefresh và Cache còn hạn (< 24h) -> Trả về Cache ngay lập tức
  if (!options?.forceRefresh && isCacheFresh && cachedDb?.rawData) {
    try {
      const parsed = JSON.parse(cachedDb.rawData);
      // Đảm bảo cache có danh sách môn học hợp lệ
      if (Array.isArray(parsed?.courses) && parsed.courses.length > 0) {
        const exactSyncTime = parsed?.lastSyncAt || syncTimeCached;
        return {
          ...parsed,
          isConfigured: true,
          hasLinkedAccount: true,
          isCachedDb: true,
          isLiveSync: false,
          lastSyncAt: exactSyncTime
            ? new Date(exactSyncTime).toISOString()
            : new Date().toISOString(),
        };
      }
    } catch (e) {
      console.warn('[getOrFetchStudentLmsOverview] Parse cache failed, chuyển sang kéo mới từ LMS:', e);
    }
  }

  // 3. Tải dữ liệu mới từ LMS (khi forceRefresh, cache hết hạn hoặc chưa có cache)
  try {
    const now = new Date();
    const freshOverview = await fetchLmsDashboardOverview({
      username: extAccount.extUsername || cleanUsername,
      password: extAccount.extPassword || undefined,
      token: extAccount.token,
    });

    // Cập nhật token mới vào ExternalAccount nếu có login mới
    const updateAccountData: any = {
      lastSyncAt: now,
      status: 'CONNECTED',
      syncMessage: `Đồng bộ thành công ${freshOverview.courses.length} khóa học từ LMS.`,
    };
    if (freshOverview.newToken) {
      updateAccountData.token = freshOverview.newToken;
    }

    await prisma.externalAccount
      .update({
        where: { id: extAccount.id },
        data: updateAccountData,
      })
      .catch(() => {});

    // Lưu / Cập nhật vào DB Cache bằng Prisma upsert
    try {
      await prisma.studentLmsRecord.upsert({
        where: { username: cleanUsername },
        create: {
          username: cleanUsername,
          userFullName: freshOverview.userFullName,
          rawData: JSON.stringify(freshOverview),
          totalEnrolled: freshOverview.stats.enrolledCourses,
          totalCompleted: freshOverview.stats.completedCourses,
          completedActivities: freshOverview.stats.completedActivities,
          dueActivities: freshOverview.stats.dueActivities,
          lastPulledAt: now,
        },
        update: {
          userFullName: freshOverview.userFullName,
          rawData: JSON.stringify(freshOverview),
          totalEnrolled: freshOverview.stats.enrolledCourses,
          totalCompleted: freshOverview.stats.completedCourses,
          completedActivities: freshOverview.stats.completedActivities,
          dueActivities: freshOverview.stats.dueActivities,
          lastPulledAt: now,
        },
      });
    } catch (saveErr) {
      console.warn('[getOrFetchStudentLmsOverview] Lưu cache StudentLmsRecord thất bại:', saveErr);
    }

    return {
      ...freshOverview,
      isConfigured: true,
      hasLinkedAccount: true,
      isCachedDb: false,
      isLiveSync: true,
      lastSyncAt: now.toISOString(),
    };
  } catch (fetchErr: any) {
    console.warn('[getOrFetchStudentLmsOverview] Tải dữ liệu LMS thất bại:', fetchErr);

    const errMsg = (fetchErr?.message || '').toLowerCase();
    if (
      errMsg.includes('hết hạn') ||
      errMsg.includes('mật khẩu') ||
      errMsg.includes('tài khoản') ||
      errMsg.includes('đăng nhập') ||
      errMsg.includes('401') ||
      errMsg.includes('403')
    ) {
      await prisma.externalAccount
        .update({
          where: { id: extAccount.id },
          data: {
            status: 'ERROR',
            syncMessage: `Lỗi kết nối LMS: ${fetchErr.message}`,
          },
        })
        .catch(() => {});
    }

    // NGUYÊN TẮC QUAN TRỌNG: Nếu tải về bị lỗi -> KHÔNG GHI ĐÈ! Trả về dữ liệu Cache cũ nếu có
    if (cachedDb && cachedDb.rawData) {
      try {
        const parsed = JSON.parse(cachedDb.rawData);
        if (Array.isArray(parsed?.courses) && parsed.courses.length > 0) {
          const fallbackSyncTime =
            cachedDb.lastPulledAt || cachedDb.updatedAt || cachedDb.createdAt || extAccount.lastSyncAt;
          const exactSyncTime = parsed?.lastSyncAt || fallbackSyncTime;
          const formattedDate = exactSyncTime ? new Date(exactSyncTime).toLocaleString('vi-VN') : 'gần nhất';
          return {
            ...parsed,
            isConfigured: true,
            hasLinkedAccount: true,
            isCachedDb: true,
            isLiveSync: false,
            syncWarning: `Không thể kết nối đến LMS (${fetchErr.message || 'Lỗi mạng'}). Đang hiển thị dữ liệu đã lưu lúc ${formattedDate}.`,
            lastSyncAt: exactSyncTime
              ? new Date(exactSyncTime).toISOString()
              : new Date().toISOString(),
          };
        }
      } catch (parseErr) {}
    }

    // Nếu chưa từng có cache và tải lỗi -> throw Error để UI xử lý
    throw fetchErr;
  }
}
