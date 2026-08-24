import { prisma } from '@/src/lib/prisma';
import { getStudentTimetableCalendar } from './studentTimetableServerService';
import { getStudentGrades } from './studentGradesServerService';
import { getOrFetchStudentLmsOverview } from './lmsServerService';
import { getStudentQldtExamSchedule } from './studentExamScheduleServerService';
import {
  getGlobalConfig,
  setGlobalConfig,
  GlobalNightlySyncConfigValue,
  GLOBAL_CONFIG_KEYS,
} from '@/src/lib/globalConfig';
import { sendTelegramMessage, getSystemTelegramBotConfig } from '@/src/features/telegram/server/telegramServerService';

import {
  GlobalJobType,
  EnqueueGlobalSyncOptions,
  GLOBAL_JOB_DEFINITIONS,
} from '../types/globalSyncQueue.types';

export type { GlobalJobType, EnqueueGlobalSyncOptions };
export { GLOBAL_JOB_DEFINITIONS };

/**
 * Đưa tác vụ Global Sync vào hàng đợi (Queue) xử lý ngầm
 */
export async function enqueueGlobalSyncJob(options: EnqueueGlobalSyncOptions) {
  const triggeredBy = options.triggeredBy || 'ADMIN_MANUAL';
  const scheduledTime = options.scheduledTime || '22:00';

  // Nếu chọn SYNC_ALL -> Tách thành 4 batches riêng biệt
  if (options.jobType === 'SYNC_ALL') {
    const resTimetable = await enqueueSingleGlobalJobType({
      ...options,
      jobType: 'SYNC_TIMETABLE',
      title: options.title ? `${options.title} - Lịch học` : undefined,
    });
    const resGrades = await enqueueSingleGlobalJobType({
      ...options,
      jobType: 'SYNC_GRADES',
      title: options.title ? `${options.title} - Bảng điểm` : undefined,
    });
    const resLms = await enqueueSingleGlobalJobType({
      ...options,
      jobType: 'SYNC_LMS',
      title: options.title ? `${options.title} - LMS` : undefined,
    });
    const resExams = await enqueueSingleGlobalJobType({
      ...options,
      jobType: 'SYNC_EXAMS',
      title: options.title ? `${options.title} - Lịch thi` : undefined,
    });

    return {
      success: true,
      message: `Đã đưa 4 đợt đồng bộ (Lịch học, Điểm số, LMS, Lịch thi) vào hàng đợi ngầm.`,
      batches: [resTimetable, resGrades, resLms, resExams],
      totalItems:
        (resTimetable.totalItems || 0) +
        (resGrades.totalItems || 0) +
        (resLms.totalItems || 0) +
        (resExams.totalItems || 0),
    };
  }

  return await enqueueSingleGlobalJobType(options);
}

/**
 * Đưa 1 loại tác vụ đơn lẻ vào Queue
 */
async function enqueueSingleGlobalJobType(options: EnqueueGlobalSyncOptions) {
  const jobDef = GLOBAL_JOB_DEFINITIONS[options.jobType] || GLOBAL_JOB_DEFINITIONS.SYNC_TIMETABLE;
  const triggeredBy = options.triggeredBy || 'ADMIN_MANUAL';
  const scheduledTime = options.scheduledTime || '22:00';
  const isLmsJob = options.jobType === 'SYNC_LMS';

  // 1. Xác định danh sách sinh viên mục tiêu theo từng loại hệ thống liên kết:
  // - SYNC_TIMETABLE & SYNC_GRADES: Chỉ lấy những ai ĐÃ LIÊN KẾT Cổng Quản Lý Đào Tạo (QLDTTX / QLHT)
  // - SYNC_LMS: Chỉ lấy những ai ĐÃ LIÊN KẾT Cổng LMS PTTC1
  let extAccounts = await prisma.externalAccount.findMany({
    where: isLmsJob
      ? {
          OR: [
            { systemKey: 'LMS_PTTC1' },
            { systemUrl: { contains: 'lms.pttc1.edu.vn' } },
          ],
        }
      : {
          systemKey: 'QLDTTX_PTTC1',
        },
    select: {
      username: true,
      extUsername: true,
      extPassword: true,
      token: true,
    },
  });

  // Lọc chỉ giữ các tài khoản có mật khẩu hoặc token (đã cấu hình hợp lệ)
  extAccounts = extAccounts.filter((acc) => (acc.extPassword && acc.extPassword.trim()) || acc.token);

  if (options.targetUsernames && options.targetUsernames.length > 0) {
    const targetSet = new Set(options.targetUsernames.map((u) => u.trim().toUpperCase()));
    extAccounts = extAccounts.filter((acc) => targetSet.has(acc.username.toUpperCase()));
  }

  if (extAccounts.length === 0) {
    return {
      success: false,
      message: isLmsJob
        ? 'Không có sinh viên nào đã liên kết tài khoản LMS PTTC1 để thực hiện đồng bộ.'
        : 'Không có sinh viên nào đã liên kết tài khoản Cổng Quản Lý Đào Tạo (QLDTTX/QLHT) để thực hiện đồng bộ.',
      totalItems: 0,
      batchId: null,
    };
  }

  // 2. Lấy thông tin họ tên sinh viên
  const usernames = Array.from(new Set(extAccounts.map((a) => a.username.toUpperCase())));
  const studentsInfo = await prisma.student.findMany({
    where: { maSV: { in: usernames } },
    select: { maSV: true, hoTen: true, hoLot: true, ten: true },
  });

  const nameMap = new Map<string, string>();
  studentsInfo.forEach((st) => {
    const fullName = st.hoTen || `${st.hoLot || ''} ${st.ten || ''}`.trim() || st.maSV;
    nameMap.set(st.maSV.toUpperCase(), fullName);
  });

  // 3. Tạo Batch mới
  const nowVN = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const dateStr = `${nowVN.getDate()}/${nowVN.getMonth() + 1}/${nowVN.getFullYear()}`;
  const actionTitle =
    options.title ||
    `${jobDef.name} (${scheduledTime ? `${scheduledTime} ` : ''}${dateStr})`;

  const batch = await prisma.globalSyncBatch.create({
    data: {
      jobType: options.jobType,
      title: actionTitle,
      triggeredBy,
      scheduledTime,
      totalItems: usernames.length,
      pendingCount: usernames.length,
      status: 'PENDING',
    },
  });

  // 4. Tạo các Queue Items cho từng sinh viên
  const queueData = usernames.map((uname) => ({
    batchId: batch.id,
    username: uname,
    studentName: nameMap.get(uname) || uname,
    jobType: options.jobType,
    status: 'QUEUED',
  }));

  await prisma.globalSyncQueueItem.createMany({
    data: queueData,
  });

  // 5. Kích hoạt Background Queue Worker
  setImmediate(() => {
    processGlobalSyncQueue(batch.id).catch((err) => {
      console.error('[GlobalSyncQueueWorker] Lỗi xử lý hàng đợi ngầm:', err);
    });
  });

  return {
    success: true,
    message: `Đã đưa ${usernames.length} sinh viên vào Hàng Đợi [${jobDef.shortName}] (Batch ID: ${batch.id})`,
    batchId: batch.id,
    jobType: options.jobType,
    totalItems: usernames.length,
  };
}

