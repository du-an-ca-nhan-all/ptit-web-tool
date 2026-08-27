import { NextRequest, NextResponse } from 'next/server';
import { runGlobalNightlySyncScheduler } from '@/src/features/external-portal/server/globalSyncQueueServerService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { ACTIVITY_LOG_ACTIONS } from '@/src/features/activity-logs/types/activityLogActions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const result = await runGlobalNightlySyncScheduler();

    if (result && result.executed) {
      await logActivity({
        req,
        username: 'SYSTEM_CRON',
        userRole: 'system',
        action: ACTIVITY_LOG_ACTIONS.CRON_GLOBAL_SYNC_TRIGGER,
        targetType: 'GLOBAL_JOB',
        description: `Trình quét tự động Cron đã kích hoạt các tác vụ đồng bộ ban đêm (${result.reason})`,
        metadata: result,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã thực hiện kiểm tra lịch quét đồng bộ dữ liệu tự động',
      result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Lỗi khi kiểm tra trình quét đồng bộ ban đêm' },
      { status: 500 }
    );
  }
}
