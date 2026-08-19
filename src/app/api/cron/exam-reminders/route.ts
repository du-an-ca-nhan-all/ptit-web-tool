import { NextRequest, NextResponse } from 'next/server';
import { runExamScheduleReminders } from '@/src/lib/telegram-dispatcher';
import { logActivity } from '@/src/lib/activityLog';

// GET /api/cron/exam-reminders (Dành cho Vercel Cron, GitHub Actions, external cron hoặc Admin gọi)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const forceAll = searchParams.get('force') === 'true';
    const targetDateStr = searchParams.get('date') || undefined;

    const result = await runExamScheduleReminders({ forceAll, targetDateStr });

    await logActivity({
      req,
      action: 'CRON_EXAM_REMINDERS',
      targetType: 'TELEGRAM_GLOBAL_CONFIG',
      targetId: 'CRON_REMINDERS',
      description: `Chạy quét nhắc lịch thi tự động (Trước 1 ngày: ${result.reminders1DaySent} ca, Hôm thi 7h sáng: ${result.remindersSameDaySent} ca)`,
      metadata: result,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('CRON exam-reminders error:', err);
    return NextResponse.json({ error: err.message || 'Lỗi xử lý nhắc lịch thi' }, { status: 500 });
  }
}

// POST /api/cron/exam-reminders
export async function POST(req: NextRequest) {
  return GET(req);
}
