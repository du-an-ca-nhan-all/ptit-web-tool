import {
  runExamScheduleReminders,
  checkAndDispatchQldtAnnouncements,
  runClassScheduleReminders,
} from './telegram-dispatcher';
import { runDailyAutoBackupScheduler } from './backupService';

let isSchedulerRunning = false;

/**
 * Chạy tất cả các tác vụ Telegram 1 lần
 */
export async function runTelegramSchedulerTasks() {
  runExamScheduleReminders().catch((err) => {
    console.error('[Telegram Scheduler] Periodic exam reminders check error:', err);
  });
  checkAndDispatchQldtAnnouncements().catch((err) => {
    console.error('[Telegram Scheduler] Periodic QLDTTX announcements check error:', err);
  });
  runClassScheduleReminders().catch((err) => {
    console.error('[Telegram Scheduler] Periodic class schedule check error:', err);
  });
  runDailyAutoBackupScheduler().catch((err) => {
    console.error('[Telegram Scheduler] Periodic auto backup check error:', err);
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

  // Chạy định kỳ mỗi 5 phút
  setInterval(() => {
    runTelegramSchedulerTasks().catch(console.error);
  }, 5 * 60 * 1000);
}
