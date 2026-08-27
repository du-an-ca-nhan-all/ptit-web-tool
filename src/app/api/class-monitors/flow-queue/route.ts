import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import {
  enqueueFlowAction,
  processFlowQueue,
  getFlowQueueStatus,
  cancelPendingFlowQueue,
  retryFailedFlowQueue,
  clearCompletedFlowBatches,
  recoverStuckFlowQueueItems,
} from '@/src/features/classes-monitor/server/monitorFlowQueueServerService';
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

// GET /api/class-monitors/flow-queue
// Lấy trạng thái hàng đợi và các batch gần nhất
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để truy cập' }, { status: 401 });
    }

    if (!authUser.isAdmin && !authUser.isMonitor) {
      return NextResponse.json({ error: 'Chỉ Lớp trưởng hoặc Quản trị viên mới có quyền xem Queue' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const classCode = searchParams.get('classCode') || authUser.lop || '';
    const monitorUsername = (searchParams.get('monitorUsername') || authUser.username).toUpperCase();
    const batchId = searchParams.get('batchId') || undefined;
    const limit = Number(searchParams.get('limit')) || 50;

    const data = await getFlowQueueStatus({
      monitorUsername,
      classCode,
      batchId,
      limit,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('GET /api/class-monitors/flow-queue error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi tải trạng thái hàng đợi' }, { status: 500 });
  }
}

// POST /api/class-monitors/flow-queue
// Đưa tác vụ vào queue (ENQUEUE) hoặc quản lý queue (CANCEL_PENDING | RETRY_FAILED | CLEAR_COMPLETED | PROCESS_NEXT)
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện' }, { status: 401 });
    }

    if (!authUser.isAdmin && !authUser.isMonitor) {
      return NextResponse.json({ error: 'Chỉ Lớp trưởng hoặc Quản trị viên mới có quyền thao tác Queue' }, { status: 403 });
    }

    const body = await req.json();
    const {
      action = 'ENQUEUE',
      classCode = authUser.lop || '',
      monitorUsername = authUser.username,
      flowAction = 'REGISTER',
      title,
      id_to_hoc,
      ma_mon,
      ten_mon,
      nhom_to,
      sv_nganh = 1,
      targetFollowerUsernames,
      batchId,
    } = body;

    const normClass = String(classCode).trim().toUpperCase();
    const normMonitor = String(monitorUsername).trim().toUpperCase();

    if (!normClass) {
      return NextResponse.json({ error: 'Mã lớp (classCode) là bắt buộc' }, { status: 400 });
    }

    // 1. ACTION: ENQUEUE
    if (action === 'ENQUEUE') {
      const enqueueRes = await enqueueFlowAction({
        monitorUsername: normMonitor,
        classCode: normClass,
        flowAction,
        title,
        id_to_hoc,
        ma_mon,
        ten_mon,
        nhom_to,
        sv_nganh: Number(sv_nganh) || 1,
        targetFollowerUsernames,
      });

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'ENQUEUE_MONITOR_FLOW_BATCH',
        targetType: 'MONITOR_FLOW',
        targetId: normClass,
        description: `Đưa ${enqueueRes.totalItems} tác vụ Flow [${flowAction}] vào hàng đợi xử lý ngầm (Batch: ${enqueueRes.batchId})`,
        metadata: { classCode: normClass, flowAction, id_to_hoc, batchId: enqueueRes.batchId },
      });

      return NextResponse.json(enqueueRes);
    }

    // 2. ACTION: PROCESS_NEXT (Kích hoạt lại worker nếu bị dừng)
    if (action === 'PROCESS_NEXT') {
      processFlowQueue(batchId).catch(console.error);
      return NextResponse.json({ success: true, message: 'Đã kích hoạt xử lý hàng đợi ngầm' });
    }

    // 3. ACTION: CANCEL_PENDING
    if (action === 'CANCEL_PENDING') {
      const cancelRes = await cancelPendingFlowQueue({
        monitorUsername: normMonitor,
        classCode: normClass,
        batchId,
      });

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'CANCEL_FLOW_QUEUE',
        targetType: 'MONITOR_FLOW',
        targetId: normClass,
        description: `Hủy ${cancelRes.cancelledCount} tác vụ đang chờ trong Queue của lớp ${normClass}`,
        metadata: { classCode: normClass, cancelledCount: cancelRes.cancelledCount },
      });

      return NextResponse.json({
        success: true,
        message: `Đã hủy ${cancelRes.cancelledCount} tác vụ đang chờ trong hàng đợi.`,
        ...cancelRes,
      });
    }

    // 4. ACTION: RETRY_FAILED
    if (action === 'RETRY_FAILED') {
      const retryRes = await retryFailedFlowQueue({
        monitorUsername: normMonitor,
        classCode: normClass,
        batchId,
      });

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'RETRY_FLOW_QUEUE',
        targetType: 'MONITOR_FLOW',
        targetId: normClass,
        description: `Thử lại ${retryRes.retriedCount} tác vụ bị lỗi trong Queue của lớp ${normClass}`,
        metadata: { classCode: normClass, retriedCount: retryRes.retriedCount },
      });

      return NextResponse.json({
        success: true,
        message: `Đã đưa ${retryRes.retriedCount} tác vụ lỗi vào lại hàng đợi để xử lý lại.`,
        ...retryRes,
      });
    }

    // 5. ACTION: CLEAR_COMPLETED
    if (action === 'CLEAR_COMPLETED') {
      const clearRes = await clearCompletedFlowBatches({
        monitorUsername: normMonitor,
        classCode: normClass,
      });

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: ACTIVITY_LOG_ACTIONS.CLEAR_COMPLETED_FLOW_QUEUE,
        targetType: 'MONITOR_FLOW',
        targetId: normClass,
        description: `Lớp trưởng ${authUser.username} đã dọn dẹp ${clearRes.deletedCount} đợt chạy Flow của lớp ${normClass}`,
        metadata: { classCode: normClass, deletedCount: clearRes.deletedCount },
      });

      return NextResponse.json({
        success: true,
        message: `Đã dọn dẹp ${clearRes.deletedCount} đợt chạy đã hoàn thành.`,
        ...clearRes,
      });
    }

    // 6. ACTION: RECOVER_STUCK (Phục hồi các tác vụ bị kẹt RUNNING)
    if (action === 'RECOVER_STUCK') {
      const recRes = await recoverStuckFlowQueueItems({
        monitorUsername: normMonitor,
        classCode: normClass,
        batchId,
        autoResumeWorker: true,
      });

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: ACTIVITY_LOG_ACTIONS.RECOVER_STUCK_QUEUE_JOBS,
        targetType: 'MONITOR_FLOW',
        targetId: normClass,
        description: `${authUser.username} đã phục hồi ${recRes.recoveredCount} tác vụ Flow bị kẹt của lớp ${normClass}`,
        metadata: { classCode: normClass, ...recRes },
      });

      return NextResponse.json({
        success: true,
        message: `Đã khôi phục ${recRes.recoveredCount} tác vụ bị kẹt vào lại hàng đợi để tiếp tục xử lý.`,
        ...recRes,
      });
    }

    return NextResponse.json({ error: `Action '${action}' không được hỗ trợ` }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/class-monitors/flow-queue error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi xử lý thao tác Queue' }, { status: 500 });
  }
}
