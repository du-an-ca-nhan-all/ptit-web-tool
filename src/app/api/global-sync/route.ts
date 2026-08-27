import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import {
  enqueueGlobalSyncJob,
  processGlobalSyncQueue,
  getGlobalSyncQueueStatus,
  cancelPendingGlobalQueue,
  retryFailedGlobalQueue,
  clearCompletedGlobalBatches,
  runGlobalNightlySyncScheduler,
  recoverStuckGlobalSyncQueueItems,
} from '@/src/features/external-portal/server/globalSyncQueueServerService';
import { setGlobalConfig, GLOBAL_CONFIG_KEYS, GlobalNightlySyncConfigValue } from '@/src/lib/globalConfig';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { ACTIVITY_LOG_ACTIONS } from '@/src/features/activity-logs/types/activityLogActions';

async function getAuthUser(req: NextRequest) {
  let authUser = await getCurrentUserFromCookie();
  if (!authUser) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      authUser = await verifyAuthToken(token);
    }
  }
  return authUser;
}

// GET /api/global-sync
// Lấy trạng thái hàng đợi đồng bộ toàn hệ thống và cấu hình đồng bộ ban đêm
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để truy cập' }, { status: 401 });
    }

    if (!authUser.isAdmin) {
      return NextResponse.json({ error: 'Chỉ Quản trị viên (Admin) mới có quyền xem Hàng đợi Global' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId') || undefined;
    const jobType = searchParams.get('jobType') || undefined;
    const limit = Number(searchParams.get('limit')) || 30;

    const data = await getGlobalSyncQueueStatus({
      batchId,
      jobType,
      limit,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('GET /api/global-sync error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi tải trạng thái hàng đợi Global' }, { status: 500 });
  }
}

// POST /api/global-sync
// Đưa tác vụ vào queue (ENQUEUE) hoặc quản lý (TRIGGER_NIGHTLY | PROCESS_NEXT | CANCEL_PENDING | RETRY_FAILED | CLEAR_COMPLETED | UPDATE_CONFIG)
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện' }, { status: 401 });
    }

    if (!authUser.isAdmin) {
      return NextResponse.json({ error: 'Chỉ Quản trị viên (Admin) mới có quyền thao tác Hàng đợi Global' }, { status: 403 });
    }

    const body = await req.json();
    const {
      action = 'ENQUEUE',
      jobType = 'SYNC_ALL', // 'SYNC_TIMETABLE' | 'SYNC_GRADES' | 'SYNC_LMS' | 'SYNC_ALL'
      title,
      batchId,
      targetUsernames,
      config,
    } = body;

    // 1. ACTION: ENQUEUE
    if (action === 'ENQUEUE') {
      const enqueueRes = await enqueueGlobalSyncJob({
        jobType,
        title,
        triggeredBy: authUser.username,
        targetUsernames,
      });

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'ENQUEUE_GLOBAL_SYNC_JOB',
        targetType: 'GLOBAL_JOB',
        targetId: jobType,
        description: `Kích hoạt tác vụ Global [${jobType}] cho ${enqueueRes.totalItems} tài khoản sinh viên`,
        metadata: { jobType, totalItems: enqueueRes.totalItems },
      });

      return NextResponse.json(enqueueRes);
    }

    // 2. ACTION: TRIGGER_NIGHTLY (Kích hoạt chạy thử chu kỳ quét ban đêm 22h ngay lập tức)
    if (action === 'TRIGGER_NIGHTLY') {
      const res = await runGlobalNightlySyncScheduler();
      return NextResponse.json({
        success: true,
        message: res.reason || 'Đã thực hiện quét lịch đồng bộ ban đêm',
        ...res,
      });
    }

    // 3. ACTION: PROCESS_NEXT (Kích hoạt lại worker nếu bị treo hoặc dừng)
    if (action === 'PROCESS_NEXT') {
      processGlobalSyncQueue(batchId).catch(console.error);
      return NextResponse.json({ success: true, message: 'Đã kích hoạt xử lý hàng đợi ngầm' });
    }

    // 4. ACTION: CANCEL_PENDING
    if (action === 'CANCEL_PENDING') {
      const cancelRes = await cancelPendingGlobalQueue(batchId);
      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'CANCEL_GLOBAL_QUEUE',
        targetType: 'GLOBAL_JOB',
        targetId: batchId || 'ALL',
        description: `Hủy ${cancelRes.cancelledCount} tác vụ đang chờ trong Queue Global`,
        metadata: { batchId, cancelledCount: cancelRes.cancelledCount },
      });

      return NextResponse.json({
        success: true,
        message: `Đã hủy ${cancelRes.cancelledCount} tác vụ đang chờ trong hàng đợi.`,
        ...cancelRes,
      });
    }

    // 5. ACTION: RETRY_FAILED
    if (action === 'RETRY_FAILED') {
      const retryRes = await retryFailedGlobalQueue(batchId);
      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'RETRY_GLOBAL_QUEUE',
        targetType: 'GLOBAL_JOB',
        targetId: batchId || 'ALL',
        description: `Thử lại ${retryRes.retriedCount} tác vụ bị lỗi trong Queue Global`,
        metadata: { batchId, retriedCount: retryRes.retriedCount },
      });

      return NextResponse.json({
        success: true,
        message: `Đã đưa ${retryRes.retriedCount} tác vụ lỗi vào lại hàng đợi để xử lý lại.`,
        ...retryRes,
      });
    }

    // 6. ACTION: CLEAR_COMPLETED
    if (action === 'CLEAR_COMPLETED') {
      const clearRes = await clearCompletedGlobalBatches();
      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: ACTIVITY_LOG_ACTIONS.CLEAR_COMPLETED_GLOBAL_QUEUE,
        targetType: 'GLOBAL_JOB',
        description: `Quản trị viên ${authUser.username} đã dọn dẹp ${clearRes.deletedCount} đợt đồng bộ Global đã hoàn thành`,
        metadata: clearRes,
      });

      return NextResponse.json({
        success: true,
        message: `Đã dọn dẹp ${clearRes.deletedCount} đợt chạy đã hoàn thành.`,
        ...clearRes,
      });
    }

    // 7. ACTION: UPDATE_CONFIG (Cập nhật cài đặt lịch chạy riêng cho từng Job)
    if (action === 'UPDATE_CONFIG' && config) {
      const currentConfig = (await getGlobalSyncQueueStatus()).config;
      const newConfig: GlobalNightlySyncConfigValue = {
        ...currentConfig,
        ...config,
        timetableJob: {
          ...currentConfig.timetableJob,
          ...(config.timetableJob || {}),
        },
        gradesJob: {
          ...currentConfig.gradesJob,
          ...(config.gradesJob || {}),
        },
        lmsJob: {
          ...currentConfig.lmsJob,
          ...(config.lmsJob || {}),
        },
      };

      await setGlobalConfig(
        GLOBAL_CONFIG_KEYS.GLOBAL_NIGHTLY_SYNC,
        newConfig,
        'Cấu hình lịch tự động chạy cho từng Job Global (Lịch học, Điểm, LMS)'
      );

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: ACTIVITY_LOG_ACTIONS.UPDATE_GLOBAL_SYNC_CONFIG,
        targetType: 'GLOBAL_JOB',
        targetId: 'CONFIG',
        description: `Cập nhật cấu hình tự động đồng bộ dữ liệu ban đêm`,
        metadata: newConfig,
      });

      return NextResponse.json({
        success: true,
        message: 'Đã cập nhật cấu hình đồng bộ tự động ban đêm thành công',
        config: newConfig,
      });
    }

    // 8. ACTION: RECOVER_STUCK (Phục hồi các tác vụ bị kẹt RUNNING)
    if (action === 'RECOVER_STUCK') {
      const recRes = await recoverStuckGlobalSyncQueueItems({
        batchId,
        autoResumeWorker: true,
      });

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: ACTIVITY_LOG_ACTIONS.RECOVER_STUCK_QUEUE_JOBS,
        targetType: 'GLOBAL_JOB',
        targetId: batchId || 'ALL',
        description: `${authUser.username} đã kích hoạt phục hồi ${recRes.recoveredCount} tác vụ bị kẹt trong Queue Global`,
        metadata: recRes,
      });

      return NextResponse.json({
        success: true,
        message: `Đã khôi phục ${recRes.recoveredCount} tác vụ bị kẹt vào lại hàng đợi để tiếp tục xử lý.`,
        ...recRes,
      });
    }

    return NextResponse.json({ error: `Action '${action}' không được hỗ trợ` }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/global-sync error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi xử lý thao tác Queue Global' }, { status: 500 });
  }
}