/**
 * Tự động quét và phục hồi các tác vụ bị kẹt ở trạng thái RUNNING trong Global Sync Queue
 * (Xảy ra khi server/app bị tắt đột ngột, khởi động lại hoặc crash trong lúc đang chạy)
 */
export async function recoverStuckGlobalSyncQueueItems(options?: {
  batchId?: string;
  maxStuckMinutes?: number;
  autoResumeWorker?: boolean;
}) {
  const whereClause: any = {
    status: 'RUNNING',
  };

  if (options?.batchId) whereClause.batchId = options.batchId;
  if (options?.maxStuckMinutes && options.maxStuckMinutes > 0) {
    const cutoff = new Date(Date.now() - options.maxStuckMinutes * 60 * 1000);
    whereClause.OR = [
      { startedAt: { lte: cutoff } },
      { startedAt: null },
    ];
  }

  const stuckItems = await prisma.globalSyncQueueItem.findMany({
    where: whereClause,
    select: { id: true, batchId: true, attempts: true, maxAttempts: true },
  });

  let recoveredCount = 0;
  let failedCount = 0;

  if (stuckItems.length > 0) {
    const toQueueIds: string[] = [];
    const toFailIds: string[] = [];

    for (const item of stuckItems) {
      if (item.attempts >= item.maxAttempts) {
        toFailIds.push(item.id);
        failedCount++;
      } else {
        toQueueIds.push(item.id);
        recoveredCount++;
      }
    }

    if (toFailIds.length > 0) {
      await prisma.globalSyncQueueItem.updateMany({
        where: { id: { in: toFailIds } },
        data: {
          status: 'FAILED',
          resultMessage: 'Tác vụ bị gián đoạn do ứng dụng bị tắt / khởi động lại (đã vượt quá số lần thử)',
          finishedAt: new Date(),
        },
      });
    }

    if (toQueueIds.length > 0) {
      await prisma.globalSyncQueueItem.updateMany({
        where: { id: { in: toQueueIds } },
        data: {
          status: 'QUEUED',
          startedAt: null,
          resultMessage: 'Được phục hồi vào hàng đợi sau khi ứng dụng khởi động lại',
        },
      });
    }

    const affectedBatchIds = [...new Set(stuckItems.map((i) => i.batchId))];
    for (const bId of affectedBatchIds) {
      await recalculateGlobalBatchCounts(bId);
    }
  }

  // Tự động kích hoạt worker chạy tiếp nếu có bất kỳ item nào đang QUEUED và worker chưa chạy
  if (options?.autoResumeWorker !== false) {
    const queuedCount = await prisma.globalSyncQueueItem.count({
      where: {
        status: 'QUEUED',
        ...(options?.batchId ? { batchId: options.batchId } : {}),
      },
    });

    if (queuedCount > 0 && !isGlobalSyncWorkerRunning) {
      setImmediate(() => {
        processGlobalSyncQueue(options?.batchId).catch((err) => {
          console.error('[GlobalSyncQueue] Error auto-resuming worker after recovery:', err);
        });
      });
    }
  }

  return { recoveredCount, failedCount, totalStuck: stuckItems.length };
}

/**
 * Worker chạy ngầm xử lý các tác vụ trong Hàng Đợi Global Sync
 */
let isGlobalSyncWorkerRunning = false;

