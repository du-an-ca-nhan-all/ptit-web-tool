import { prisma } from '@/src/lib/prisma';
import {
  registerCourseGroupQLDTTX,
  cancelCourseGroupQLDTTX,
  fetchRegisteredCoursesFromQLDTTX,
} from '@/src/features/external-portal/server/courseRegistrationServerService';
import {
  ExecuteMonitorFlowOptions,
  FlowExecutionItemResult,
  QldttxCredentials,
} from './types';

export async function recordFollowerActionResult(params: {
  normMonitor: string;
  normFollower: string;
  actionType: string;
  actionResult: string;
  actionMessage: string;
}) {
  await prisma.monitorFlowConfig.updateMany({
    where: {
      monitorUsername: params.normMonitor,
      followerUsername: params.normFollower,
    },
    data: {
      lastActionAt: new Date(),
      lastActionType: params.actionType,
      lastActionResult: params.actionResult,
      lastActionMessage: params.actionMessage,
    },
  });
}

export async function executeRegisterCourseAction(params: {
  normMonitor: string;
  normFollower: string;
  studentName: string;
  creds: QldttxCredentials;
  svNganh: number;
  options: ExecuteMonitorFlowOptions;
}): Promise<{ succeeded: boolean; result: FlowExecutionItemResult }> {
  const { normMonitor, normFollower, studentName, creds, svNganh, options } = params;

  if (!options.id_to_hoc) {
    throw new Error('Thiếu id_to_hoc để thực hiện Flow Đăng Ký');
  }

  const res = await registerCourseGroupQLDTTX(creds, {
    id_to_hoc: options.id_to_hoc,
    sv_nganh: svNganh,
  });

  const result: FlowExecutionItemResult = res.success
    ? {
        username: normFollower,
        hoTen: studentName,
        success: true,
        status: 'SUCCESS',
        message: `Đăng ký thành công tổ [${options.nhom_to || options.id_to_hoc}]`,
        data: res.ket_qua_dang_ky,
      }
    : {
        username: normFollower,
        hoTen: studentName,
        success: false,
        status: 'FAILED',
        message: res.message || 'Đăng ký thất bại (bị trùng lịch hoặc hết slot)',
      };

  await recordFollowerActionResult({
    normMonitor,
    normFollower,
    actionType: 'COURSE_REGISTER',
    actionResult: res.success ? 'SUCCESS' : 'FAILED',
    actionMessage: res.message || (res.success ? 'Đăng ký thành công' : 'Đăng ký thất bại'),
  });

  return { succeeded: Boolean(res.success), result };
}

export async function executeCancelCourseAction(params: {
  normMonitor: string;
  normFollower: string;
  studentName: string;
  creds: QldttxCredentials;
  svNganh: number;
  options: ExecuteMonitorFlowOptions;
}): Promise<{ succeeded: boolean; result: FlowExecutionItemResult }> {
  const { normMonitor, normFollower, studentName, creds, svNganh, options } = params;

  if (!options.id_to_hoc) {
    throw new Error('Thiếu id_to_hoc để thực hiện Flow Hủy Môn');
  }

  const res = await cancelCourseGroupQLDTTX(creds, {
    id_to_hoc: options.id_to_hoc,
    sv_nganh: svNganh,
  });

  const result: FlowExecutionItemResult = res.success
    ? {
        username: normFollower,
        hoTen: studentName,
        success: true,
        status: 'SUCCESS',
        message: `Hủy thành công tổ [${options.nhom_to || options.id_to_hoc}]`,
      }
    : {
        username: normFollower,
        hoTen: studentName,
        success: false,
        status: 'FAILED',
        message: res.message || 'Hủy môn thất bại',
      };

  await recordFollowerActionResult({
    normMonitor,
    normFollower,
    actionType: 'COURSE_CANCEL',
    actionResult: res.success ? 'SUCCESS' : 'FAILED',
    actionMessage: res.message || (res.success ? 'Hủy môn thành công' : 'Hủy môn thất bại'),
  });

  return { succeeded: Boolean(res.success), result };
}

async function syncCourseGroupList(params: {
  idsToProcess: string[];
  creds: QldttxCredentials;
  svNganh: number;
  mode: 'cancel' | 'register';
}): Promise<{ successCount: number; failCount: number }> {
  const { idsToProcess, creds, svNganh, mode } = params;
  let successCount = 0;
  let failCount = 0;

  for (const idToHoc of idsToProcess) {
    try {
      const actionRes =
        mode === 'cancel'
          ? await cancelCourseGroupQLDTTX(creds, { id_to_hoc: idToHoc, sv_nganh: svNganh })
          : await registerCourseGroupQLDTTX(creds, { id_to_hoc: idToHoc, sv_nganh: svNganh });
      if (actionRes.success) successCount++;
      else failCount++;
    } catch {
      failCount++;
    }
  }

  return { successCount, failCount };
}

