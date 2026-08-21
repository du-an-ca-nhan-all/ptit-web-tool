import { NextResponse } from 'next/server';
import { startTelegramScheduler, runTelegramSchedulerTasks } from '@/src/features/telegram/server/telegramScheduler';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    startTelegramScheduler();
    const results = await runTelegramSchedulerTasks();

    return NextResponse.json({
      success: true,
      message: 'Đã kích hoạt và chạy trình quét Telegram thành công',
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Lỗi khi chạy trình quét Telegram' },
      { status: 500 }
    );
  }
}
