import { prisma } from '@/src/lib/prisma';
import { fetchStudentGradesFromQLDTTX } from './qldttxServerService';
import { buildGradeResultFromRawData } from './student-grades-server-service/buildGradeResult';
import {
  createEmptyGradesResult,
  isQldttxAuthError,
  persistStudentGradeRecord,
  readCachedStudentGrades,
} from './student-grades-server-service/gradeRepository';
import type { StudentGradesResult } from './student-grades-server-service/types';

export type {
  AcademicTargetGoal,
  CourseComponentGrade,
  GpaTrendItem,
  GradeDistributionBucket,
  SemesterGradeSummary,
  StudentCourseGrade,
  StudentGradesResult,
} from './student-grades-server-service/types';

export { buildGradeResultFromRawData };

/**
 * Lấy kết quả học tập của sinh viên (ưu tiên đọc từ DB StudentGradeRecord nếu chưa yêu cầu refresh)
 */
export async function getStudentGrades(
  username: string,
  options?: { forceRefresh?: boolean }
): Promise<StudentGradesResult> {
  const cleanUsername = username.trim().toUpperCase();

  // 1. Kiểm tra tài khoản ExternalAccount QLDTTX
  const extAccount = await prisma.externalAccount.findFirst({
    where: {
      username: cleanUsername,
      systemKey: 'QLDTTX_PTTC1',
    },
  });

  const isConfigured = !!(extAccount && (extAccount.token || extAccount.extPassword));

  if (!isConfigured) {
    return createEmptyGradesResult({
      username: cleanUsername,
      isConfigured: false,
      hasLinkedAccount: false,
      lastSyncAt: null,
      classification: 'Chưa liên kết',
      errorType: 'NOT_CONFIGURED',
      error:
        'Chưa cấu hình tài khoản Cổng Quản Lý Đào Tạo Từ Xa (QLDTTX PTTC1). Vui lòng cấu hình tài khoản để xem Bảng Điểm & Kết Quả Học Tập.',
    });
  }

  // 2. Nếu KHÔNG yêu cầu forceRefresh -> Kiểm tra cache bảng StudentGradeRecord trong DB trước
  if (!options?.forceRefresh) {
    try {
      const cachedResult = await readCachedStudentGrades(cleanUsername, extAccount?.lastSyncAt, true);
      if (cachedResult) {
        return cachedResult;
      }
    } catch (cacheErr) {
      console.warn('[getStudentGrades] Đọc cache StudentGradeRecord thất bại, chuyển sang gọi QLDTTX:', cacheErr);
    }
  }

  // 3. Gọi trực tiếp tới QLDTTX khi forceRefresh hoặc chưa có cache trong DB
  const lastSyncAt = extAccount?.lastSyncAt ? extAccount.lastSyncAt.toISOString() : null;
  let authErrorDetected = false;
  let authErrorMessage = '';
  let fetchedResult: any = null;

  try {
    fetchedResult = await fetchStudentGradesFromQLDTTX({
      username: extAccount!.extUsername || cleanUsername,
      password: extAccount!.extPassword || undefined,
      token: extAccount!.token,
    });

    // Cập nhật trạng thái CONNECTED vào Database
    await prisma.externalAccount
      .update({
        where: { id: extAccount!.id },
        data: {
          ...(fetchedResult.newToken ? { token: fetchedResult.newToken } : {}),
          lastSyncAt: new Date(),
          status: 'CONNECTED',
          syncMessage: 'Đồng bộ điểm thành công từ QLDTTX.',
        },
      })
      .catch(() => {});

    // Xây dựng dữ liệu hoàn chỉnh
    const resultObj = buildGradeResultFromRawData(cleanUsername, fetchedResult, {
      isConfigured: true,
      isLiveSync: true,
      isCachedDb: false,
      lastSyncAt: new Date().toISOString(),
    });

    // 4. Lưu / Persist vào bảng StudentGradeRecord theo User trong Database
    try {
      await persistStudentGradeRecord(cleanUsername, fetchedResult, resultObj);
    } catch (saveErr) {
      console.warn('[getStudentGrades] Lưu StudentGradeRecord thất bại:', saveErr);
    }

    return resultObj;
  } catch (err: any) {
    const errMsg = (err?.message || '').toLowerCase();
    console.warn(`[getStudentGrades] Lỗi kết nối QLDTTX cho ${cleanUsername}:`, err?.message);

    if (isQldttxAuthError(errMsg)) {
      authErrorDetected = true;
      authErrorMessage = err.message || 'Tài khoản hoặc mật khẩu QLDTTX không chính xác.';

      await prisma.externalAccount
        .update({
          where: { id: extAccount!.id },
          data: {
            status: 'ERROR',
            syncMessage: 'Đăng nhập thất bại: Tài khoản hoặc mật khẩu không chính xác.',
          },
        })
        .catch(() => {});
    } else {
      // Nếu lỗi mạng / timeout trường, thử fallback sang StudentGradeRecord trong DB
      try {
        const fallbackResult = await readCachedStudentGrades(cleanUsername, extAccount?.lastSyncAt, false);
        if (fallbackResult) {
          return fallbackResult;
        }
      } catch (fbErr) {
        console.warn(`[studentGradesServerService] Non-fatal error:`, fbErr);
      }

      return createEmptyGradesResult({
        username: cleanUsername,
        isConfigured: true,
        hasLinkedAccount: true,
        lastSyncAt,
        classification: 'Lỗi kết nối',
        errorType: 'SERVER_ERROR',
        error: `Không thể kết nối đến cổng điểm QLDTTX: ${err.message}`,
      });
    }
  }

  if (authErrorDetected || extAccount?.status === 'ERROR') {
    return createEmptyGradesResult({
      username: cleanUsername,
      isConfigured: true,
      hasLinkedAccount: true,
      lastSyncAt,
      classification: 'Sai thông tin',
      errorType: 'INVALID_CREDENTIALS',
      error: authErrorMessage || 'Tài khoản hoặc mật khẩu Cổng Quản Lý Đào Tạo Từ Xa không chính xác.',
    });
  }

  return createEmptyGradesResult({
    username: cleanUsername,
    isConfigured: true,
    hasLinkedAccount: true,
    lastSyncAt,
    classification: 'Không có dữ liệu',
  });
}