export async function processGlobalSyncQueue(specificBatchId?: string) {
  if (isGlobalSyncWorkerRunning) {
    return { status: 'ALREADY_RUNNING' };
  }

  // Tự động phục hồi các item bị kẹt RUNNING từ lần chạy trước / do server restart
  try {
    await recoverStuckGlobalSyncQueueItems({
      batchId: specificBatchId,
      autoResumeWorker: false,
    });
  } catch (recoverErr) {
    console.error('[GlobalSyncQueueWorker] Error recovering stuck items before starting:', recoverErr);
  }

  isGlobalSyncWorkerRunning = true;
  const CONCURRENCY = 2; // Xử lý 2 sinh viên cùng lúc để tránh nghẽn & tránh bị chặn IP
  const DELAY_BETWEEN_CHUNKS_MS = 600; // Nghỉ 600ms giữa các chunk

  try {
    let hasMore = true;

    while (hasMore) {
      // 1. Lấy các item đang QUEUED theo thứ tự thời gian tạo (FIFO)
      const queuedItems = await prisma.globalSyncQueueItem.findMany({
        where: {
          status: 'QUEUED',
          ...(specificBatchId ? { batchId: specificBatchId } : {}),
        },
        take: CONCURRENCY,
        orderBy: { createdAt: 'asc' },
        include: { batch: true },
      });

      if (queuedItems.length === 0) {
        hasMore = false;
        break;
      }

      // Đánh dấu chuyển sang RUNNING và tăng số lần thử (attempts)
      const itemIds = queuedItems.map((i) => i.id);
      await prisma.globalSyncQueueItem.updateMany({
        where: { id: { in: itemIds } },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
          attempts: { increment: 1 },
        },
      });

      // Cập nhật trạng thái Batch liên quan
      const batchIds = [...new Set(queuedItems.map((i) => i.batchId))];
      await prisma.globalSyncBatch.updateMany({
        where: { id: { in: batchIds }, status: 'PENDING' },
        data: { status: 'PROCESSING', startedAt: new Date() },
      });

      // 2. Chạy đồng thời cho từng item trong chunk
      await Promise.all(
        queuedItems.map(async (item) => {
          await processSingleGlobalSyncItem(item);
        })
      );

      // Cập nhật lại thống kê số lượng cho các batch
      for (const bId of batchIds) {
        await recalculateGlobalBatchCounts(bId);
      }

      // Nghỉ nhẹ giữa các chunk
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_CHUNKS_MS));
    }
  } catch (err) {
    console.error('[GlobalSyncQueueWorker] Fatal error:', err);
  } finally {
    isGlobalSyncWorkerRunning = false;
  }

  return { status: 'DONE' };
}

/**
 * Xử lý 1 tác vụ đơn lẻ của sinh viên trong Global Queue
 */
