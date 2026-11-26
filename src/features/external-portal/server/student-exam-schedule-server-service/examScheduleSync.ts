import { prisma } from '@/src/lib/prisma';
import { dispatchQldtExamScheduleChanges } from '@/src/features/telegram/server/telegramDispatcher';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { detectExamScheduleChanges } from './examDiffDetector';
import { buildQldtExamResultFromRawData } from './examNormalizer';
import {
  fetchStudentExamSemestersFromQLDTTX,
  fetchStudentPersonalExamsFromQLDTTX,
} from './qldttxClient';
import type { StudentQldtExamScheduleResult } from './types';

export function isQldtAuthErrorMessage(errMsg: string): boolean {
  return (
    errMsg.includes('401') ||
    errMsg.includes('403') ||
    errMsg.includes('không thành công') ||
    errMsg.includes('mật khẩu') ||
    errMsg.includes('tài khoản') ||
    errMsg.includes('đăng nhập') ||
    errMsg.includes('unauthorized') ||
    errMsg.includes('forbidden') ||
    errMsg.includes('không đúng') ||
    errMsg.includes('user không tồn tại')
  );
}

function notifyExamScheduleChangesIfDetected(
  cleanUsername: string,
  cachedRecord: any,
  allRawExamsList: any[],
  semesterName?: string
): void {
  if (!cachedRecord?.rawData) return;

  try {
    const oldParsed = JSON.parse(cachedRecord.rawData);
    const oldExamsList = oldParsed?.allExams || oldParsed?.exams || oldParsed?.data?.ds_lich_thi || [];
    if (
      Array.isArray(oldExamsList) &&
      oldExamsList.length > 0 &&
      allRawExamsList.length > 0
    ) {
      const detectedDiffs = detectExamScheduleChanges(oldExamsList, allRawExamsList);
      if (detectedDiffs.length > 0) {
        console.log(`🔔 [QLDT Exam Schedule] Phát hiện ${detectedDiffs.length} thay đổi lịch thi cho sinh viên ${cleanUsername}!`);

        // Gửi Telegram bất đồng bộ (không chặn luồng lưu dữ liệu)
        dispatchQldtExamScheduleChanges({
          username: cleanUsername,
          semesterName,
          changes: detectedDiffs,
        }).catch((dispatchErr) => {
          console.error(`[QLDT Exam Schedule] Gửi thông báo biến động lịch thi cho ${cleanUsername} thất bại:`, dispatchErr);
        });

        // Ghi nhật ký hoạt động hệ thống
        logActivity({
          userId: null,
          username: cleanUsername,
          userRole: 'SYSTEM',
          action: 'QLDT_EXAM_SCHEDULE_CHANGED',
          targetType: 'EXAM_SCHEDULE',
          targetId: cleanUsername,
          description: `Phát hiện ${detectedDiffs.length} biến động trong lịch thi cá nhân từ Cổng QLDTTX`,
          metadata: { cleanUsername, changesCount: detectedDiffs.length, changes: detectedDiffs },
        }).catch(() => {});
      }
    }
  } catch (diffErr) {
    console.warn(`[getStudentQldtExamSchedule] Lỗi khi so sánh biến động lịch thi cho ${cleanUsername}:`, diffErr);
  }
}

