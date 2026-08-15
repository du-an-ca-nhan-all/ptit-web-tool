import { runExamScheduleReminders, checkAndDispatchQldtAnnouncements } from './telegram-dispatcher';

let isSchedulerRunning = false;

/**
 * Starts in-memory background cron worker for Next.js server runtime.
 * Automatically checks and sends exam reminders and QLDTTX announcements periodically.
 */
export function startTelegramScheduler() {
  if (typeof window !== 'undefined') return; // Only run on Node.js server
  if (isSchedulerRunning || (globalThis as any).__telegramSchedulerStarted) {
    return;
  }

  (globalThis as any).__telegramSchedulerStarted = true;
  isSchedulerRunning = true;

  console.log('⏰ [Telegram Scheduler] Khởi động trình quét nhắc lịch thi & thông báo QLDTTX tự động trong tiến trình Node.js.');

  // Run initial check 15 seconds after server startup
  setTimeout(() => {
    runExamScheduleReminders().catch((err) => {
      console.error('[Telegram Scheduler] Initial exam reminders check error:', err);
    });
    checkAndDispatchQldtAnnouncements().catch((err) => {
      console.error('[Telegram Scheduler] Initial QLDTTX announcements check error:', err);
    });
  }, 15000);

  // Periodic check every 15 minutes (900,000 ms)
  setInterval(() => {
    runExamScheduleReminders().catch((err) => {
      console.error('[Telegram Scheduler] Periodic exam reminders check error:', err);
    });
    checkAndDispatchQldtAnnouncements().catch((err) => {
      console.error('[Telegram Scheduler] Periodic QLDTTX announcements check error:', err);
    });
  }, 15 * 60 * 1000);
}