async function processSingleGlobalSyncItem(item: any) {
  const normUsername = item.username.toUpperCase();
  const jobType = item.jobType as GlobalJobType;
  const isLmsJob = jobType === 'SYNC_LMS';

  // Kiểm tra tài khoản ExternalAccount tương ứng với loại Job:
  // - SYNC_TIMETABLE & SYNC_GRADES: Cần tài khoản QLDTTX (qlht)
  // - SYNC_LMS: Cần tài khoản LMS PTTC1
  const extAcc = await prisma.externalAccount.findFirst({
    where: isLmsJob
      ? {
          username: normUsername,
          OR: [
            { systemKey: 'LMS_PTTC1' },
            { systemUrl: { contains: 'lms.pttc1.edu.vn' } },
          ],
        }
      : {
          username: normUsername,
          systemKey: 'QLDTTX_PTTC1',
        },
  });

  if (!extAcc || (!extAcc.extPassword && !extAcc.token)) {
    const msg = isLmsJob
      ? 'Bỏ qua: Sinh viên chưa liên kết tài khoản Hệ thống học tập trực tuyến (LMS PTTC1)'
      : 'Bỏ qua: Sinh viên chưa liên kết tài khoản Cổng Quản Lý Đào Tạo (QLDTTX / QLHT)';
    await prisma.globalSyncQueueItem.update({
      where: { id: item.id },
      data: {
        status: 'SKIPPED',
        resultMessage: msg,
        finishedAt: new Date(),
      },
    });
    return;
  }

  try {
    // 1. TÁC VỤ 1: ĐỒNG BỘ LỊCH HỌC & THỜI KHÓA BIỂU
    if (jobType === 'SYNC_TIMETABLE') {
      const res = await getStudentTimetableCalendar(normUsername, { forceRefresh: true });
      if (res.success) {
        const msg = `Đã đồng bộ thành công ${res.totalEvents} buổi học (${res.uniqueSubjectsCount} môn)`;
        await prisma.globalSyncQueueItem.update({
          where: { id: item.id },
          data: {
            status: 'SUCCESS',
            resultMessage: msg,
            resultData: JSON.stringify({
              totalEvents: res.totalEvents,
              uniqueSubjectsCount: res.uniqueSubjectsCount,
              totalCredits: res.totalCredits,
            }),
            finishedAt: new Date(),
          },
        });
      } else {
        await prisma.globalSyncQueueItem.update({
          where: { id: item.id },
          data: {
            status: res.errorType === 'NOT_CONFIGURED' ? 'SKIPPED' : 'FAILED',
            resultMessage: res.error || 'Lỗi khi kéo lịch học từ Cổng QLDTTX',
            finishedAt: new Date(),
          },
        });
      }
    }

    // 2. TÁC VỤ 2: ĐỒNG BỘ BẢNG ĐIỂM & KẾT QUẢ HỌC TẬP
    else if (jobType === 'SYNC_GRADES') {
      const res = await getStudentGrades(normUsername, { forceRefresh: true });
      if (res.success) {
        const gpa10Str = res.summary.gpa10 !== null ? res.summary.gpa10.toFixed(2) : 'N/A';
        const gpa4Str = res.summary.gpa4 !== null ? res.summary.gpa4.toFixed(2) : 'N/A';
        const msg = `Đã đồng bộ GPA 10: ${gpa10Str} | GPA 4: ${gpa4Str} (${res.summary.totalPassedCredits} TC đạt / ${res.summary.totalCreditsRegistered} TC)`;
        await prisma.globalSyncQueueItem.update({
          where: { id: item.id },
          data: {
            status: 'SUCCESS',
            resultMessage: msg,
            resultData: JSON.stringify({
              gpa10: res.summary.gpa10,
              gpa4: res.summary.gpa4,
              totalPassedCredits: res.summary.totalPassedCredits,
              totalSubjects: res.summary.totalSubjects,
              classification: res.summary.classification,
            }),
            finishedAt: new Date(),
          },
        });
      } else {
        await prisma.globalSyncQueueItem.update({
          where: { id: item.id },
          data: {
            status: res.errorType === 'NOT_CONFIGURED' ? 'SKIPPED' : 'FAILED',
            resultMessage: res.error || 'Lỗi khi kéo bảng điểm từ Cổng QLDTTX',
            finishedAt: new Date(),
          },
        });
      }
    }

    // 3. TÁC VỤ 3: ĐỒNG BỘ KẾT QUẢ HỌC TẬP LMS PTTC1
    else if (jobType === 'SYNC_LMS') {
      const res = await getOrFetchStudentLmsOverview(normUsername, { forceRefresh: true });
      const enrolled = res.stats?.enrolledCourses ?? res.courses?.length ?? 0;
      const completedAct = res.stats?.completedActivities ?? 0;
      const completedCourses = res.stats?.completedCourses ?? 0;
      const msg = `Đã đồng bộ ${enrolled} khóa học LMS (${completedCourses} hoàn thành, ${completedAct} hoạt động xong)`;

      await prisma.globalSyncQueueItem.update({
        where: { id: item.id },
        data: {
          status: 'SUCCESS',
          resultMessage: msg,
          resultData: JSON.stringify({
            enrolledCourses: enrolled,
            completedCourses,
            completedActivities: completedAct,
          }),
          finishedAt: new Date(),
        },
      });
    }

    // 4. TÁC VỤ 4: ĐỒNG BỘ LỊCH THI CÁ NHÂN & QUÉT BIẾN ĐỘNG CA THI (QLDTTX)
    else if (jobType === 'SYNC_EXAMS' || jobType === 'SYNC_TODAY_EXAMS') {
      const res = await getStudentQldtExamSchedule(normUsername, { forceRefresh: true });
      if (res.success) {
        const isTodayJob = jobType === 'SYNC_TODAY_EXAMS';
        const msg = isTodayJob
          ? `Đã kiểm tra ca thi hôm nay (${res.totalExams} môn thi, ${res.upcomingExams.length} môn sắp diễn ra)`
          : `Đã đồng bộ ${res.totalExams} môn thi (${res.upcomingExams.length} môn sắp thi)`;

        await prisma.globalSyncQueueItem.update({
          where: { id: item.id },
          data: {
            status: 'SUCCESS',
            resultMessage: msg,
            resultData: JSON.stringify({
              totalExams: res.totalExams,
              upcomingExams: res.upcomingExams.length,
              pastExams: res.pastExams.length,
              semesterId: res.semesterId,
              isTodayJob,
            }),
            finishedAt: new Date(),
          },
        });
      } else {
        await prisma.globalSyncQueueItem.update({
          where: { id: item.id },
          data: {
            status: res.errorType === 'NOT_CONFIGURED' ? 'SKIPPED' : 'FAILED',
            resultMessage: res.error || 'Lỗi khi kéo lịch thi cá nhân từ Cổng QLDTTX',
            finishedAt: new Date(),
          },
        });
      }
    }
  } catch (err: any) {
    const errorMsg = err.message || 'Lỗi không xác định khi thực hiện đồng bộ';
    await prisma.globalSyncQueueItem.update({
      where: { id: item.id },
      data: {
        status: 'FAILED',
        attempts: (item.attempts || 0) + 1,
        resultMessage: errorMsg,
        finishedAt: new Date(),
      },
    });
  }
}

/**
 * Tính toán lại số lượng và trạng thái của Global Batch
 */
