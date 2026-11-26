import {
  getGlobalConfig,
  setGlobalConfig,
  GlobalNightlySyncConfigValue,
  GLOBAL_CONFIG_KEYS,
} from '@/src/lib/globalConfig';
import { getNormalizedGlobalSyncConfig, isJobDueToRun } from './config';
import { enqueueSingleGlobalJobType } from './enqueue';
import { checkAndQueueTodayExamsSync } from './todayExamsSync';

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

    // 5. Job 5: Đồng bộ Kết quả học tập PTIT S-Link (Cấu hình giờ chạy riêng: config.slinkGradesJob - Mặc định 23:00 đêm VN)
    if (config.slinkGradesJob && isJobDueToRun(config.slinkGradesJob, currentHour, currentMinute, currentDateStr)) {
      console.log(`⏰ [Global Job Scheduler] Kích hoạt Job 5 (Điểm S-Link) lúc ${config.slinkGradesJob.scheduleTime} VN...`);
      const resSlinkGrades = await enqueueSingleGlobalJobType({
        jobType: 'SYNC_SLINK_GRADES',
        title: `Tự động đồng bộ Điểm S-Link (${config.slinkGradesJob.scheduleTime} ${currentDateStr})`,
        triggeredBy: 'SYSTEM_CRON',
        scheduledTime: config.slinkGradesJob.scheduleTime,
      });
      batchesCreated.push(resSlinkGrades);
      config.slinkGradesJob.lastSyncDate = currentDateStr;
      config.slinkGradesJob.lastSyncAt = new Date().toISOString();
      config.slinkGradesJob.lastStatus = resSlinkGrades.success ? 'SUCCESS' : 'FAILED';
      configModified = true;
    }

    // 6. Job 6: Đồng bộ Thông tin cá nhân Sinh viên QLHT (Cấu hình giờ chạy riêng: config.profileJob - Mặc định 22:30 đêm VN)
    if (config.profileJob && isJobDueToRun(config.profileJob, currentHour, currentMinute, currentDateStr)) {
      console.log(`⏰ [Global Job Scheduler] Kích hoạt Job 6 (Hồ sơ SV QLHT) lúc ${config.profileJob.scheduleTime} VN...`);
      const resProfile = await enqueueSingleGlobalJobType({
        jobType: 'SYNC_PROFILE',
        title: `Tự động đồng bộ Hồ sơ SV QLHT (${config.profileJob.scheduleTime} ${currentDateStr})`,
        triggeredBy: 'SYSTEM_CRON',
        scheduledTime: config.profileJob.scheduleTime,
      });
      batchesCreated.push(resProfile);
      config.profileJob.lastSyncDate = currentDateStr;
      config.profileJob.lastSyncAt = new Date().toISOString();
      config.profileJob.lastStatus = resProfile.success ? 'SUCCESS' : 'FAILED';
      configModified = true;
    }

    // 6. Kiểm tra và quét các ca thi diễn ra HÔM NAY (random 20..30 phút/lần cho từng sinh viên)
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
