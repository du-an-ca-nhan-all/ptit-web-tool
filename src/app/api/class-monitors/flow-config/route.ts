import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import {
  getMonitorFlowList,
  saveMonitorFlowConfigs,
  importMonitorFlowConfigs,
  executeMonitorFlowAction,
  pullClassCourseRegistrations,
} from '@/src/features/classes-monitor/server/monitorFlowServerService';
import { enqueueFlowAction } from '@/src/features/classes-monitor/server/monitorFlowQueueServerService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';

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

// GET /api/class-monitors/flow-config
// Lấy danh sách thành viên trong lớp kèm cấu hình Flow Action theo Lớp trưởng
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để truy cập' }, { status: 401 });
    }

    if (!authUser.isAdmin && !authUser.isMonitor) {
      return NextResponse.json({ error: 'Chỉ Lớp trưởng hoặc Quản trị viên mới có quyền truy cập cấu hình Flow' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const classCode = searchParams.get('classCode') || authUser.lop || '';
    const monitorUsername = (searchParams.get('monitorUsername') || authUser.username).toUpperCase();

    if (!classCode) {
      return NextResponse.json({ error: 'Mã lớp (classCode) là bắt buộc' }, { status: 400 });
    }

    const flowData = await getMonitorFlowList(monitorUsername, classCode);

    return NextResponse.json({
      success: true,
      ...flowData,
    });
  } catch (error: any) {
    console.error('GET /api/class-monitors/flow-config error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi tải cấu hình Flow' }, { status: 500 });
  }
}