export async function recalculateGlobalBatchCounts(batchId: string) {
  const [
    total,
    queued,
    running,
    success,
    failed,
    cancelled,
    skipped,
  ] = await Promise.all([
    prisma.globalSyncQueueItem.count({ where: { batchId } }),
    prisma.globalSyncQueueItem.count({ where: { batchId, status: 'QUEUED' } }),
    prisma.globalSyncQueueItem.count({ where: { batchId, status: 'RUNNING' } }),
    prisma.globalSyncQueueItem.count({ where: { batchId, status: 'SUCCESS' } }),
    prisma.globalSyncQueueItem.count({ where: { batchId, status: 'FAILED' } }),
    prisma.globalSyncQueueItem.count({ where: { batchId, status: 'CANCELLED' } }),
    prisma.globalSyncQueueItem.count({ where: { batchId, status: 'SKIPPED' } }),
  ]);

  let status = 'PROCESSING';
  if (queued === 0 && running === 0) {
    if (total === 0) {
      status = 'COMPLETED';
    } else if (success === total || success + skipped === total) {
      status = 'COMPLETED';
    } else if (cancelled === total) {
      status = 'CANCELLED';
    } else if (failed === total) {
      status = 'FAILED';
    } else {
      status = 'COMPLETED'; // Hoàn tất có lỗi
    }
  } else if (running === 0 && queued === total) {
    status = 'PENDING';
  }

  const updatedBatch = await prisma.globalSyncBatch.update({
    where: { id: batchId },
    data: {
      totalItems: total,
      pendingCount: queued,
      processingCount: running,
      successCount: success,
      failedCount: failed,
      cancelledCount: cancelled,
      skippedCount: skipped,
      status,
      ...(status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED'
        ? { finishedAt: new Date() }
        : {}),
    },
  });

  return updatedBatch;
}

/**
 * Chuẩn hóa cấu hình Global Job Scheduler (Đảm bảo mỗi Job có cấu hình giờ chạy riêng)
 */
export function getNormalizedGlobalSyncConfig(rawConfig?: GlobalNightlySyncConfigValue | null): GlobalNightlySyncConfigValue {
  const isGlobalEnabled = rawConfig?.isEnabled !== false;
  const legacyTime = rawConfig?.scheduleTime || '22:00';

  return {
    isEnabled: isGlobalEnabled,
    concurrency: rawConfig?.concurrency || 2,
    delayBetweenItemsMs: rawConfig?.delayBetweenItemsMs || 600,
    notifyAdminTelegram: rawConfig?.notifyAdminTelegram ?? true,
    timetableJob: {
      isEnabled: rawConfig?.timetableJob?.isEnabled ?? (rawConfig?.syncTimetable !== false),
      scheduleTime: rawConfig?.timetableJob?.scheduleTime || legacyTime,
      lastSyncDate: rawConfig?.timetableJob?.lastSyncDate || rawConfig?.lastSyncDate || null,
      lastSyncAt: rawConfig?.timetableJob?.lastSyncAt || null,
      lastStatus: rawConfig?.timetableJob?.lastStatus || null,
    },
    gradesJob: {
      isEnabled: rawConfig?.gradesJob?.isEnabled ?? (rawConfig?.syncGrades !== false),
      scheduleTime: rawConfig?.gradesJob?.scheduleTime || legacyTime,
      lastSyncDate: rawConfig?.gradesJob?.lastSyncDate || rawConfig?.lastSyncDate || null,
      lastSyncAt: rawConfig?.gradesJob?.lastSyncAt || null,
      lastStatus: rawConfig?.gradesJob?.lastStatus || null,
    },
    lmsJob: {
      isEnabled: rawConfig?.lmsJob?.isEnabled ?? (rawConfig?.syncLms !== false),
      scheduleTime: rawConfig?.lmsJob?.scheduleTime || legacyTime,
      lastSyncDate: rawConfig?.lmsJob?.lastSyncDate || rawConfig?.lastSyncDate || null,
      lastSyncAt: rawConfig?.lmsJob?.lastSyncAt || null,
      lastStatus: rawConfig?.lmsJob?.lastStatus || null,
    },
    examsJob: {
      isEnabled: rawConfig?.examsJob?.isEnabled ?? (rawConfig?.syncExams !== false),
      scheduleTime: rawConfig?.examsJob?.scheduleTime || '07:00', // 7h sáng hàng ngày
      lastSyncDate: rawConfig?.examsJob?.lastSyncDate || null,
      lastSyncAt: rawConfig?.examsJob?.lastSyncAt || null,
      lastStatus: rawConfig?.examsJob?.lastStatus || null,
    },
    customJobs: rawConfig?.customJobs || {},
  };
}

/**
 * Kiểm tra xem 1 Job đã đến giờ chạy theo cấu hình riêng của nó hay chưa
 */
function isJobDueToRun(
  jobConfig: { isEnabled: boolean; scheduleTime: string; lastSyncDate?: string | null },
  currentHour: number,
  currentMinute: number,
  currentDateStr: string
): boolean {
  if (jobConfig.isEnabled === false) return false;
  if (jobConfig.lastSyncDate === currentDateStr) return false;

  const [targetHourStr, targetMinuteStr] = (jobConfig.scheduleTime || '22:00').split(':');
  const targetHour = parseInt(targetHourStr || '22', 10);
  const targetMinute = parseInt(targetMinuteStr || '0', 10);

  return currentHour > targetHour || (currentHour === targetHour && currentMinute >= targetMinute);
}