export async function syncAndPersistStudentExamSchedule(params: {
  cleanUsername: string;
  extAccount: {
    id: number;
    extUsername?: string | null;
    extPassword?: string | null;
    token?: string | null;
  };
  cachedRecord: any;
  requestedSemesterId?: number;
}): Promise<StudentQldtExamScheduleResult> {
  const { cleanUsername, extAccount, cachedRecord, requestedSemesterId } = params;

  // 3.1 Lấy danh sách toàn bộ học kỳ từ Cổng QLDTTX
  const semRes = await fetchStudentExamSemestersFromQLDTTX({
    username: extAccount.extUsername || cleanUsername,
    password: extAccount.extPassword || undefined,
    token: extAccount.token,
  });

  const targetHocKy = requestedSemesterId || semRes.currentSemester || semRes.semesters[0]?.hocKy || 20251;
  const semestersToFetch =
    semRes.semesters && semRes.semesters.length > 0
      ? semRes.semesters
      : [{ hocKy: targetHocKy, tenHocKy: `Học kỳ ${targetHocKy}` }];

  // 3.2 Lấy chi tiết lịch thi cho TẤT CẢ các học kỳ
  const allExamsBySemester: Record<number, any[]> = {};
  const allRawExamsList: any[] = [];
  let currentToken = semRes.newToken || extAccount.token;
  let firstNoticeNoTuitionFee: string | undefined = undefined;

  for (const sem of semestersToFetch) {
    try {
      const examRes = await fetchStudentPersonalExamsFromQLDTTX({
        username: extAccount.extUsername || cleanUsername,
        password: extAccount.extPassword || undefined,
        token: currentToken,
        idHocKy: sem.hocKy,
      });

      if (examRes.newToken) {
        currentToken = examRes.newToken;
      }

      if (examRes.noticeNoTuitionFee && !firstNoticeNoTuitionFee) {
        firstNoticeNoTuitionFee = examRes.noticeNoTuitionFee;
      }

      const rawList = (examRes.exams || []).map((ex: any) => ({
        ...ex,
        hoc_ky: sem.hocKy,
        ten_hoc_ky: sem.tenHocKy,
      }));

      allExamsBySemester[sem.hocKy] = rawList;
      allRawExamsList.push(...rawList);
    } catch (semErr) {
      console.warn(`[getStudentQldtExamSchedule] Lỗi kéo lịch thi học kỳ ${sem.hocKy} cho ${cleanUsername}:`, semErr);
      allExamsBySemester[sem.hocKy] = [];
    }
  }

  if (currentToken && currentToken !== extAccount.token) {
    await prisma.externalAccount
      .update({
        where: { id: extAccount.id },
        data: {
          token: currentToken,
          lastSyncAt: new Date(),
          status: 'CONNECTED',
          syncMessage: 'Đồng bộ lịch thi thành công từ QLDTTX.',
        },
      })
      .catch(() => {});
  }

  const currentSemesterExams = allExamsBySemester[targetHocKy] || [];

  const payloadToStore = {
    semesters: semRes.semesters,
    examsBySemester: allExamsBySemester,
    allExams: allRawExamsList,
    exams: currentSemesterExams,
    currentSemester: targetHocKy,
    noticeNoTuitionFee: firstNoticeNoTuitionFee,
  };

  const resultObj = buildQldtExamResultFromRawData(
    cleanUsername,
    currentSemesterExams,
    targetHocKy,
    semRes.semesters,
    {
      isConfigured: true,
      isLiveSync: true,
      isCachedDb: false,
      lastSyncAt: new Date().toISOString(),
      noticeNoTuitionFee: firstNoticeNoTuitionFee,
    }
  );

  // 3.3 Phát hiện biến động lịch thi TOÀN BỘ CÁC MÔN so với cache cũ và gửi thông báo Telegram
  notifyExamScheduleChangesIfDetected(cleanUsername, cachedRecord, allRawExamsList, resultObj.semesterName);

  // 4. Lưu / Persist toàn bộ dữ liệu vào bảng StudentQldtExamRecord
  try {
    await prisma.studentQldtExamRecord.upsert({
      where: { username: cleanUsername },
      create: {
        username: cleanUsername,
        rawData: JSON.stringify(payloadToStore),
        semesterId: targetHocKy,
        semesterName: resultObj.semesterName,
        totalExams: allRawExamsList.length,
        lastPulledAt: new Date(),
      },
      update: {
        rawData: JSON.stringify(payloadToStore),
        semesterId: targetHocKy,
        semesterName: resultObj.semesterName,
        totalExams: allRawExamsList.length,
        lastPulledAt: new Date(),
      },
    });
  } catch (saveErr) {
    console.error('[getStudentQldtExamSchedule] Lưu StudentQldtExamRecord thất bại:', saveErr);
  }

  return resultObj;
}
