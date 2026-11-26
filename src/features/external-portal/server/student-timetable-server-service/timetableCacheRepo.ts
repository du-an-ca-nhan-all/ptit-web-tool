import { prisma } from '@/src/lib/prisma';
import { buildTimetableResultFromRawData } from './timetableBuilder';
import type { StudentTimetableCalendarResult } from './types';
import {
  extractRawListFromCachedRecord,
  extractRawListFromCourseRegistration,
  formatSemesterName,
} from './utils';

export async function findQldttxExternalAccount(cleanUsername: string) {
  return prisma.externalAccount.findFirst({
    where: {
      username: cleanUsername,
      systemKey: 'QLDTTX_PTTC1',
    },
  });
}

export async function findCachedTimetableRecord(cleanUsername: string): Promise<any> {
  try {
    return await prisma.studentTimetableRecord.findUnique({
      where: { username: cleanUsername },
    });
  } catch (err) {
    console.warn('[getStudentTimetableCalendar] Lỗi đọc DB StudentTimetableRecord:', err);
    return null;
  }
}

export function tryBuildFromCachedRecord(
  cleanUsername: string,
  cachedRecord: any,
  currentSemester: number,
  lastPulled: any,
  mode: 'cache' | 'fallback'
): StudentTimetableCalendarResult | null {
  try {
    const parsed = JSON.parse(cachedRecord.rawData);
    const rawList = extractRawListFromCachedRecord(parsed);

    if (Array.isArray(rawList) && rawList.length > 0) {
      const semId = cachedRecord.semesterId || parsed.currentSemester || currentSemester;
      return buildTimetableResultFromRawData(cleanUsername, rawList, semId, {
        isConfigured: true,
        isLiveSync: false,
        isCachedDb: true,
        lastSyncAt: lastPulled ? new Date(lastPulled).toISOString() : null,
        semesterName: cachedRecord.semesterName || undefined,
      });
    }
  } catch (err) {
    if (mode === 'cache') {
      console.warn('[getStudentTimetableCalendar] Parse rawData từ cache lỗi:', err);
    } else {
      console.error('[getStudentTimetableCalendar] Fallback StudentTimetableRecord lỗi:', err);
    }
  }
  return null;
}

export async function persistTimetableSyncSuccess(
  extAccountId: number,
  cleanUsername: string,
  fetched: any,
  currentSemester: number,
  resultObj: StudentTimetableCalendarResult
): Promise<void> {
  // Cập nhật trạng thái CONNECTED và token mới nếu có
  await prisma.externalAccount
    .update({
      where: { id: extAccountId },
      data: {
        ...(fetched.newToken ? { token: fetched.newToken } : {}),
        lastSyncAt: new Date(),
        status: 'CONNECTED',
        syncMessage: 'Đồng bộ TKB thành công từ QLDTTX.',
      },
    })
    .catch(() => {});

  // 4. Lưu / Persist vào DB bảng StudentTimetableRecord
  try {
    await prisma.studentTimetableRecord.upsert({
      where: { username: cleanUsername },
      create: {
        username: cleanUsername,
        rawData: JSON.stringify(fetched),
        semesterId: currentSemester,
        semesterName: resultObj.semesterName,
        totalSubjects: resultObj.uniqueSubjectsCount,
        totalEvents: resultObj.totalEvents,
        lastPulledAt: new Date(),
      },
      update: {
        rawData: JSON.stringify(fetched),
        semesterId: currentSemester,
        semesterName: resultObj.semesterName,
        totalSubjects: resultObj.uniqueSubjectsCount,
        totalEvents: resultObj.totalEvents,
        lastPulledAt: new Date(),
      },
    });
  } catch (saveErr) {
    console.error('[getStudentTimetableCalendar] Lưu StudentTimetableRecord thất bại:', saveErr);
  }
}