/**
 * Quét và kiểm tra các sinh viên có ca thi HÔM NAY.
 * Định kỳ 20 đến 30 phút (ngẫu nhiên hóa theo từng sinh viên) sẽ cho vào hàng đợi Global
 * để worker quét và kiểm tra dần dần (rate limit), tránh dồn ồ ạt lên máy chủ QLDTTX.
 */
export async function checkAndQueueTodayExamsSync(
  currentDateStr: string,
  nowVN: Date
): Promise<{ queuedCount: number; usernames: string[] }> {
  try {
    const d = String(nowVN.getDate()).padStart(2, '0');
    const m = String(nowVN.getMonth() + 1).padStart(2, '0');
    const y = nowVN.getFullYear();
    const todayVnStr = `${d}/${m}/${y}`;
    const todayIsoStr = currentDateStr; // YYYY-MM-DD

    // Lấy toàn bộ danh sách StudentQldtExamRecord đã lưu
    const allRecords = await prisma.studentQldtExamRecord.findMany({
      select: {
        username: true,
        rawData: true,
        lastPulledAt: true,
      },
    });

    const dueUsernames: string[] = [];

    for (const rec of allRecords) {
      if (!rec.rawData) continue;
      try {
        const parsed = JSON.parse(rec.rawData);
        const rawExams = parsed?.exams || parsed?.data?.ds_lich_thi || (Array.isArray(parsed) ? parsed : []) || [];

        // Kiểm tra xem sinh viên có môn thi hôm nay không
        const hasExamToday = rawExams.some((ex: any) => {
          const examDateStr = (ex.ngay_thi || ex.ngayThi || ex.NgayThi || '').trim();
          const examDateIso = (ex.dateIso || '').trim();
          return examDateStr === todayVnStr || examDateIso === todayIsoStr;
        });

        if (!hasExamToday) continue;

        // Tính chu kỳ quét ngẫu nhiên 20 đến 30 phút (phân bổ ngẫu nhiên theo hash username)
        let hash = 0;
        for (let i = 0; i < rec.username.length; i++) {
          hash = (hash << 5) - hash + rec.username.charCodeAt(i);
          hash |= 0;
        }
        const randomIntervalMinutes = 20 + (Math.abs(hash) % 11); // 20, 21, 22, ..., 30 phút
        const randomIntervalMs = randomIntervalMinutes * 60 * 1000;

        const lastPulledMs = rec.lastPulledAt ? new Date(rec.lastPulledAt).getTime() : 0;
        const timeSinceLastPull = Date.now() - lastPulledMs;

        if (timeSinceLastPull >= randomIntervalMs) {
          // Kiểm tra xem đã có task QUEUED hoặc RUNNING cho user này trong queue chưa
          const activeTask = await prisma.globalSyncQueueItem.findFirst({
            where: {
              username: rec.username,
              jobType: { in: ['SYNC_EXAMS', 'SYNC_TODAY_EXAMS'] },
              status: { in: ['QUEUED', 'RUNNING'] },
            },
          });

          if (!activeTask) {
            dueUsernames.push(rec.username);
          }
        }
      } catch {}
    }

    if (dueUsernames.length > 0) {
      console.log(
        `🔥 [Today Exams Sync] Phát hiện ${dueUsernames.length} sinh viên có ca thi hôm nay đến hạn quét lại (20-30 phút):`,
        dueUsernames
      );
      await enqueueSingleGlobalJobType({
        jobType: 'SYNC_TODAY_EXAMS',
        title: `Quét biến động ca thi hôm nay (${dueUsernames.length} SV có lịch thi)`,
        triggeredBy: 'SYSTEM_CRON',
        targetUsernames: dueUsernames,
      });
    }

    return { queuedCount: dueUsernames.length, usernames: dueUsernames };
  } catch (err: any) {
    console.error('[checkAndQueueTodayExamsSync] Lỗi quét ca thi hôm nay:', err);
    return { queuedCount: 0, usernames: [] };
  }
}

/**
 * Trình quét tự động chạy ngầm theo giờ hẹn riêng của từng Job (Giờ Việt Nam).
 * Tự động kiểm tra và tạo Batch cho từng Job: Lịch học, Điểm số, LMS, Lịch thi (7h sáng), hoặc ca thi hôm nay (20-30 phút).
 */
