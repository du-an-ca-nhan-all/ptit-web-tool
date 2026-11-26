import { prisma } from '@/src/lib/prisma';
import {
  EXAM_AUTO_REFRESH_INTERVAL_MS,
  QLDTTX_EXAM_SEMESTERS_URL,
  QLDTTX_PERSONAL_EXAMS_URL,
} from './student-exam-schedule-server-service/constants';
import {
  fetchStudentExamSemestersFromQLDTTX,
  fetchStudentPersonalExamsFromQLDTTX,
} from './student-exam-schedule-server-service/qldttxClient';
import {
  buildQldtExamResultFromRawData,
  buildResultFromCachedRawData,
  type BuildQldtExamResultParams,
  type BuildResultFromCachedRawDataParams,
} from './student-exam-schedule-server-service/examNormalizer';
import { detectExamScheduleChanges } from './student-exam-schedule-server-service/examDiffDetector';
import {
  isQldtAuthErrorMessage,
  syncAndPersistStudentExamSchedule,
} from './student-exam-schedule-server-service/examScheduleSync';
import type {
  StudentQldtExamItem,
  StudentQldtExamScheduleResult,
  StudentQldtSemester,
} from './student-exam-schedule-server-service/types';

export type {
  StudentQldtExamItem,
  StudentQldtSemester,
  StudentQldtExamScheduleResult,
  BuildQldtExamResultParams,
  BuildResultFromCachedRawDataParams,
};

export {
  EXAM_AUTO_REFRESH_INTERVAL_MS,
  QLDTTX_EXAM_SEMESTERS_URL,
  QLDTTX_PERSONAL_EXAMS_URL,
  fetchStudentExamSemestersFromQLDTTX,
  fetchStudentPersonalExamsFromQLDTTX,
  buildQldtExamResultFromRawData,
  detectExamScheduleChanges,
};

/**
 * Lấy lịch thi cá nhân từ Cổng QLDTTX (kết hợp cache DB StudentQldtExamRecord)
 * Đồng bộ toàn bộ các học kỳ (semesters & all exams) và so sánh biến động
 */
