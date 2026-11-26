import { prisma } from '@/src/lib/prisma';
import {
  EnqueueGlobalSyncOptions,
  GLOBAL_JOB_DEFINITIONS,
} from '../../types/globalSyncQueue.types';
import { processGlobalSyncQueue } from './worker';

/**
 * Đưa tác vụ Global Sync vào hàng đợi (Queue) xử lý ngầm
 */
export async function enqueueGlobalSyncJob(options: EnqueueGlobalSyncOptions) {
  const triggeredBy = options.triggeredBy || 'ADMIN_MANUAL';
  const scheduledTime = options.scheduledTime || '22:00';

  // Nếu chọn SYNC_ALL -> Tách thành 6 batches riêng biệt (Lịch học, Bảng điểm QLDTTX, LMS, Lịch thi, Điểm S-Link, Hồ sơ SV)
  if (options.jobType === 'SYNC_ALL') {
    const resTimetable = await enqueueSingleGlobalJobType({
      ...options,
      jobType: 'SYNC_TIMETABLE',
      title: options.title ? `${options.title} - Lịch học` : undefined,
    });
    const resGrades = await enqueueSingleGlobalJobType({
      ...options,
      jobType: 'SYNC_GRADES',
      title: options.title ? `${options.title} - Bảng điểm QLDTTX` : undefined,
    });
    const resLms = await enqueueSingleGlobalJobType({
      ...options,
      jobType: 'SYNC_LMS',
      title: options.title ? `${options.title} - LMS` : undefined,
    });
    const resExams = await enqueueSingleGlobalJobType({
      ...options,
      jobType: 'SYNC_EXAMS',
      title: options.title ? `${options.title} - Lịch thi` : undefined,
    });
    const resSlink = await enqueueSingleGlobalJobType({
      ...options,
      jobType: 'SYNC_SLINK_GRADES',
      title: options.title ? `${options.title} - Điểm S-Link` : undefined,
    });
    const resProfile = await enqueueSingleGlobalJobType({
      ...options,
      jobType: 'SYNC_PROFILE',
      title: options.title ? `${options.title} - Hồ sơ SV` : undefined,
    });

    return {
      success: true,
      message: `Đã đưa 6 đợt đồng bộ (Lịch học, Điểm số QLDTTX, LMS, Lịch thi, Điểm S-Link, Hồ sơ SV) vào hàng đợi ngầm.`,
      batches: [resTimetable, resGrades, resLms, resExams, resSlink, resProfile],
      totalItems:
        (resTimetable.totalItems || 0) +
        (resGrades.totalItems || 0) +
        (resLms.totalItems || 0) +
        (resExams.totalItems || 0) +
        (resSlink.totalItems || 0) +
        (resProfile.totalItems || 0),
    };
  }

  return await enqueueSingleGlobalJobType(options);
}

/**
 * Đưa 1 loại tác vụ đơn lẻ vào Queue
 */
