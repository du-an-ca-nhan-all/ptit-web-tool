import { NextRequest, NextResponse } from 'next/server';
import {
  runClassScheduleReminders,
  dispatchNearestClassScheduleNotification,
} from '@/src/lib/telegram-dispatcher';
import { logActivity } from '@/src/lib/activityLog';

// GET /api/cron/class-reminders?type=nearest&days=10 OR /api/cron/class-reminders?force=true
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const username = searchParams.get('username') || undefined;
    const days = parseInt(searchParams.get('days') || '10', 10);
    const force = searchParams.get('force') === 'true';

    if (type === 'nearest') {
      const result = await dispatchNearestClassScheduleNotification({
        username,
        maxDays: isNaN(days) ? 10 : days,
        forceSend: force,
      });

      await logActivity({
        req,
        action: 'CRON_NEAREST_CLASS_SCHEDULE',
        targetType: 'TELEGRAM_GLOBAL_CONFIG',
        targetId: 'CRON_CLASS_NEAREST',
        description: `Chạy quét lịch học gần nhất trong ${days} ngày tới qua Cron API (Đã gửi: ${result.totalSent})`,
        metadata: result,
      });

      return NextResponse.json(result);
    }

    const result = await runClassScheduleReminders({
      username,
      forceCheck: force,
      forceMorningSummary: force,
      forcePreClassAlert: false,
    });

    await logActivity({
      req,
      action: 'CRON_CLASS_REMINDERS',
      targetType: 'TELEGRAM_GLOBAL_CONFIG',
      targetId: 'CRON_CLASS_REMINDERS',
      description: `Chạy quét nhắc lịch học định kỳ (Tổng hợp sáng: ${result.morningSummariesSent}, Nhắc trước giờ vào lớp: ${result.preClassAlertsSent})`,
      metadata: result,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('CRON class-reminders error:', err);
    return NextResponse.json({ error: err.message || 'Lỗi xử lý nhắc lịch học' }, { status: 500 });
  }
}

// POST /api/cron/class-reminders
export async function POST(req: NextRequest) {
  return GET(req);
}
