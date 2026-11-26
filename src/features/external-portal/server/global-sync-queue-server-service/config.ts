import { GlobalNightlySyncConfigValue } from '@/src/lib/globalConfig';

/**
 * Chuẩn hóa cấu hình Global Job Scheduler (Đảm bảo mỗi Job có cấu hình giờ chạy riêng)
 */
export function getNormalizedGlobalSyncConfig(
  rawConfig?: GlobalNightlySyncConfigValue | null
): GlobalNightlySyncConfigValue {
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
    slinkGradesJob: {
      isEnabled: rawConfig?.slinkGradesJob?.isEnabled ?? true,
      scheduleTime: rawConfig?.slinkGradesJob?.scheduleTime || '23:00', // 23h đêm hàng ngày
      lastSyncDate: rawConfig?.slinkGradesJob?.lastSyncDate || null,
      lastSyncAt: rawConfig?.slinkGradesJob?.lastSyncAt || null,
      lastStatus: rawConfig?.slinkGradesJob?.lastStatus || null,
    },
    profileJob: {
      isEnabled: rawConfig?.profileJob?.isEnabled ?? true,
      scheduleTime: rawConfig?.profileJob?.scheduleTime || '22:30', // 22h30 đêm hàng ngày
      lastSyncDate: rawConfig?.profileJob?.lastSyncDate || null,
      lastSyncAt: rawConfig?.profileJob?.lastSyncAt || null,
      lastStatus: rawConfig?.profileJob?.lastStatus || null,
    },
    customJobs: rawConfig?.customJobs || {},
  };
}

export interface IsJobDueToRunParams {
  jobConfig: { isEnabled: boolean; scheduleTime: string; lastSyncDate?: string | null };
  currentHour: number;
  currentMinute: number;
  currentDateStr: string;
}

/**
 * Kiểm tra xem 1 Job đã đến giờ chạy theo cấu hình riêng của nó hay chưa
 */
export function isJobDueToRun(params: IsJobDueToRunParams): boolean {
  const { jobConfig, currentHour, currentMinute, currentDateStr } = params;
  if (jobConfig.isEnabled === false) return false;
  if (jobConfig.lastSyncDate === currentDateStr) return false;

  const [targetHourStr, targetMinuteStr] = (jobConfig.scheduleTime || '22:00').split(':');
  const targetHour = parseInt(targetHourStr || '22', 10);
  const targetMinute = parseInt(targetMinuteStr || '0', 10);

  return currentHour > targetHour || (currentHour === targetHour && currentMinute >= targetMinute);
}