export async function runGlobalNightlySyncScheduler(): Promise<{ executed: boolean; reason?: string; batches?: any[] }> {
  try {
    const nowVN = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const currentHour = nowVN.getHours();
    const currentMinute = nowVN.getMinutes();
    const currentDateStr = `${nowVN.getFullYear()}-${String(nowVN.getMonth() + 1).padStart(2, '0')}-${String(nowVN.getDate()).padStart(2, '0')}`;

    const rawConfig = await getGlobalConfig<GlobalNightlySyncConfigValue>(GLOBAL_CONFIG_KEYS.GLOBAL_NIGHTLY_SYNC);
    const config = getNormalizedGlobalSyncConfig(rawConfig);

    if (!config.isEnabled) {
      return { executed: false, reason: 'Chế độ đồng bộ tự động toàn hệ thống đang TẮT' };
    }

    const batchesCreated: any[] = [];
    let configModified = false;

    // 1. Job 1: Đồng bộ lịch học & TKB (Cấu hình giờ chạy riêng: config.timetableJob)
    if (config.timetableJob && isJobDueToRun(config.timetableJob, currentHour, currentMinute, currentDateStr)) {
      console.log(`⏰ [Global Job Scheduler] Kích hoạt Job 1 (Lịch học) lúc ${config.timetableJob.scheduleTime} VN...`);
      const resTimetable = await enqueueSingleGlobalJobType({
        jobType: 'SYNC_TIMETABLE',
        title: `Tự động đồng bộ Lịch học (${config.timetableJob.scheduleTime} ${currentDateStr})`,
        triggeredBy: 'SYSTEM_CRON',
        scheduledTime: config.timetableJob.scheduleTime,
      });
      batchesCreated.push(resTimetable);
      config.timetableJob.lastSyncDate = currentDateStr;
      config.timetableJob.lastSyncAt = new Date().toISOString();
      config.timetableJob.lastStatus = resTimetable.success ? 'SUCCESS' : 'FAILED';
      configModified = true;
    }

    // 2. Job 2: Đồng bộ Điểm & GPA (Cấu hình giờ chạy riêng: config.gradesJob)
    if (config.gradesJob && isJobDueToRun(config.gradesJob, currentHour, currentMinute, currentDateStr)) {
      console.log(`⏰ [Global Job Scheduler] Kích hoạt Job 2 (Điểm số) lúc ${config.gradesJob.scheduleTime} VN...`);
      const resGrades = await enqueueSingleGlobalJobType({
        jobType: 'SYNC_GRADES',
        title: `Tự động đồng bộ Bảng điểm (${config.gradesJob.scheduleTime} ${currentDateStr})`,
        triggeredBy: 'SYSTEM_CRON',
        scheduledTime: config.gradesJob.scheduleTime,
      });
      batchesCreated.push(resGrades);
      config.gradesJob.lastSyncDate = currentDateStr;
      config.gradesJob.lastSyncAt = new Date().toISOString();
      config.gradesJob.lastStatus = resGrades.success ? 'SUCCESS' : 'FAILED';
      configModified = true;
    }

    // 3. Job 3: Đồng bộ Kết quả LMS (Cấu hình giờ chạy riêng: config.lmsJob)
    if (config.lmsJob && isJobDueToRun(config.lmsJob, currentHour, currentMinute, currentDateStr)) {
      console.log(`⏰ [Global Job Scheduler] Kích hoạt Job 3 (LMS) lúc ${config.lmsJob.scheduleTime} VN...`);
      const resLms = await enqueueSingleGlobalJobType({
        jobType: 'SYNC_LMS',
        title: `Tự động đồng bộ LMS (${config.lmsJob.scheduleTime} ${currentDateStr})`,
        triggeredBy: 'SYSTEM_CRON',
        scheduledTime: config.lmsJob.scheduleTime,
      });
      batchesCreated.push(resLms);
      config.lmsJob.lastSyncDate = currentDateStr;
      config.lmsJob.lastSyncAt = new Date().toISOString();
      config.lmsJob.lastStatus = resLms.success ? 'SUCCESS' : 'FAILED';
      configModified = true;
    }

    // 4. Job 4: Đồng bộ Lịch thi cá nhân QLDTTX (Cấu hình giờ chạy riêng: config.examsJob - Mặc định 07:00 sáng VN)
    if (config.examsJob && isJobDueToRun(config.examsJob, currentHour, currentMinute, currentDateStr)) {
      console.log(`⏰ [Global Job Scheduler] Kích hoạt Job 4 (Lịch thi 7h sáng) lúc ${config.examsJob.scheduleTime} VN...`);
      const resExams = await enqueueSingleGlobalJobType({
        jobType: 'SYNC_EXAMS',
        title: `Tự động đồng bộ Lịch thi (${config.examsJob.scheduleTime} ${currentDateStr})`,
        triggeredBy: 'SYSTEM_CRON',
        scheduledTime: config.examsJob.scheduleTime,
      });
      batchesCreated.push(resExams);
      config.examsJob.lastSyncDate = currentDateStr;
      config.examsJob.lastSyncAt = new Date().toISOString();
      config.examsJob.lastStatus = resExams.success ? 'SUCCESS' : 'FAILED';
      configModified = true;
    }

    // 5. Kiểm tra và quét các ca thi diễn ra HÔM NAY (random 20..30 phút/lần cho từng sinh viên)
    try {
      const todayScanRes = await checkAndQueueTodayExamsSync(currentDateStr, nowVN);
      if (todayScanRes.queuedCount > 0) {
        configModified = true;
      }
    } catch (todayErr) {
      console.error('[runGlobalNightlySyncScheduler] Lỗi kiểm tra ca thi hôm nay:', todayErr);
    }

    // Cập nhật cấu hình lưu trữ
    if (configModified) {
      await setGlobalConfig(
        GLOBAL_CONFIG_KEYS.GLOBAL_NIGHTLY_SYNC,
        config,
        'Cấu hình lịch tự động chạy cho từng Job Global (Lịch học, Điểm, LMS, Lịch thi)'
      );
    }

    if (batchesCreated.length === 0) {
      return {
        executed: false,
        reason: `Chưa có Job định kỳ nào đến giờ chạy (Hiện tại: ${currentHour}:${String(currentMinute).padStart(2, '0')} VN)`,
      };
    }

    return {
      executed: true,
      reason: `Đã kích hoạt thành công ${batchesCreated.length} Job tự động theo lịch hẹn riêng.`,
      batches: batchesCreated,
    };
  } catch (err: any) {
    console.error('[runGlobalNightlySyncScheduler] Lỗi:', err);
    return { executed: false, reason: err.message || 'Lỗi khi chạy trình quét đồng bộ' };
  }
}

