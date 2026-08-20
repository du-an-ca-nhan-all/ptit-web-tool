export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 1. Khởi động Telegram background scheduler
    const { startTelegramScheduler } = await import('./lib/telegram-scheduler');
    startTelegramScheduler();

    // 2. Khởi tạo / kiểm tra database seed một lần duy nhất lúc server boot
    const { ensureDatabaseSeeded } = await import('./lib/dbSeeder');
    ensureDatabaseSeeded(false).catch((err) => {
      console.warn('[Instrumentation] DB Seed initial verification warning:', err?.message || err);
    });
  }
}
