import { prisma } from '@/src/lib/prisma';
import { GlobalJobType } from '../../types/globalSyncQueue.types';
import {
  executeTimetableSync,
  executeGradesSync,
  executeLmsSync,
  executeExamsSync,
  executeSlinkGradesSync,
  executeProfileSync,
} from './jobExecutors';

/**
 * Xử lý 1 tác vụ đơn lẻ của sinh viên trong Global Queue
 */
export async function processSingleGlobalSyncItem(item: any) {
  const normUsername = item.username.toUpperCase();
  const jobType = item.jobType as GlobalJobType;
  const isLmsJob = jobType === 'SYNC_LMS';
  const isSlinkJob = jobType === 'SYNC_SLINK_GRADES';

  // Kiểm tra tài khoản ExternalAccount tương ứng với loại Job:
  // - SYNC_TIMETABLE, SYNC_GRADES & SYNC_EXAMS: Cần tài khoản QLDTTX (qlht)
  // - SYNC_LMS: Cần tài khoản LMS PTTC1
  // - SYNC_SLINK_GRADES: Cần tài khoản PTIT S-Link
  const extAcc = await prisma.externalAccount.findFirst({
    where: isLmsJob
      ? {
          username: normUsername,
          OR: [
            { systemKey: 'LMS_PTTC1' },
            { systemUrl: { contains: 'lms.pttc1.edu.vn' } },
          ],
        }
      : isSlinkJob
      ? {
          username: normUsername,
          OR: [
            { systemKey: 'SLINK_PTIT' },
            { systemUrl: { contains: 'slink.ptit.edu.vn' } },
          ],
        }
      : {
          username: normUsername,
          systemKey: 'QLDTTX_PTTC1',
        },
  });

  if (!extAcc || (!extAcc.extPassword && !extAcc.token && !extAcc.refreshToken)) {
    let msg = 'Bỏ qua: Sinh viên chưa liên kết tài khoản Cổng Quản Lý Đào Tạo (QLDTTX / QLHT)';
    if (isLmsJob) {
      msg = 'Bỏ qua: Sinh viên chưa liên kết tài khoản Hệ thống học tập trực tuyến (LMS PTTC1)';
    } else if (isSlinkJob) {
      msg = 'Bỏ qua: Sinh viên chưa liên kết tài khoản PTIT S-Link';
    }

    await prisma.globalSyncQueueItem.update({
      where: { id: item.id },
      data: {
        status: 'SKIPPED',
        resultMessage: msg,
        finishedAt: new Date(),
      },
    });
    return;
  }

  try {
    // 1. TÁC VỤ 1: ĐỒNG BỘ LỊCH HỌC & THỜI KHÓA BIỂU
    if (jobType === 'SYNC_TIMETABLE') {
      await executeTimetableSync(item.id, normUsername);
    }

    // 2. TÁC VỤ 2: ĐỒNG BỘ BẢNG ĐIỂM & KẾT QUẢ HỌC TẬP
    else if (jobType === 'SYNC_GRADES') {
      await executeGradesSync(item.id, normUsername);
    }

    // 3. TÁC VỤ 3: ĐỒNG BỘ KẾT QUẢ HỌC TẬP LMS PTTC1
    else if (jobType === 'SYNC_LMS') {
      await executeLmsSync(item.id, normUsername);
    }

    // 4. TÁC VỤ 4: ĐỒNG BỘ LỊCH THI CÁ NHÂN & QUÉT BIẾN ĐỘNG CA THI (QLDTTX)
    else if (jobType === 'SYNC_EXAMS' || jobType === 'SYNC_TODAY_EXAMS') {
      await executeExamsSync(item.id, normUsername, jobType);
    }

    // 5. TÁC VỤ 5: ĐỒNG BỘ KẾT QUẢ HỌC TẬP PTIT S-LINK
    else if (jobType === 'SYNC_SLINK_GRADES') {
      await executeSlinkGradesSync(item.id, normUsername);
    }

    // 6. TÁC VỤ 6: ĐỒNG BỘ THÔNG TIN CÁ NHÂN SINH VIÊN TỪ QLHT (w-locsinhvieninfo)
    else if (jobType === 'SYNC_PROFILE') {
      await executeProfileSync(item.id, normUsername, extAcc);
    }
  } catch (err: any) {
    const errorMsg = err.message || 'Lỗi không xác định khi thực hiện đồng bộ';
    await prisma.globalSyncQueueItem.update({
      where: { id: item.id },
      data: {
        status: 'FAILED',
        attempts: (item.attempts || 0) + 1,
        resultMessage: errorMsg,
        finishedAt: new Date(),
      },
    });
  }
}
