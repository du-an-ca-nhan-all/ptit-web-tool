import { fetchStudentTimetableFromQLDTTX } from './qldttxServerService';
import { TIMETABLE_AUTO_REFRESH_INTERVAL_MS } from './student-timetable-server-service/constants';
import { buildTimetableResultFromRawData } from './student-timetable-server-service/timetableBuilder';
import {
  buildEmptyConfiguredResult,
  buildInvalidCredentialsResult,
  buildNotConfiguredResult,
  findCachedTimetableRecord,
  findQldttxExternalAccount,
  markExternalAccountAuthError,
  persistTimetableSyncSuccess,
  tryBuildFromCachedRecord,
  tryBuildFromCourseRegistrationFallback,
} from './student-timetable-server-service/timetableCacheRepo';
import type { StudentTimetableCalendarResult } from './student-timetable-server-service/types';
import { isQldttxAuthError } from './student-timetable-server-service/utils';

export type {
  StudentTimetableCalendarResult,
  TimetableCalendarEvent,
  TimetableSubjectSummary,
} from './student-timetable-server-service/types';
export { TIMETABLE_AUTO_REFRESH_INTERVAL_MS } from './student-timetable-server-service/constants';
export { buildTimetableResultFromRawData } from './student-timetable-server-service/timetableBuilder';

/**
 * Lấy dữ liệu Thời Khóa Biểu học kỳ:
 * 1. Đọc từ CSDL bảng StudentTimetableRecord nếu đã lưu và còn hạn (< 10 phút)
 * 2. Tự động pull lại từ cổng QLDTTX nếu chưa lưu, quá 10 phút, hoặc người dùng yêu cầu forceRefresh
 * 3. Lưu trữ lại vào CSDL sau khi pull thành công
 */
export async function getStudentTimetableCalendar(
  username: string,
  options?: { forceRefresh?: boolean; semesterId?: number }
): Promise<StudentTimetableCalendarResult> {
  const cleanUsername = username.trim().toUpperCase();
  let currentSemester = options?.semesterId || 20261;

  // 1. Kiểm tra tài khoản ExternalAccount QLDTTX
  const extAccount = await findQldttxExternalAccount(cleanUsername);
  const isConfigured = !!(extAccount && (extAccount.token || extAccount.extPassword));

  // Nếu CHƯA CẤU HÌNH tài khoản QLDTTX -> Chặn truy cập và trả về errorType NOT_CONFIGURED
  if (!isConfigured) {
    return buildNotConfiguredResult(cleanUsername, currentSemester);
  }

  // 2. Kiểm tra dữ liệu đã lưu trong bảng StudentTimetableRecord trong DB
  const cachedRecord = await findCachedTimetableRecord(cleanUsername);
  const lastPulled = cachedRecord?.lastPulledAt || cachedRecord?.updatedAt;
  const ageMs = lastPulled ? Date.now() - new Date(lastPulled).getTime() : Infinity;
  const isCacheFresh =
    cachedRecord && cachedRecord.rawData && ageMs < TIMETABLE_AUTO_REFRESH_INTERVAL_MS;

  // Nếu KHÔNG yêu cầu forceRefresh và cache còn hạn (< 10 phút) -> Trả về dữ liệu từ CSDL ngay
  if (!options?.forceRefresh && isCacheFresh) {
    const cachedResult = tryBuildFromCachedRecord(
      cleanUsername,
      cachedRecord,
      currentSemester,
      lastPulled,
      'cache'
    );
    if (cachedResult) return cachedResult;
  }

  // 3. Tiến hành kéo mới từ QLDTTX (khi forceRefresh = true, lần đầu chưa có trong DB, hoặc sau 10 phút)
  let authErrorDetected = false;
  let authErrorMessage = '';

  try {
    const fetched = await fetchStudentTimetableFromQLDTTX({
      username: extAccount!.extUsername || cleanUsername,
      password: extAccount!.extPassword || undefined,
      token: extAccount!.token,
      idHocKy: options?.semesterId || null,
    });

    if (fetched.currentSemester) {
      currentSemester = fetched.currentSemester;
    }

    if (Array.isArray(fetched.rawList) && fetched.rawList.length > 0) {
      const resultObj = buildTimetableResultFromRawData(
        cleanUsername,
        fetched.rawList,
        currentSemester,
        {
          isConfigured: true,
          isLiveSync: true,
          isCachedDb: false,
          lastSyncAt: new Date().toISOString(),
        }
      );

      await persistTimetableSyncSuccess(
        extAccount!.id,
        cleanUsername,
        fetched,
        currentSemester,
        resultObj
      );

      return resultObj;
    }
  } catch (err: any) {
    const errMsg = (err?.message || '').toLowerCase();
    console.warn(
      `[getStudentTimetableCalendar] Lỗi kết nối QLDTTX cho ${cleanUsername}:`,
      err?.message
    );

    if (isQldttxAuthError(errMsg)) {
      authErrorDetected = true;
      authErrorMessage = err.message || 'Tài khoản hoặc mật khẩu QLDTTX không chính xác.';
      await markExternalAccountAuthError(extAccount!.id);
    }
  }

  // Nếu SAI USERNAME / PASSWORD -> Chặn truy cập và trả về errorType INVALID_CREDENTIALS
  if (authErrorDetected || extAccount?.status === 'ERROR') {
    return buildInvalidCredentialsResult(
      cleanUsername,
      currentSemester,
      extAccount?.lastSyncAt,
      authErrorMessage
    );
  }

  // Fallback 1: Trả về dữ liệu từ bảng StudentTimetableRecord đã lưu trước đó nếu có (khi mạng QLDTTX gặp sự cố)
  if (cachedRecord && cachedRecord.rawData) {
    const fallbackResult = tryBuildFromCachedRecord(
      cleanUsername,
      cachedRecord,
      currentSemester,
      lastPulled,
      'fallback'
    );
    if (fallbackResult) return fallbackResult;
  }

  // Fallback 2: Fallback sang CourseRegistration
  const courseRegFallback = await tryBuildFromCourseRegistrationFallback(
    cleanUsername,
    currentSemester
  );
  if (courseRegFallback) return courseRegFallback;

  return buildEmptyConfiguredResult(cleanUsername, currentSemester);
}
