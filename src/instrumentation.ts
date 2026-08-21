export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startTelegramScheduler } = await import('@/src/features/telegram/server/telegramScheduler');
    startTelegramScheduler();
  }
}
