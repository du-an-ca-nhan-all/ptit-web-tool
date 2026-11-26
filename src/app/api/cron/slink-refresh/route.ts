import { NextRequest, NextResponse } from 'next/server';
import { refreshAllSlinkTokensPeriodic } from '@/src/features/external-portal/server/slinkServerService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { ACTIVITY_LOG_ACTIONS } from '@/src/features/activity-logs/types/activityLogActions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/slink-refresh
 * Định kỳ gia hạn Access Token và Refresh Token cho tất cả tài khoản PTIT S-Link.
 * Query params:
 *   - force=true: Bắt buộc làm mới ngay cho tất cả tài khoản có refresh_token
 *   - interval=20: Khoảng thời gian tối thiểu (phút) giữa các lần gia hạn (mặc định 20 phút)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';
    const intervalParam = parseInt(searchParams.get('interval') || '20', 10);
    const minIntervalMinutes = Number.isFinite(intervalParam) && intervalParam > 0 ? intervalParam : 20;

    const result = await refreshAllSlinkTokensPeriodic({
      force,
      minIntervalMinutes,
    });

    if (result.refreshed > 0 || result.failed > 0) {
      await logActivity({
        req,
        username: 'SYSTEM_CRON',
        userRole: 'system',
        action: ACTIVITY_LOG_ACTIONS.CRON_SLINK_TOKEN_REFRESH,
        targetType: 'EXTERNAL_ACCOUNT',
        targetId: 'SLINK_PTIT',
        description: `Gia hạn định kỳ Token & Refresh Token PTIT S-Link: ${result.refreshed}/${result.total} thành công, ${result.skipped} bỏ qua, ${result.failed} lỗi`,
        metadata: result,
      }).catch((err) => console.warn("[route] Non-fatal async error:", err));
    }

    return NextResponse.json({
      success: true,
      message: `Đã kiểm tra gia hạn token PTIT S-Link (${result.refreshed} làm mới, ${result.skipped} chưa đến hạn, ${result.failed} lỗi)`,
      result,
    });
  } catch (err: any) {
    console.error('[Cron S-Link Refresh] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Lỗi khi gia hạn định kỳ token PTIT S-Link' },
      { status: 500 }
    );
  }
}
