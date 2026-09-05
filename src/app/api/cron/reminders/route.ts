import { NextResponse } from 'next/server';
import { runPendingReminderAlerts } from '@/src/features/reminders';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const results = await runPendingReminderAlerts();
    return NextResponse.json({
      success: true,
      message: 'Đã quét và phát thông báo nhắc hẹn thành công',
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Lỗi khi quét phát thông báo nhắc hẹn' },
      { status: 500 }
    );
  }
}
