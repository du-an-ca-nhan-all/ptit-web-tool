import { prisma } from '@/src/lib/prisma';
import { getStudentTimetableCalendar } from './studentTimetableServerService';
import { getStudentGrades } from './studentGradesServerService';
import { getOrFetchStudentLmsOverview } from './lmsServerService';
import {
  getGlobalConfig,
  setGlobalConfig,
  GlobalNightlySyncConfigValue,
  GLOBAL_CONFIG_KEYS,
} from '@/src/lib/globalConfig';
import { sendTelegramMessage, getSystemTelegramBotConfig } from '@/src/features/telegram/server/telegramServerService';

export type GlobalJobType = 'SYNC_TIMETABLE' | 'SYNC_GRADES' | 'SYNC_LMS' | 'SYNC_ALL';

export interface EnqueueGlobalSyncOptions {
  jobType: GlobalJobType;
  title?: string;
  triggeredBy?: string; // 'SYSTEM_CRON' | 'ADMIN_MANUAL' | username
  targetUsernames?: string[];
  scheduledTime?: string;
}

/**
 * Định nghĩa nhãn & tiêu đề cho từng loại Job Global
 */
export const GLOBAL_JOB_DEFINITIONS: Record<
  string,
  { key: string; name: string; shortName: string; description: string; icon: string }
> = {
  SYNC_TIMETABLE: {
    key: 'SYNC_TIMETABLE',
    name: 'Đồng Bộ Lịch Học & Thời Khóa Biểu',
    shortName: 'Đồng bộ Lịch học',
    description: 'Kéo thời khóa biểu & lịch học cá nhân từ Cổng QLDTTX cho toàn bộ sinh viên',
    icon: 'Calendar',
  },
  SYNC_GRADES: {
    key: 'SYNC_GRADES',
    name: 'Đồng Bộ Điểm & Kết Quả Học Tập',
    shortName: 'Đồng bộ Điểm số',
    description: 'Kéo bảng điểm, điểm thành phần & GPA từ Cổng QLDTTX cho toàn bộ sinh viên',
    icon: 'GraduationCap',
  },
  SYNC_LMS: {
    key: 'SYNC_LMS',
    name: 'Đồng Bộ Kết Quả Học Tập LMS PTTC1',
    shortName: 'Đồng bộ LMS',
    description: 'Kéo danh sách khóa học, tiến độ % và điểm quá trình từ Cổng LMS PTTC1',
    icon: 'BookOpen',
  },
  SYNC_ALL: {
    key: 'SYNC_ALL',
    name: 'Đồng Bộ Toàn Diện (Lịch học + Điểm + LMS)',
    shortName: 'Đồng bộ Tất cả',
    description: 'Đồng bộ đồng thời cả 3 tác vụ: Lịch học, Điểm số và Khóa học LMS',
    icon: 'Layers',
  },
};

/**
 * Đưa tác vụ Global Sync vào hàng đợi (Queue) xử lý ngầm
 */
export async function enqueueGlobalSyncJob(options: EnqueueGlobalSyncOptions) {
  const triggeredBy = options.triggeredBy || 'ADMIN_MANUAL';
  const scheduledTime = options.scheduledTime || '22:00';

  // Nếu chọn SYNC_ALL -> Tách thành 3 batches riêng biệt
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

    return {
      success: true,
      message: `Đã đưa 3 đợt đồng bộ (Lịch học, Điểm số, LMS) vào hàng đợi ngầm.`,
      batches: [resTimetable, resGrades, resLms],
      totalItems:
        (resTimetable.totalItems || 0) +
        (resGrades.totalItems || 0) +
        (resLms.totalItems || 0),
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
 * Worker chạy ngầm xử lý các tác vụ trong Hàng Đợi Global Sync
 */
let isGlobalSyncWorkerRunning = false;

export async function processGlobalSyncQueue(specificBatchId?: string) {
  if (isGlobalSyncWorkerRunning) {
    return { status: 'ALREADY_RUNNING' };
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

      // Đánh dấu chuyển sang RUNNING
      const itemIds = queuedItems.map((i) => i.id);
      await prisma.globalSyncQueueItem.updateMany({
        where: { id: { in: itemIds } },
        data: { status: 'RUNNING', startedAt: new Date() },
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
 * Trình quét tự động chạy ngầm theo giờ hẹn riêng của từng Job (Giờ Việt Nam).
 * Tự động kiểm tra và tạo Batch cho từng Job: Lịch học, Điểm số, LMS, hoặc các Custom Job mở rộng.
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

    // Cập nhật cấu hình lưu trữ
    if (configModified) {
      await setGlobalConfig(
        GLOBAL_CONFIG_KEYS.GLOBAL_NIGHTLY_SYNC,
        config,
        'Cấu hình lịch tự động chạy cho từng Job Global (Lịch học, Điểm, LMS)'
      );
    }

    if (batchesCreated.length === 0) {
      return {
        executed: false,
        reason: `Chưa có Job nào đến giờ chạy (Hiện tại: ${currentHour}:${String(currentMinute).padStart(2, '0')} VN)`,
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
 * Hủy các tác vụ đang chờ trong Queue
 */
export async function cancelPendingGlobalQueue(batchId?: string) {
  const whereClause = {
    status: 'QUEUED',
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