/**
 * Lấy trạng thái hàng đợi và danh sách batches gần nhất
 */
export async function getGlobalSyncQueueStatus(options?: {
  batchId?: string;
  jobType?: string;
  limit?: number;
}) {
  const limit = options?.limit || 20;

  // Nếu worker không chạy nhưng có item RUNNING hoặc QUEUED, tự động khôi phục và tiếp tục chạy worker
  if (!isGlobalSyncWorkerRunning) {
    const activeCount = await prisma.globalSyncQueueItem.count({
      where: {
        ...(options?.batchId ? { batchId: options.batchId } : {}),
        status: { in: ['RUNNING', 'QUEUED'] },
      },
    });
    if (activeCount > 0) {
      await recoverStuckGlobalSyncQueueItems({
        batchId: options?.batchId,
        autoResumeWorker: true,
      });
    }
  }

  const [batches, activeBatch, queueItems, totalStats] = await Promise.all([
    prisma.globalSyncBatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(options?.jobType ? { where: { jobType: options.jobType } } : {}),
    }),
    options?.batchId
      ? prisma.globalSyncBatch.findUnique({ where: { id: options.batchId } })
      : prisma.globalSyncBatch.findFirst({ orderBy: { createdAt: 'desc' } }),
    prisma.globalSyncQueueItem.findMany({
      where: {
        ...(options?.batchId ? { batchId: options.batchId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.globalSyncQueueItem.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
  ]);

  const statsMap: Record<string, number> = {
    QUEUED: 0,
    RUNNING: 0,
    SUCCESS: 0,
    FAILED: 0,
    CANCELLED: 0,
    SKIPPED: 0,
  };

  totalStats.forEach((st) => {
    statsMap[st.status] = st._count.id;
  });

  const rawConfig = await getGlobalConfig<GlobalNightlySyncConfigValue>(GLOBAL_CONFIG_KEYS.GLOBAL_NIGHTLY_SYNC);
  const config = getNormalizedGlobalSyncConfig(rawConfig);

  return {
    batches,
    activeBatch,
    queueItems,
    stats: statsMap,
    isWorkerRunning: isGlobalSyncWorkerRunning,
    config,
  };
}

/**
 * Hủy các tác vụ đang chờ hoặc đang chạy trong Queue
 */
export async function cancelPendingGlobalQueue(batchId?: string) {
  const whereClause = {
    status: { in: ['QUEUED', 'RUNNING'] },
    ...(batchId ? { batchId } : {}),
  };

  const pendingItems = await prisma.globalSyncQueueItem.findMany({
    where: whereClause,
    select: { id: true, batchId: true },
  });

  if (pendingItems.length === 0) {
    return { cancelledCount: 0 };
  }

  const ids = pendingItems.map((i) => i.id);
  await prisma.globalSyncQueueItem.updateMany({
    where: { id: { in: ids } },
    data: {
      status: 'CANCELLED',
      resultMessage: 'Đã hủy theo yêu cầu của Quản trị viên',
      finishedAt: new Date(),
    },
  });

  const affectedBatchIds = [...new Set(pendingItems.map((i) => i.batchId))];
  for (const bId of affectedBatchIds) {
    await recalculateGlobalBatchCounts(bId);
  }

  return { cancelledCount: pendingItems.length };
}

/**
 * Thử lại các tác vụ bị lỗi trong Queue
 */
export async function retryFailedGlobalQueue(batchId?: string) {
  const whereClause = {
    status: { in: ['FAILED', 'CANCELLED'] },
    ...(batchId ? { batchId } : {}),
  };

  const failedItems = await prisma.globalSyncQueueItem.findMany({
    where: whereClause,
    select: { id: true, batchId: true },
  });

  if (failedItems.length === 0) {
    return { retriedCount: 0 };
  }

  const ids = failedItems.map((i) => i.id);
  await prisma.globalSyncQueueItem.updateMany({
    where: { id: { in: ids } },
    data: {
      status: 'QUEUED',
      resultMessage: 'Đang chờ thử lại trong hàng đợi...',
      finishedAt: null,
    },
  });

  const affectedBatchIds = [...new Set(failedItems.map((i) => i.batchId))];
  for (const bId of affectedBatchIds) {
    await recalculateGlobalBatchCounts(bId);
  }

  // Kích hoạt lại worker
  setImmediate(() => {
    processGlobalSyncQueue().catch(console.error);
  });

  return { retriedCount: failedItems.length };
}

/**
 * Xóa các batch đã hoàn thành
 */
export async function clearCompletedGlobalBatches() {
  const completedBatches = await prisma.globalSyncBatch.findMany({
    where: {
      status: { in: ['COMPLETED', 'CANCELLED', 'FAILED'] },
    },
    select: { id: true },
  });

  if (completedBatches.length === 0) {
    return { deletedCount: 0 };
  }

  const batchIds = completedBatches.map((b) => b.id);
  await prisma.globalSyncBatch.deleteMany({
    where: { id: { in: batchIds } },
  });

  return { deletedCount: batchIds.length };
}