export async function enqueueSingleGlobalJobType(options: EnqueueGlobalSyncOptions) {
  const jobDef = GLOBAL_JOB_DEFINITIONS[options.jobType] || GLOBAL_JOB_DEFINITIONS.SYNC_TIMETABLE;
  const triggeredBy = options.triggeredBy || 'ADMIN_MANUAL';
  const scheduledTime = options.scheduledTime || '22:00';
  const isLmsJob = options.jobType === 'SYNC_LMS';
  const isSlinkJob = options.jobType === 'SYNC_SLINK_GRADES';

  // 1. Xác định danh sách sinh viên mục tiêu theo từng loại hệ thống liên kết:
  // - SYNC_TIMETABLE, SYNC_GRADES & SYNC_EXAMS: Cổng Quản Lý Đào Tạo (QLDTTX / QLHT)
  // - SYNC_LMS: Cổng LMS PTTC1
  // - SYNC_SLINK_GRADES: Cổng PTIT S-Link
  let extAccounts = await prisma.externalAccount.findMany({
    where: isLmsJob
      ? {
          OR: [
            { systemKey: 'LMS_PTTC1' },
            { systemUrl: { contains: 'lms.pttc1.edu.vn' } },
          ],
        }
      : isSlinkJob
      ? {
          OR: [
            { systemKey: 'SLINK_PTIT' },
            { systemUrl: { contains: 'slink.ptit.edu.vn' } },
          ],
        }
      : {
          systemKey: 'QLDTTX_PTTC1',
        },
    select: {
      username: true,
      extUsername: true,
      extPassword: true,
      token: true,
      refreshToken: true,
    },
  });

  // Lọc chỉ giữ các tài khoản có mật khẩu, token hoặc refreshToken (đã cấu hình hợp lệ)
  extAccounts = extAccounts.filter(
    (acc) =>
      (acc.extPassword && acc.extPassword.trim()) ||
      (acc.refreshToken && acc.refreshToken.trim()) ||
      acc.token
  );

  if (options.targetUsernames && options.targetUsernames.length > 0) {
    const targetSet = new Set(options.targetUsernames.map((u) => u.trim().toUpperCase()));
    extAccounts = extAccounts.filter((acc) => targetSet.has(acc.username.toUpperCase()));
  }

  if (extAccounts.length === 0) {
    let emptyMsg = 'Không có sinh viên nào đã liên kết tài khoản Cổng Quản Lý Đào Tạo (QLDTTX/QLHT) để thực hiện đồng bộ.';
    if (isLmsJob) {
      emptyMsg = 'Không có sinh viên nào đã liên kết tài khoản LMS PTTC1 để thực hiện đồng bộ.';
    } else if (isSlinkJob) {
      emptyMsg = 'Không có sinh viên nào đã liên kết tài khoản PTIT S-Link để thực hiện đồng bộ.';
    }

    return {
      success: false,
      message: emptyMsg,
      totalItems: 0,
      batchId: null,
    };
  }

  // 2. Lấy thông tin họ tên sinh viên
  const usernames = Array.from(new Set(extAccounts.map((a) => a.username.toUpperCase())));
  const studentsInfo = await prisma.student.findMany({
    where: { maSV: { in: usernames } },
    select: { maSV: true, hoTen: true, hoLot: true, ten: true },
  });

  const nameMap = new Map<string, string>();
  studentsInfo.forEach((st) => {
    const fullName = st.hoTen || `${st.hoLot || ''} ${st.ten || ''}`.trim() || st.maSV;
    nameMap.set(st.maSV.toUpperCase(), fullName);
  });

  // 3. Tạo Batch mới
  const nowVN = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const dateStr = `${nowVN.getDate()}/${nowVN.getMonth() + 1}/${nowVN.getFullYear()}`;
  const actionTitle =
    options.title ||
    `${jobDef.name} (${scheduledTime ? `${scheduledTime} ` : ''}${dateStr})`;

  const batch = await prisma.globalSyncBatch.create({
    data: {
      jobType: options.jobType,
      title: actionTitle,
      triggeredBy,
      scheduledTime,
      totalItems: usernames.length,
      pendingCount: usernames.length,
      status: 'PENDING',
    },
  });

  // 4. Tạo các Queue Items cho từng sinh viên
  const queueData = usernames.map((uname) => ({
    batchId: batch.id,
    username: uname,
    studentName: nameMap.get(uname) || uname,
    jobType: options.jobType,
    status: 'QUEUED',
  }));

  await prisma.globalSyncQueueItem.createMany({
    data: queueData,
  });

  // 5. Kích hoạt Background Queue Worker
  setImmediate(() => {
    processGlobalSyncQueue(batch.id).catch((err) => {
      console.error('[GlobalSyncQueueWorker] Lỗi xử lý hàng đợi ngầm:', err);
    });
  });

  return {
    success: true,
    message: `Đã đưa ${usernames.length} sinh viên vào Hàng Đợi [${jobDef.shortName}] (Batch ID: ${batch.id})`,
    batchId: batch.id,
    jobType: options.jobType,
    totalItems: usernames.length,
  };
}
