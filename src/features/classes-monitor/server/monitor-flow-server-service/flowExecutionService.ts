import { prisma } from '@/src/lib/prisma';
import { fetchRegisteredCoursesFromQLDTTX } from '@/src/features/external-portal/server/courseRegistrationServerService';
import { normalizeFlowAction } from '@/src/features/classes-monitor/types/flow.types';
import {
  ExecuteMonitorFlowOptions,
  ExecuteMonitorFlowResult,
  FlowExecutionItemResult,
} from './types';
import {
  executeCancelCourseAction,
  executeRegisterCourseAction,
  executeSyncAllCoursesAction,
  recordFollowerActionResult,
} from './flowActionHandlers';

/**
 * Thực thi Flow Action từ Lớp trưởng đến các thành viên được cấu hình
 */
export async function executeMonitorFlowAction(
  options: ExecuteMonitorFlowOptions
): Promise<ExecuteMonitorFlowResult> {
  const normMonitor = options.monitorUsername.trim().toUpperCase();
  const svNganh = options.sv_nganh ?? 1;
  const canonicalAction = normalizeFlowAction(options.flowAction);

  // 1. Lấy danh sách cấu hình flow đang bật của Lớp trưởng
  const flowConfigs = await prisma.monitorFlowConfig.findMany({
    where: {
      monitorUsername: normMonitor,
      isEnabled: true,
      ...(options.classCode ? { classCode: options.classCode.trim().toUpperCase() } : {}),
      ...(canonicalAction === 'COURSE_REGISTER' ? { allowRegisterCourse: true } : {}),
      ...(canonicalAction === 'COURSE_CANCEL' ? { allowCancelCourse: true } : {}),
    },
  });

  let targetConfigs = flowConfigs;
  if (options.targetFollowerUsernames && options.targetFollowerUsernames.length > 0) {
    const filterSet = new Set(options.targetFollowerUsernames.map((u) => u.trim().toUpperCase()));
    targetConfigs = targetConfigs.filter((c) => filterSet.has(c.followerUsername.toUpperCase()));
  }

  // Lấy thông tin họ tên sinh viên
  const followerUsernames = targetConfigs.map((c) => c.followerUsername.toUpperCase());
  const studentsInfo = await prisma.student.findMany({
    where: {
      maSV: { in: followerUsernames },
    },
    select: {
      maSV: true,
      hoTen: true,
      hoLot: true,
      ten: true,
    },
  });

  const nameMap = new Map<string, string>();
  studentsInfo.forEach((st) => {
    const fullName = st.hoTen || `${st.hoLot || ''} ${st.ten || ''}`.trim() || st.maSV;
    nameMap.set(st.maSV.toUpperCase(), fullName);
  });

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  const executionResults: FlowExecutionItemResult[] = [];

  // 2. Nếu action là COURSE_SYNC_ALL: Lấy danh sách môn của lớp trưởng trước
  let monitorRegisteredCourses: any[] = [];
  if (canonicalAction === 'COURSE_SYNC_ALL') {
    const monitorExtAcc = await prisma.externalAccount.findFirst({
      where: { username: normMonitor, systemKey: 'QLDTTX_PTTC1' },
    });
    if (monitorExtAcc) {
      const regRes = await fetchRegisteredCoursesFromQLDTTX({
        username: monitorExtAcc.extUsername,
        password: monitorExtAcc.extPassword,
        token: monitorExtAcc.token,
      });
      monitorRegisteredCourses = regRes.ds_kqdkmh || [];
    }
  }

  // 3. Thực thi lần lượt cho từng sinh viên
  for (const cfg of targetConfigs) {
    const normFollower = cfg.followerUsername.toUpperCase();
    const studentName = nameMap.get(normFollower) || normFollower;

    // Kiểm tra tài khoản QLDTTX
    const extAcc = await prisma.externalAccount.findFirst({
      where: { username: normFollower, systemKey: 'QLDTTX_PTTC1' },
    });

    if (!extAcc || !extAcc.extUsername || !extAcc.extPassword) {
      skippedCount++;
      const msg = 'Chưa cấu hình tài khoản Cổng QLDTTX (không có mật khẩu)';
      executionResults.push({
        username: normFollower,
        hoTen: studentName,
        success: false,
        status: 'SKIPPED',
        message: msg,
      });

      // Cập nhật kết quả vào DB
      await recordFollowerActionResult({
        normMonitor,
        normFollower,
        actionType: canonicalAction,
        actionResult: 'SKIPPED',
        actionMessage: msg,
      });
      continue;
    }

    const creds = {
      username: extAcc.extUsername,
      password: extAcc.extPassword,
      token: extAcc.token,
    };

    try {
      let outcome: { succeeded: boolean; result: FlowExecutionItemResult } | null = null;

      if (canonicalAction === 'COURSE_REGISTER') {
        outcome = await executeRegisterCourseAction({
          normMonitor,
          normFollower,
          studentName,
          creds,
          svNganh,
          options,
        });
      } else if (canonicalAction === 'COURSE_CANCEL') {
        outcome = await executeCancelCourseAction({
          normMonitor,
          normFollower,
          studentName,
          creds,
          svNganh,
          options,
        });
      } else if (canonicalAction === 'COURSE_SYNC_ALL') {
        outcome = await executeSyncAllCoursesAction({
          normMonitor,
          normFollower,
          studentName,
          creds,
          svNganh,
          allowRegisterCourse: cfg.allowRegisterCourse,
          allowCancelCourse: cfg.allowCancelCourse,
          monitorRegisteredCourses,
        });
      }

      if (outcome) {
        successCount += outcome.succeeded ? 1 : 0;
        failCount += outcome.succeeded ? 0 : 1;
        executionResults.push(outcome.result);
      }
    } catch (err: any) {
      failCount++;
      const errMsg = err.message || 'Lỗi ngoại lệ khi thực thi Flow';
      executionResults.push({
        username: normFollower,
        hoTen: studentName,
        success: false,
        status: 'FAILED',
        message: errMsg,
      });

      await recordFollowerActionResult({
        normMonitor,
        normFollower,
        actionType: canonicalAction,
        actionResult: 'FAILED',
        actionMessage: errMsg,
      });
    }
  }

  return {
    success: successCount > 0 || (failCount === 0 && skippedCount === 0),
    flowAction: options.flowAction,
    total: targetConfigs.length,
    successCount,
    failCount,
    skippedCount,
    results: executionResults,
  };
}