// POST /api/class-monitors/flow-config
// Lưu cấu hình (SAVE_CONFIG) hoặc Thực thi Flow Action (EXECUTE_FLOW)
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện' }, { status: 401 });
    }

    if (!authUser.isAdmin && !authUser.isMonitor) {
      return NextResponse.json({ error: 'Chỉ Lớp trưởng hoặc Quản trị viên mới có quyền thao tác Flow' }, { status: 403 });
    }

    const body = await req.json();
    const {
      action = 'SAVE_CONFIG', // 'SAVE_CONFIG' | 'EXECUTE_FLOW'
      classCode = authUser.lop || '',
      monitorUsername = authUser.username,
      configs = [],
      flowAction = 'REGISTER', // 'REGISTER' | 'CANCEL' | 'SYNC_ALL_COURSES'
      id_to_hoc,
      id_rs,
      ma_mon,
      ten_mon,
      nhom_to,
      sv_nganh = 1,
      targetFollowerUsernames = [],
    } = body;

    const normClass = String(classCode).trim().toUpperCase();
    const normMonitor = String(monitorUsername).trim().toUpperCase();

    if (!normClass) {
      return NextResponse.json({ error: 'Mã lớp (classCode) là bắt buộc' }, { status: 400 });
    }

    // 1. ACTION: SAVE_CONFIG
    if (action === 'SAVE_CONFIG') {
      const saveRes = await saveMonitorFlowConfigs(normMonitor, normClass, configs);

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'UPDATE_MONITOR_FLOW_CONFIG',
        targetType: 'MONITOR_FLOW',
        targetId: normClass,
        description: `Cập nhật cấu hình Flow Action theo Lớp trưởng ${normMonitor} cho lớp ${normClass} (${saveRes.count} thành viên)`,
        metadata: { classCode: normClass, monitorUsername: normMonitor, count: saveRes.count },
      });

      return NextResponse.json({
        success: true,
        message: `Đã lưu cấu hình Flow thành công cho ${saveRes.count} thành viên lớp ${normClass}!`,
        ...saveRes,
      });
    }

    // 2. ACTION: IMPORT_CONFIG (Import danh sách sinh viên theo Lớp trưởng bằng file CSV/Text)
    if (action === 'IMPORT_CONFIG') {
      const {
        mode = 'MERGE', // 'MERGE' | 'REPLACE'
        items = [],
        defaultAllowRegister = true,
        defaultAllowCancel = true,
        defaultAutoSync = false,
      } = body;

      const importRes = await importMonitorFlowConfigs({
        monitorUsername: normMonitor,
        classCode: normClass,
        mode: mode === 'REPLACE' ? 'REPLACE' : 'MERGE',
        defaultAllowRegister: Boolean(defaultAllowRegister),
        defaultAllowCancel: Boolean(defaultAllowCancel),
        defaultAutoSync: Boolean(defaultAutoSync),
        items: Array.isArray(items) ? items : [],
      });

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'IMPORT_MONITOR_FLOW_CONFIG',
        targetType: 'MONITOR_FLOW',
        targetId: normClass,
        description: `Import danh sách Flow theo Lớp trưởng ${normMonitor} (${mode === 'REPLACE' ? 'Ghi đè/Reset cũ' : 'Thêm mới/Bổ sung'}): Đã kích hoạt ${importRes.enabledCount}/${importRes.totalImported} sinh viên`,
        metadata: {
          classCode: normClass,
          monitorUsername: normMonitor,
          mode,
          totalImported: importRes.totalImported,
          enabledCount: importRes.enabledCount,
          replacedCount: importRes.replacedCount,
        },
      });

      const updatedFlowData = await getMonitorFlowList(normMonitor, normClass);

      return NextResponse.json({
        success: true,
        message: importRes.message,
        importSummary: {
          mode: importRes.mode,
          totalImported: importRes.totalImported,
          enabledCount: importRes.enabledCount,
          replacedCount: importRes.replacedCount,
        },
        ...updatedFlowData,
      });
    }

    // 3. ACTION: EXECUTE_FLOW
    if (action === 'EXECUTE_FLOW') {
      const isBatch = !targetFollowerUsernames || targetFollowerUsernames.length > 1;

      // Nếu là chạy hàng loạt cho nhiều người -> Đưa vào Hàng Đợi (Queue) xử lý ngầm tránh nghẽn mạng / timeout
      if (isBatch) {
        const enqueueRes = await enqueueFlowAction({
          monitorUsername: normMonitor,
          classCode: normClass,
          flowAction,
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
          description: `Đưa ${enqueueRes.totalItems} tác vụ Flow [${flowAction}] vào hàng đợi xử lý ngầm (Batch ID: ${enqueueRes.batchId})`,
          metadata: { classCode: normClass, flowAction, id_to_hoc, batchId: enqueueRes.batchId },
        });

        return NextResponse.json({
          success: enqueueRes.success,
          isQueued: true,
          batchId: enqueueRes.batchId,
          total: enqueueRes.totalItems,
          message: enqueueRes.message || `Đã đưa ${enqueueRes.totalItems} tác vụ vào Hàng Đợi Flow để xử lý ngầm.`,
        });
      }

      // Nếu chỉ thao tác cho 1 sinh viên duy nhất -> Chạy trực tiếp để phản hồi tức thì
      const execRes = await executeMonitorFlowAction({
        monitorUsername: normMonitor,
        classCode: normClass,
        flowAction,
        id_to_hoc,
        id_rs,
        ma_mon,
        ten_mon,
        nhom_to,
        sv_nganh: Number(sv_nganh) || 1,
        targetFollowerUsernames,
      });

      const actionName =
        flowAction === 'REGISTER'
          ? 'Đăng ký môn học'
          : flowAction === 'CANCEL'
          ? 'Hủy môn học'
          : 'Đồng bộ toàn bộ môn học';

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'EXECUTE_MONITOR_FLOW_ACTION',
        targetType: 'MONITOR_FLOW',
        targetId: normClass,
        description: `Thực thi Flow Action [${actionName}] cho ${execRes.total} thành viên: ${execRes.successCount} thành công, ${execRes.failCount} thất bại`,
        metadata: {
          classCode: normClass,
          flowAction,
          id_to_hoc,
          ma_mon,
          successCount: execRes.successCount,
          failCount: execRes.failCount,
        },
      });

      return NextResponse.json({
        success: execRes.success,
        isQueued: false,
        message: `Đã thực thi Flow Action [${actionName}] cho ${execRes.total} thành viên: ${execRes.successCount} thành công, ${execRes.failCount} thất bại.`,
        ...execRes,
      });
    }

    // 3. ACTION: PULL_COURSES (Kéo dữ liệu ĐKMH mới nhất từ QLDTTX cho cả lớp)
    if (action === 'PULL_COURSES') {
      const pullRes = await pullClassCourseRegistrations(normMonitor, normClass);

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'PULL_CLASS_COURSE_REGISTRATION',
        targetType: 'MONITOR_FLOW',
        targetId: normClass,
        description: `Kéo dữ liệu ĐKMH trực tiếp từ QLDTTX cho lớp ${normClass}: ${pullRes.pulledCount} tài khoản thành công`,
        metadata: { classCode: normClass, monitorUsername: normMonitor, pulledCount: pullRes.pulledCount },
      });

      const updatedFlowData = await getMonitorFlowList(normMonitor, normClass);

      return NextResponse.json({
        success: true,
        message: `Đã đồng bộ kéo dữ liệu ĐKMH mới nhất cho ${pullRes.pulledCount} tài khoản trong lớp ${normClass}!`,
        pulledCount: pullRes.pulledCount,
        ...updatedFlowData,
      });
    }

    return NextResponse.json({ error: `Action '${action}' không được hỗ trợ` }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/class-monitors/flow-config error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi xử lý Flow Action' }, { status: 500 });
  }
}