export async function getStudentQldtExamSchedule(
  username: string,
  options?: { forceRefresh?: boolean; semesterId?: number }
): Promise<StudentQldtExamScheduleResult> {
  const cleanUsername = username.trim().toUpperCase();
  let currentSemester = options?.semesterId || 20251;

  // 1. Kiểm tra tài khoản ExternalAccount QLDTTX
  const extAccount = await prisma.externalAccount.findFirst({
    where: {
      username: cleanUsername,
      systemKey: 'QLDTTX_PTTC1',
    },
  });

  const isConfigured = !!(extAccount && (extAccount.token || extAccount.extPassword));

  if (!isConfigured) {
    return {
      success: false,
      username: cleanUsername,
      semesterId: currentSemester,
      semesterName: `Học kỳ ${String(currentSemester).slice(-1)} Năm học ${String(currentSemester).slice(0, 4)}`,
      semesters: [],
      exams: [],
      upcomingExams: [],
      pastExams: [],
      totalExams: 0,
      isConfigured: false,
      hasLinkedAccount: false,
      isLiveSync: false,
      isCachedDb: false,
      lastSyncAt: null,
      errorType: 'NOT_CONFIGURED',
      error:
        'Chưa cấu hình tài khoản Cổng Quản Lý Đào Tạo Từ Xa (QLDTTX PTTC1). Vui lòng cấu hình tài khoản để xem Lịch Thi Cá Nhân từ QLDTTX.',
    };
  }

  // 2. Kiểm tra cache trong DB (bảng StudentQldtExamRecord)
  let cachedRecord: any = null;
  try {
    cachedRecord = await prisma.studentQldtExamRecord.findUnique({
      where: { username: cleanUsername },
    });
  } catch (err) {
    console.warn('[getStudentQldtExamSchedule] Lỗi đọc DB StudentQldtExamRecord:', err);
  }

  const lastPulled = cachedRecord?.lastPulledAt || cachedRecord?.updatedAt;
  const ageMs = lastPulled ? Date.now() - new Date(lastPulled).getTime() : Infinity;
  const isCacheFresh = cachedRecord && cachedRecord.rawData && ageMs < EXAM_AUTO_REFRESH_INTERVAL_MS;

  // Trả về từ DB cache nếu còn hạn và không forceRefresh
  if (!options?.forceRefresh && isCacheFresh) {
    try {
      return buildResultFromCachedRawData({
        cleanUsername,
        cachedRecord,
        currentSemester,
        lastPulled,
        requestedSemesterId: options?.semesterId,
      });
    } catch (parseErr) {
      console.warn('[getStudentQldtExamSchedule] Parse rawData từ cache lỗi:', parseErr);
    }
  }

  // 3. Kéo live từ QLDTTX (Đồng bộ tất cả học kỳ và toàn bộ ca thi)
  let authErrorDetected = false;
  let authErrorMessage = '';

  try {
    return await syncAndPersistStudentExamSchedule({
      cleanUsername,
      extAccount: extAccount!,
      cachedRecord,
      requestedSemesterId: options?.semesterId,
    });
  } catch (err: any) {
    const errMsg = (err?.message || '').toLowerCase();
    console.warn(`[getStudentQldtExamSchedule] Lỗi kết nối QLDTTX cho ${cleanUsername}:`, err?.message);

    if (isQldtAuthErrorMessage(errMsg)) {
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
        .catch((err) => console.warn("[studentExamScheduleServerService] Non-fatal async error:", err));
    }
  }

  // Nếu SAI USERNAME / PASSWORD -> Chặn truy cập và trả về errorType INVALID_CREDENTIALS
  if (authErrorDetected || extAccount?.status === 'ERROR') {
    return {
      success: false,
      username: cleanUsername,
      semesterId: currentSemester,
      semesterName: `Học kỳ ${String(currentSemester).slice(-1)} Năm học ${String(currentSemester).slice(0, 4)}`,
      semesters: [],
      exams: [],
      upcomingExams: [],
      pastExams: [],
      totalExams: 0,
      isConfigured: true,
      hasLinkedAccount: true,
      isLiveSync: false,
      isCachedDb: false,
      lastSyncAt: extAccount?.lastSyncAt ? extAccount.lastSyncAt.toISOString() : null,
      errorType: 'INVALID_CREDENTIALS',
      error:
        authErrorMessage ||
        'Tài khoản hoặc mật khẩu Cổng Quản Lý Đào Tạo Từ Xa (PTTC1) không chính xác hoặc đã bị đổi. Vui lòng kiểm tra và cập nhật lại thông tin đăng nhập.',
    };
  }

  // Fallback 1: Trả về dữ liệu từ bảng StudentQldtExamRecord đã lưu trước đó nếu có (khi mạng QLDTTX gặp sự cố)
  if (cachedRecord && cachedRecord.rawData) {
    try {
      return buildResultFromCachedRawData({
        cleanUsername,
        cachedRecord,
        currentSemester,
        lastPulled,
        requestedSemesterId: options?.semesterId,
      });
    } catch (dbErr) {
      console.error('[getStudentQldtExamSchedule] Fallback StudentQldtExamRecord lỗi:', dbErr);
    }
  }

  return {
    success: true,
    username: cleanUsername,
    semesterId: currentSemester,
    semesterName: `Học kỳ ${String(currentSemester).slice(-1)} Năm học ${String(currentSemester).slice(0, 4)}`,
    semesters: [],
    exams: [],
    upcomingExams: [],
    pastExams: [],
    totalExams: 0,
    isConfigured: true,
    hasLinkedAccount: true,
    isLiveSync: false,
    isCachedDb: false,
    lastSyncAt: null,
  };
}
