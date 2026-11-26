import { prisma } from '@/src/lib/prisma';
import {
  registerCourseGroupQLDTTX,
  cancelCourseGroupQLDTTX,
} from '@/src/features/external-portal/server/courseRegistrationServerService';
import { normalizeFlowAction } from '@/src/features/classes-monitor/types/flow.types';
import { executeSyncAllCoursesItem } from './syncAllCoursesExecutor';

/**
 * Xử lý 1 tác vụ đơn lẻ của 1 sinh viên trong Queue
 */
export async function processSingleQueueItem(item: any) {
  const normFollower = item.followerUsername.toUpperCase();
  const normMonitor = item.monitorUsername.toUpperCase();
  const svNganh = item.sv_nganh || 1;

  // 1. Kiểm tra tài khoản QLDTTX của sinh viên
  const extAcc = await prisma.externalAccount.findFirst({
    where: { username: normFollower, systemKey: 'QLDTTX_PTTC1' },
  });

  if (!extAcc || !extAcc.extUsername || !extAcc.extPassword) {
    const msg = 'Chưa cấu hình tài khoản Cổng QLDTTX (không có mật khẩu)';
    await prisma.monitorFlowQueueItem.update({
      where: { id: item.id },
      data: {
        status: 'SKIPPED',
        resultMessage: msg,
        finishedAt: new Date(),
      },
    });

    await prisma.monitorFlowConfig.updateMany({
      where: { monitorUsername: normMonitor, followerUsername: normFollower },
      data: {
        lastActionAt: new Date(),
        lastActionType: item.flowAction,
        lastActionResult: 'SKIPPED',
        lastActionMessage: msg,
      },
    });
    return;
  }

  const creds = {
    username: extAcc.extUsername,
    password: extAcc.extPassword,
    token: extAcc.token,
  };

  try {
    const canonicalAction = normalizeFlowAction(item.flowAction);

    if (canonicalAction === 'COURSE_REGISTER') {
      if (!item.id_to_hoc) {
        throw new Error('Thiếu id_to_hoc để thực hiện Flow Đăng Ký');
      }

      const res = await registerCourseGroupQLDTTX(creds, {
        id_to_hoc: item.id_to_hoc,
        sv_nganh: svNganh,
      });

      const isSuccess = res.success;
      const msg = isSuccess
        ? `Đăng ký thành công tổ [${item.nhom_to || item.id_to_hoc}]`
        : res.message || 'Đăng ký thất bại';

      await prisma.monitorFlowQueueItem.update({
        where: { id: item.id },
        data: {
          status: isSuccess ? 'SUCCESS' : 'FAILED',
          resultMessage: msg,
          resultData: JSON.stringify(res.rawResponse || {}),
          finishedAt: new Date(),
        },
      });

      await prisma.monitorFlowConfig.updateMany({
        where: { monitorUsername: normMonitor, followerUsername: normFollower },
        data: {
          lastActionAt: new Date(),
          lastActionType: 'COURSE_REGISTER',
          lastActionResult: isSuccess ? 'SUCCESS' : 'FAILED',
          lastActionMessage: msg,
        },
      });
    } else if (canonicalAction === 'COURSE_CANCEL') {
      if (!item.id_to_hoc) {
        throw new Error('Thiếu id_to_hoc để thực hiện Flow Hủy Môn');
      }

      const res = await cancelCourseGroupQLDTTX(creds, {
        id_to_hoc: item.id_to_hoc,
        sv_nganh: svNganh,
      });

      const isSuccess = res.success;
      const msg = isSuccess
        ? `Hủy thành công tổ [${item.nhom_to || item.id_to_hoc}]`
        : res.message || 'Hủy môn thất bại';

      await prisma.monitorFlowQueueItem.update({
        where: { id: item.id },
        data: {
          status: isSuccess ? 'SUCCESS' : 'FAILED',
          resultMessage: msg,
          resultData: JSON.stringify(res.rawResponse || {}),
          finishedAt: new Date(),
        },
      });

      await prisma.monitorFlowConfig.updateMany({
        where: { monitorUsername: normMonitor, followerUsername: normFollower },
        data: {
          lastActionAt: new Date(),
          lastActionType: 'COURSE_CANCEL',
          lastActionResult: isSuccess ? 'SUCCESS' : 'FAILED',
          lastActionMessage: msg,
        },
      });
    } else if (canonicalAction === 'COURSE_SYNC_ALL') {
      await executeSyncAllCoursesItem({ item, normMonitor, normFollower, svNganh, creds });
    }
  } catch (err: any) {
    const errMsg = err.message || 'Lỗi ngoại lệ khi thực thi';
    await prisma.monitorFlowQueueItem.update({
      where: { id: item.id },
      data: {
        status: 'FAILED',
        resultMessage: errMsg,
        finishedAt: new Date(),
      },
    });

    await prisma.monitorFlowConfig.updateMany({
      where: { monitorUsername: normMonitor, followerUsername: normFollower },
      data: {
        lastActionAt: new Date(),
        lastActionType: item.flowAction,
        lastActionResult: 'FAILED',
        lastActionMessage: errMsg,
      },
    });
  }
}