export async function executeSyncAllCoursesAction(params: {
  normMonitor: string;
  normFollower: string;
  studentName: string;
  creds: QldttxCredentials;
  svNganh: number;
  allowRegisterCourse: boolean;
  allowCancelCourse: boolean;
  monitorRegisteredCourses: any[];
}): Promise<{ succeeded: boolean; result: FlowExecutionItemResult }> {
  const {
    normMonitor,
    normFollower,
    studentName,
    creds,
    svNganh,
    allowRegisterCourse,
    allowCancelCourse,
    monitorRegisteredCourses,
  } = params;

  // Đồng bộ 2 chiều toàn bộ các môn của lớp trưởng cho sinh viên này (Cả Đăng ký môn thiếu và Hủy môn thừa)
  let regSuccess = 0;
  let regFail = 0;
  let cancelSuccess = 0;
  let cancelFail = 0;

  // 1. Lấy danh sách môn sinh viên hiện đang có trên QLDTTX
  const followerRes = await fetchRegisteredCoursesFromQLDTTX(creds);
  const followerCourses = followerRes.ds_kqdkmh || [];

  const monitorToHocMap = new Map<string, any>();
  monitorRegisteredCourses.forEach((c) => {
    const id = String(c.to_hoc?.id_to_hoc || '').trim();
    if (id) monitorToHocMap.set(id, c);
  });

  const followerToHocMap = new Map<string, any>();
  followerCourses.forEach((c) => {
    const id = String(c.to_hoc?.id_to_hoc || '').trim();
    if (id) followerToHocMap.set(id, c);
  });

  // 2. HỦY các môn mà Sinh viên đang có nhưng Lớp trưởng KHÔNG có (hoặc Lớp trưởng đã hủy)
  if (allowCancelCourse) {
    const idsToCancel = Array.from(followerToHocMap.keys()).filter((id) => !monitorToHocMap.has(id));
    const cancelStats = await syncCourseGroupList({ idsToProcess: idsToCancel, creds, svNganh, mode: 'cancel' });
    cancelSuccess = cancelStats.successCount;
    cancelFail = cancelStats.failCount;
  }

  // 3. ĐĂNG KÝ các môn mà Lớp trưởng CÓ nhưng Sinh viên CHƯA có
  if (allowRegisterCourse) {
    const idsToRegister = Array.from(monitorToHocMap.keys()).filter((id) => !followerToHocMap.has(id));
    const regStats = await syncCourseGroupList({ idsToProcess: idsToRegister, creds, svNganh, mode: 'register' });
    regSuccess = regStats.successCount;
    regFail = regStats.failCount;
  }

  const hasErrors = cancelFail > 0 || regFail > 0;
  const hasChanges = cancelSuccess > 0 || regSuccess > 0;
  const isMatched = !hasChanges && !hasErrors && followerToHocMap.size === monitorToHocMap.size;

  let summaryMsg = '';
  if (isMatched) {
    summaryMsg = `Đã khớp 100% môn học với Lớp trưởng (${monitorToHocMap.size} môn)`;
  } else {
    const parts = [];
    if (regSuccess > 0) parts.push(`Đăng ký ${regSuccess} môn`);
    if (cancelSuccess > 0) parts.push(`Hủy ${cancelSuccess} môn`);
    if (hasErrors) parts.push(`${regFail + cancelFail} lỗi`);
    summaryMsg = parts.length > 0 ? `Đã đồng bộ: ${parts.join(', ')}` : 'Đã đồng bộ xong';
  }

  const isSuccess = !hasErrors || regSuccess > 0 || cancelSuccess > 0 || isMatched;

  const result: FlowExecutionItemResult = {
    username: normFollower,
    hoTen: studentName,
    success: isSuccess,
    status: isSuccess ? 'SUCCESS' : 'FAILED',
    message: summaryMsg,
  };

  await recordFollowerActionResult({
    normMonitor,
    normFollower,
    actionType: 'COURSE_SYNC_ALL',
    actionResult: isSuccess ? 'SUCCESS' : 'PARTIAL',
    actionMessage: summaryMsg,
  });

  return { succeeded: isSuccess, result };
}
