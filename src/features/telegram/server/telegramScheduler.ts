import {
  runExamScheduleReminders,
  checkAndDispatchQldtAnnouncements,
  checkAndDispatchSlinkAnnouncements,
  runClassScheduleReminders,
} from './telegramDispatcher';
import { runDailyAutoBackupScheduler } from '@/src/features/database-backup/server/backupServerService';
import {
  runGlobalNightlySyncScheduler,
  recoverStuckGlobalSyncQueueItems,
} from '@/src/features/external-portal/server/globalSyncQueueServerService';
import { recoverStuckFlowQueueItems } from '@/src/features/classes-monitor/server/monitorFlowQueueServerService';

let isSchedulerRunning = false;

/**
 * Tự động quét và phục hồi tất cả các tác vụ bị kẹt RUNNING ở tất cả các Queue
 * (Thường xảy ra khi app/server bị tắt đột ngột, crash hoặc khởi động lại)
 */
export async function recoverAllStuckQueueJobs(maxStuckMinutes?: number) {
  try {
    const [flowRes, globalRes] = await Promise.all([
      recoverStuckFlowQueueItems({ maxStuckMinutes, autoResumeWorker: true }),
      recoverStuckGlobalSyncQueueItems({ maxStuckMinutes, autoResumeWorker: true }),
    ]);

    const total = (flowRes?.totalStuck || 0) + (globalRes?.totalStuck || 0);
    if (total > 0) {
      console.log(
        `🔄 [QueueRecovery] Đã phục hồi ${total} tác vụ bị gián đoạn (Flow: ${flowRes.recoveredCount} re-queued, ${flowRes.failedCount} failed | Global: ${globalRes.recoveredCount} re-queued, ${globalRes.failedCount} failed)`
      );
    }
    return { flowRes, globalRes, total };
  } catch (err) {
    console.error('[QueueRecovery] Lỗi khi phục hồi các tác vụ bị kẹt:', err);
    return { error: err };
  }
}

/**
 * Chạy tất cả các tác vụ Scheduler & Telegram 1 lần
 */
export async function runTelegramSchedulerTasks() {
  // Quét phục hồi các tác vụ bị kẹt quá 5 phút
  recoverAllStuckQueueJobs(5).catch((err) => {
    console.error('[Telegram Scheduler] Periodic stuck jobs recovery error:', err);
  });

  runExamScheduleReminders().catch((err) => {
    console.error('[Telegram Scheduler] Periodic exam reminders check error:', err);
  });
  checkAndDispatchQldtAnnouncements().catch((err) => {
    console.error('[Telegram Scheduler] Periodic QLDTTX announcements check error:', err);
  });
  checkAndDispatchSlinkAnnouncements().catch((err) => {
    console.error('[Telegram Scheduler] Periodic S-Link announcements check error:', err);
  });
  runClassScheduleReminders().catch((err) => {
    console.error('[Telegram Scheduler] Periodic class schedule check error:', err);
  });
  runDailyAutoBackupScheduler().catch((err) => {
    console.error('[Telegram Scheduler] Periodic auto backup check error:', err);
  });
  runGlobalNightlySyncScheduler().catch((err) => {
    console.error('[Global Sync Scheduler] Periodic nightly sync check error:', err);
  });
}

/**
 * Khởi động background scheduler (chạy mỗi 5 phút và kích hoạt ngay lần đầu)
 */
export function startTelegramScheduler() {
  if (typeof window !== 'undefined') return;
  if (isSchedulerRunning || (globalThis as any).__telegramSchedulerStarted) {
    return;
  }

  (globalThis as any).__telegramSchedulerStarted = true;
  isSchedulerRunning = true;

  console.log('⏰ [Telegram Scheduler] Đã khởi động trình quét tự động (5 phút/lần)');

  // Chạy ngay lần đầu phục hồi các job bị kẹt
  recoverAllStuckQueueJobs().catch(console.error);

  // Chạy định kỳ mỗi 5 phút
  setInterval(() => {
    runTelegramSchedulerTasks().catch(console.error);
  }, 5 * 60 * 1000);
}
