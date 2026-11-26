import { prisma } from '@/src/lib/prisma';
import {
  registerCourseGroupQLDTTX,
  cancelCourseGroupQLDTTX,
  fetchRegisteredCoursesFromQLDTTX,
} from '@/src/features/external-portal/server/courseRegistrationServerService';
import type { QldttxCredentials } from './types';

export interface ExecuteSyncAllCoursesItemParams {
  item: any;
  normMonitor: string;
  normFollower: string;
  svNganh: number;
  creds: QldttxCredentials;
}

export async function executeSyncAllCoursesItem({
  item,
  normMonitor,
  normFollower,
  svNganh,
  creds,
}: ExecuteSyncAllCoursesItemParams) {
  // 1. Lấy danh sách môn của Lớp trưởng
  const monitorExtAcc = await prisma.externalAccount.findFirst({
    where: { username: normMonitor, systemKey: 'QLDTTX_PTTC1' },
  });

  let monitorRegisteredCourses: any[] = [];
  if (monitorExtAcc) {
    const monRes = await fetchRegisteredCoursesFromQLDTTX({
      username: monitorExtAcc.extUsername,
      password: monitorExtAcc.extPassword,
      token: monitorExtAcc.token,
    });
    monitorRegisteredCourses = monRes.ds_kqdkmh || [];
  }

  // 2. Lấy danh sách môn của sinh viên
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

  let regSuccess = 0;
  let regFail = 0;
  let cancelSuccess = 0;
  let cancelFail = 0;

  // 3. Hủy môn thừa
  for (const [idToHoc] of followerToHocMap.entries()) {
    if (monitorToHocMap.has(idToHoc)) continue;
    try {
      const cancelRes = await cancelCourseGroupQLDTTX(creds, { id_to_hoc: idToHoc, sv_nganh: svNganh });
      if (cancelRes.success) cancelSuccess++;
      else cancelFail++;
    } catch {
      cancelFail++;
    }
  }

  // 4. Đăng ký môn thiếu
  for (const [idToHoc] of monitorToHocMap.entries()) {
    if (followerToHocMap.has(idToHoc)) continue;
    try {
      const regRes = await registerCourseGroupQLDTTX(creds, { id_to_hoc: idToHoc, sv_nganh: svNganh });
      if (regRes.success) regSuccess++;
      else regFail++;
    } catch {
      regFail++;
    }
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

  const isSuccess = !hasErrors || (regSuccess > 0 || cancelSuccess > 0) || isMatched;

  await prisma.monitorFlowQueueItem.update({
    where: { id: item.id },
    data: {
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      resultMessage: summaryMsg,
      finishedAt: new Date(),
    },
  });

  await prisma.monitorFlowConfig.updateMany({
    where: { monitorUsername: normMonitor, followerUsername: normFollower },
    data: {
      lastActionAt: new Date(),
      lastActionType: 'SYNC_ALL_COURSES',
      lastActionResult: isSuccess ? 'SUCCESS' : 'PARTIAL',
      lastActionMessage: summaryMsg,
    },
  });
}