export async function markExternalAccountAuthError(extAccountId: number): Promise<void> {
  await prisma.externalAccount
    .update({
      where: { id: extAccountId },
      data: {
        status: 'ERROR',
        syncMessage: 'Đăng nhập thất bại: Tài khoản hoặc mật khẩu không chính xác.',
      },
    })
    .catch(() => {});
}

export async function tryBuildFromCourseRegistrationFallback(
  cleanUsername: string,
  currentSemester: number
): Promise<StudentTimetableCalendarResult | null> {
  try {
    const dbCourseReg = await prisma.courseRegistration.findFirst({
      where: { username: cleanUsername },
      orderBy: { updatedAt: 'desc' },
    });

    if (dbCourseReg && dbCourseReg.data) {
      const parsed = JSON.parse(dbCourseReg.data);
      const list = extractRawListFromCourseRegistration(parsed);

      if (Array.isArray(list) && list.length > 0) {
        return buildTimetableResultFromRawData(cleanUsername, list, currentSemester, {
          isConfigured: true,
          isLiveSync: false,
          isCachedDb: true,
          lastSyncAt: dbCourseReg.updatedAt ? dbCourseReg.updatedAt.toISOString() : null,
        });
      }
    }
  } catch (dbErr) {
    console.error('[getStudentTimetableCalendar] Fallback CourseRegistration lỗi:', dbErr);
  }
  return null;
}

export function buildNotConfiguredResult(
  cleanUsername: string,
  currentSemester: number
): StudentTimetableCalendarResult {
  return {
    success: false,
    username: cleanUsername,
    semesterId: currentSemester,
    semesterName: formatSemesterName(currentSemester),
    isConfigured: false,
    hasLinkedAccount: false,
    isLiveSync: false,
    isCachedDb: false,
    lastSyncAt: null,
    totalEvents: 0,
    uniqueSubjectsCount: 0,
    subjects: [],
    events: [],
    upcomingEvents: [],
    errorType: 'NOT_CONFIGURED',
    error:
      'Chưa cấu hình tài khoản Cổng Quản Lý Đào Tạo Từ Xa (QLDTTX PTTC1). Vui lòng cấu hình tài khoản để xem Thời Khóa Biểu & Lịch Học Cá Nhân.',
  };
}

export function buildInvalidCredentialsResult(
  cleanUsername: string,
  currentSemester: number,
  lastSyncAt: Date | null | undefined,
  authErrorMessage: string
): StudentTimetableCalendarResult {
  return {
    success: false,
    username: cleanUsername,
    semesterId: currentSemester,
    semesterName: formatSemesterName(currentSemester),
    isConfigured: true,
    hasLinkedAccount: true,
    isLiveSync: false,
    isCachedDb: false,
    lastSyncAt: lastSyncAt ? lastSyncAt.toISOString() : null,
    totalEvents: 0,
    uniqueSubjectsCount: 0,
    subjects: [],
    events: [],
    upcomingEvents: [],
    errorType: 'INVALID_CREDENTIALS',
    error:
      authErrorMessage ||
      'Tài khoản hoặc mật khẩu Cổng Quản Lý Đào Tạo Từ Xa (PTTC1) không chính xác hoặc đã bị đổi. Vui lòng kiểm tra và cập nhật lại thông tin đăng nhập.',
  };
}

export function buildEmptyConfiguredResult(
  cleanUsername: string,
  currentSemester: number
): StudentTimetableCalendarResult {
  return {
    success: true,
    username: cleanUsername,
    semesterId: currentSemester,
    semesterName: formatSemesterName(currentSemester),
    isConfigured: true,
    hasLinkedAccount: true,
    isLiveSync: false,
    isCachedDb: false,
    lastSyncAt: null,
    totalCredits: 0,
    tuitionFee: 0,
    totalEvents: 0,
    uniqueSubjectsCount: 0,
    subjects: [],
    events: [],
    upcomingEvents: [],
  };
}
