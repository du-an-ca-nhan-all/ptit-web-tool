export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startTelegramScheduler, recoverAllStuckQueueJobs } = await import('@/src/features/telegram/server/telegramScheduler');
    
    // Tự động phục hồi các job bị kẹt RUNNING khi ứng dụng/server khởi động lại
    recoverAllStuckQueueJobs().catch((err) => {
      console.error('[Instrumentation] Error recovering stuck jobs on startup:', err);
    });

    startTelegramScheduler();
  }
}
