import {
  runExamScheduleReminders,
  checkAndDispatchQldtAnnouncements,
  runClassScheduleReminders,
} from './telegram-dispatcher';
import { runDailyAutoBackupScheduler } from './backupService';

let isSchedulerRunning = false;

/**
 * Starts in-memory background cron worker for Next.js server runtime.
 * Automatically checks and sends exam reminders, QLDTTX announcements, class reminders, and daily 10:00 AM database backup.
 */
export function startTelegramScheduler() {
  if (typeof window !== 'undefined') return; // Only run on Node.js server
  if (isSchedulerRunning || (globalThis as any).__telegramSchedulerStarted) {
    return;
  }

  (globalThis as any).__telegramSchedulerStarted = true;
  isSchedulerRunning = true;

  console.log('⏰ [Telegram Scheduler] Khởi động trình quét tự động (Lịch thi, QLDTTX, Lịch học & Tự động sao lưu 10h sáng) trong tiến trình Node.js.');

  // Run initial check 15 seconds after server startup
  setTimeout(() => {
    runExamScheduleReminders().catch((err) => {
      console.error('[Telegram Scheduler] Initial exam reminders check error:', err);
    });
    checkAndDispatchQldtAnnouncements().catch((err) => {
      console.error('[Telegram Scheduler] Initial QLDTTX announcements check error:', err);
    });
    runClassScheduleReminders().catch((err) => {
      console.error('[Telegram Scheduler] Initial class schedule check error:', err);
    });
    runDailyAutoBackupScheduler().catch((err) => {
      console.error('[Telegram Scheduler] Initial auto backup check error:', err);
    });
  }, 15000);

  // Periodic check every 5 minutes (300,000 ms)
  setInterval(() => {
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
  }, 5 * 60 * 1000);
}
