import { prisma } from '@/src/lib/prisma';
import {
  registerCourseGroupQLDTTX,
  cancelCourseGroupQLDTTX,
  fetchRegisteredCoursesFromQLDTTX,
} from '@/src/features/external-portal/server/courseRegistrationServerService';
import {
  FlowActionType,
  normalizeFlowAction,
  getFlowActionDefinition,
} from '@/src/features/classes-monitor/types/flow.types';

export interface EnqueueFlowOptions {
  monitorUsername: string;
  classCode: string;
  flowAction: FlowActionType | string;
  title?: string;
  id_to_hoc?: string;
  ma_mon?: string;
  ten_mon?: string;
  nhom_to?: string;
  sv_nganh?: number;
  targetFollowerUsernames?: string[];
}

/**
 * Đưa các tác vụ Flow vào hàng đợi (Queue) xử lý bất đồng bộ
 */
export async function enqueueFlowAction(options: EnqueueFlowOptions) {
  const normMonitor = options.monitorUsername.trim().toUpperCase();
  const normClass = options.classCode.trim().toUpperCase();
  const svNganh = options.sv_nganh ?? 1;
  const canonicalAction = normalizeFlowAction(options.flowAction);
  const actionDef = getFlowActionDefinition(canonicalAction);

  // 1. Xác định danh sách thành viên mục tiêu
  const isRegisterCategory = canonicalAction === 'COURSE_REGISTER';
  const isCancelCategory = canonicalAction === 'COURSE_CANCEL';

  const flowConfigs = await prisma.monitorFlowConfig.findMany({
    where: {
      monitorUsername: normMonitor,
      classCode: normClass,
      isEnabled: true,
      ...(isRegisterCategory ? { allowRegisterCourse: true } : {}),
      ...(isCancelCategory ? { allowCancelCourse: true } : {}),
    },
  });

  let targetConfigs = flowConfigs;
  if (options.targetFollowerUsernames && options.targetFollowerUsernames.length > 0) {
    const filterSet = new Set(options.targetFollowerUsernames.map((u) => u.trim().toUpperCase()));
    targetConfigs = targetConfigs.filter((c) => filterSet.has(c.followerUsername.toUpperCase()));
  }

  if (targetConfigs.length === 0) {
    return {
      success: false,
      message: 'Không có thành viên nào đang BẬT Flow để thực hiện hành động này.',
      totalItems: 0,
      batchId: null,
    };
  }

  // 2. Lấy thông tin họ tên sinh viên
  const followerUsernames = targetConfigs.map((c) => c.followerUsername.toUpperCase());
  const studentsInfo = await prisma.student.findMany({
    where: { maSV: { in: followerUsernames } },
    select: { maSV: true, hoTen: true, hoLot: true, ten: true },
  });

  const nameMap = new Map<string, string>();
  studentsInfo.forEach((st) => {
    const fullName = st.hoTen || `${st.hoLot || ''} ${st.ten || ''}`.trim() || st.maSV;
    nameMap.set(st.maSV.toUpperCase(), fullName);
  });

  // 3. Xử lý trường hợp "Vừa đăng ký xong lại hủy môn" hoặc thay thế tác vụ đang chờ
  // Nếu lệnh mới là CANCEL: Tìm các lệnh REGISTER đang chờ (QUEUED) của cùng môn này -> Hủy ngay để không tốn công đăng ký rồi lại hủy!
  if (isCancelCategory && options.id_to_hoc) {
    const pendingRegisters = await prisma.monitorFlowQueueItem.findMany({
      where: {
        monitorUsername: normMonitor,
        classCode: normClass,
        flowAction: { in: ['COURSE_REGISTER', 'REGISTER'] },
        id_to_hoc: String(options.id_to_hoc),
        status: 'QUEUED',
        followerUsername: { in: followerUsernames },
      },
    });

    if (pendingRegisters.length > 0) {
      const cancelItemIds = pendingRegisters.map((item) => item.id);
      await prisma.monitorFlowQueueItem.updateMany({
        where: { id: { in: cancelItemIds } },
        data: {
          status: 'CANCELLED',
          resultMessage: 'Đã hủy lệnh Đăng Ký trong Queue do Lớp trưởng vừa gửi lệnh HỦY môn này',
          finishedAt: new Date(),
        },
      });

      const affectedBatchIds = [...new Set(pendingRegisters.map((i) => i.batchId))];
      for (const bId of affectedBatchIds) {
        await recalculateBatchCounts(bId);
      }
    }
  }

  // Nếu lệnh mới là REGISTER: Tìm các lệnh CANCEL đang chờ (QUEUED) của cùng môn này -> Hủy lệnh cancel cũ
  if (isRegisterCategory && options.id_to_hoc) {
    const pendingCancels = await prisma.monitorFlowQueueItem.findMany({
      where: {
        monitorUsername: normMonitor,
        classCode: normClass,
        flowAction: { in: ['COURSE_CANCEL', 'CANCEL'] },
        id_to_hoc: String(options.id_to_hoc),
        status: 'QUEUED',
        followerUsername: { in: followerUsernames },
      },
    });

    if (pendingCancels.length > 0) {
      const cancelItemIds = pendingCancels.map((item) => item.id);
      await prisma.monitorFlowQueueItem.updateMany({
        where: { id: { in: cancelItemIds } },
        data: {
          status: 'CANCELLED',
          resultMessage: 'Đã hủy lệnh Hủy cũ do Lớp trưởng vừa gửi lệnh ĐĂNG KÝ mới',
          finishedAt: new Date(),
        },
      });

      const affectedBatchIds = [...new Set(pendingCancels.map((i) => i.batchId))];
      for (const bId of affectedBatchIds) {
        await recalculateBatchCounts(bId);
      }
    }
  }

  // 4. Tạo Batch mới
  const actionTitle =
    options.title ||
    (canonicalAction === 'COURSE_REGISTER'
      ? `Flow Đăng Ký [${options.ma_mon || options.ten_mon || options.id_to_hoc}] ${options.nhom_to ? `(Nhóm ${options.nhom_to})` : ''}`
      : canonicalAction === 'COURSE_CANCEL'
      ? `Flow Hủy Môn [${options.ma_mon || options.ten_mon || options.id_to_hoc}]`
      : canonicalAction === 'COURSE_SYNC_ALL'
      ? `Đồng Bộ 2 Chiều Toàn Bộ Môn Học Khớp 100%`
      : `${actionDef.name}`);

  const batch = await prisma.monitorFlowBatch.create({
    data: {
      classCode: normClass,
      monitorUsername: normMonitor,
      flowAction: canonicalAction,
      title: actionTitle,
      id_to_hoc: options.id_to_hoc || null,
      ma_mon: options.ma_mon || null,
      ten_mon: options.ten_mon || null,
      nhom_to: options.nhom_to || null,
      totalItems: targetConfigs.length,
      pendingCount: targetConfigs.length,
      status: 'PENDING',
    },
  });

  // 5. Tạo các Queue Item cho từng thành viên
  const queueData = targetConfigs.map((cfg) => {
    const sv = cfg.followerUsername.toUpperCase();
    return {
      batchId: batch.id,
      classCode: normClass,
      monitorUsername: normMonitor,
      followerUsername: sv,
      followerName: nameMap.get(sv) || sv,
      flowAction: canonicalAction,
      id_to_hoc: options.id_to_hoc || null,
      ma_mon: options.ma_mon || null,
      ten_mon: options.ten_mon || null,
      nhom_to: options.nhom_to || null,
      sv_nganh: svNganh,
      status: 'QUEUED',
    };
  });

  await prisma.monitorFlowQueueItem.createMany({
    data: queueData,
  });

  // 6. Kích hoạt Background Queue Worker (Không chặn luồng response của HTTP)
  setImmediate(() => {
    processFlowQueue(batch.id).catch((err) => {
      console.error('[FlowQueueWorker] Error processing queue in background:', err);
    });
  });

  return {
    success: true,
    message: `Đã đưa ${targetConfigs.length} tác vụ Flow vào Hàng Đợi xử lý ngầm (Batch ID: ${batch.id})`,
    batchId: batch.id,
    totalItems: targetConfigs.length,
  };
}

/**
 * Tự động quét và phục hồi các tác vụ bị kẹt ở trạng thái RUNNING
 * (Xảy ra khi server/app bị tắt đột ngột, khởi động lại hoặc crash trong lúc đang chạy)
 */
export async function recoverStuckFlowQueueItems(options?: {
  classCode?: string;
  monitorUsername?: string;
  batchId?: string;
  maxStuckMinutes?: number;
  autoResumeWorker?: boolean;
}) {
  const whereClause: any = {
    status: 'RUNNING',
  };

  if (options?.classCode) whereClause.classCode = options.classCode.toUpperCase();
  if (options?.monitorUsername) whereClause.monitorUsername = options.monitorUsername.toUpperCase();
  if (options?.batchId) whereClause.batchId = options.batchId;
  if (options?.maxStuckMinutes && options.maxStuckMinutes > 0) {
    const cutoff = new Date(Date.now() - options.maxStuckMinutes * 60 * 1000);
    whereClause.OR = [
      { startedAt: { lte: cutoff } },
      { startedAt: null },
    ];
  }

  const stuckItems = await prisma.monitorFlowQueueItem.findMany({
    where: whereClause,
    select: { id: true, batchId: true, attempts: true, maxAttempts: true },
  });

  let recoveredCount = 0;
  let failedCount = 0;

  if (stuckItems.length > 0) {
    const toQueueIds: string[] = [];
    const toFailIds: string[] = [];

    for (const item of stuckItems) {
      if (item.attempts >= item.maxAttempts) {
        toFailIds.push(item.id);
        failedCount++;
      } else {
        toQueueIds.push(item.id);
        recoveredCount++;
      }
    }

    if (toFailIds.length > 0) {
      await prisma.monitorFlowQueueItem.updateMany({
        where: { id: { in: toFailIds } },
        data: {
          status: 'FAILED',
          resultMessage: 'Tác vụ bị gián đoạn do ứng dụng bị tắt / khởi động lại (đã vượt quá số lần thử)',
          finishedAt: new Date(),
        },
      });
    }

    if (toQueueIds.length > 0) {
      await prisma.monitorFlowQueueItem.updateMany({
        where: { id: { in: toQueueIds } },
        data: {
          status: 'QUEUED',
          startedAt: null,
          resultMessage: 'Được phục hồi vào hàng đợi sau khi ứng dụng khởi động lại',
        },
      });
    }

    const affectedBatchIds = [...new Set(stuckItems.map((i) => i.batchId))];
    for (const bId of affectedBatchIds) {
      await recalculateBatchCounts(bId);
    }
  }

  // Tự động kích hoạt worker chạy tiếp nếu có bất kỳ item nào đang QUEUED và worker chưa chạy
  if (options?.autoResumeWorker !== false) {
    const queuedCount = await prisma.monitorFlowQueueItem.count({
      where: {
        status: 'QUEUED',
        ...(options?.batchId ? { batchId: options.batchId } : {}),
      },
    });

    if (queuedCount > 0 && !isWorkerRunning) {
      setImmediate(() => {
        processFlowQueue(options?.batchId).catch((err) => {
          console.error('[FlowQueue] Error auto-resuming worker after recovery:', err);
        });
      });
    }
  }

  return { recoveredCount, failedCount, totalStuck: stuckItems.length };
}

/**
 * Worker chạy ngầm xử lý các tác vụ trong Hàng Đợi (Queue)
 * Chạy đồng thời với số luồng kiểm soát (Concurrency = 3-4) và delay để tránh quá tải cổng QLDTTX
 */
let isWorkerRunning = false;

export async function processFlowQueue(specificBatchId?: string) {
  if (isWorkerRunning) {
    return { status: 'ALREADY_RUNNING' };
  }

  // Tự động phục hồi các item bị kẹt RUNNING từ lần chạy trước / do server restart
  try {
    await recoverStuckFlowQueueItems({
      batchId: specificBatchId,
      autoResumeWorker: false,
    });
  } catch (recoverErr) {
    console.error('[FlowQueueWorker] Error recovering stuck items before starting:', recoverErr);
  }

  isWorkerRunning = true;
  const CONCURRENCY = 3; // Xử lý đồng thời 3 sinh viên cùng lúc
  const DELAY_BETWEEN_CHUNKS_MS = 600; // Nghỉ 600ms giữa các chunk để tránh bị QLDTTX chặn

  try {
    let hasMore = true;

    while (hasMore) {
      // 1. Lấy các item đang QUEUED theo thứ tự thời gian tạo (FIFO)
      const queuedItems = await prisma.monitorFlowQueueItem.findMany({
        where: {
          status: 'QUEUED',
          ...(specificBatchId ? { batchId: specificBatchId } : {}),
        },
        take: CONCURRENCY,
        orderBy: { createdAt: 'asc' },
        include: { batch: true },
      });

      if (queuedItems.length === 0) {
        hasMore = false;
        break;
      }

      // Đánh dấu các item này chuyển sang RUNNING và tăng số lần thử (attempts)
      const itemIds = queuedItems.map((i) => i.id);
      await prisma.monitorFlowQueueItem.updateMany({
        where: { id: { in: itemIds } },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
          attempts: { increment: 1 },
        },
      });

      // Cập nhật trạng thái các Batch liên quan
      const batchIds = [...new Set(queuedItems.map((i) => i.batchId))];
      await prisma.monitorFlowBatch.updateMany({
        where: { id: { in: batchIds }, status: 'PENDING' },
        data: { status: 'PROCESSING' },
      });

      // 2. Chạy đồng thời cho từng item trong chunk
      await Promise.all(
        queuedItems.map(async (item) => {
          await processSingleQueueItem(item);
        })
      );

      // Cập nhật lại thống kê số lượng cho các batch
      for (const bId of batchIds) {
        await recalculateBatchCounts(bId);
      }

      // Nghỉ nhẹ giữa các chunk
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_CHUNKS_MS));
    }
  } catch (err) {
    console.error('[FlowQueueWorker] Fatal error in processFlowQueue:', err);
  } finally {
    isWorkerRunning = false;
  }

  return { status: 'DONE' };
}

/**
 * Xử lý 1 tác vụ đơn lẻ của 1 sinh viên trong Queue
 */
async function processSingleQueueItem(item: any) {
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
      for (const [idToHoc, _] of followerToHocMap.entries()) {
        if (!monitorToHocMap.has(idToHoc)) {
          try {
            const cancelRes = await cancelCourseGroupQLDTTX(creds, {
              id_to_hoc: idToHoc,
              sv_nganh: svNganh,
            });
            if (cancelRes.success) cancelSuccess++;
            else cancelFail++;
          } catch {
            cancelFail++;
          }
        }
      }

      // 4. Đăng ký môn thiếu
      for (const [idToHoc, _] of monitorToHocMap.entries()) {
        if (!followerToHocMap.has(idToHoc)) {
          try {
            const regRes = await registerCourseGroupQLDTTX(creds, {
              id_to_hoc: idToHoc,
              sv_nganh: svNganh,
            });
            if (regRes.success) regSuccess++;
            else regFail++;
          } catch {
            regFail++;
          }
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

/**
 * Tính toán lại số đếm (Pending, Processing, Success, Failed, Cancelled) cho 1 Batch
 */
async function recalculateBatchCounts(batchId: string) {
  const items = await prisma.monitorFlowQueueItem.findMany({
    where: { batchId },
    select: { status: true },
  });

  let pendingCount = 0;
  let processingCount = 0;
  let successCount = 0;
  let failedCount = 0;
  let cancelledCount = 0;

  for (const it of items) {
    if (it.status === 'QUEUED') pendingCount++;
    else if (it.status === 'RUNNING') processingCount++;
    else if (it.status === 'SUCCESS') successCount++;
    else if (it.status === 'FAILED') failedCount++;
    else if (it.status === 'CANCELLED' || it.status === 'SKIPPED') cancelledCount++;
  }

  const isCompleted = pendingCount === 0 && processingCount === 0;
  let batchStatus = 'PROCESSING';
  if (isCompleted) {
    batchStatus = failedCount > 0 && successCount === 0 ? 'FAILED' : 'COMPLETED';
  } else if (processingCount === 0 && pendingCount > 0) {
    batchStatus = 'PENDING';
  }

  await prisma.monitorFlowBatch.update({
    where: { id: batchId },
    data: {
      totalItems: items.length,
      pendingCount,
      processingCount,
      successCount,
      failedCount,
      cancelledCount,
      status: batchStatus,
    },
  });
}

/**
 * Lấy danh sách Batch và các Queue Item gần nhất
 */
export async function getFlowQueueStatus(options: {
  monitorUsername?: string;
  classCode?: string;
  batchId?: string;
  limit?: number;
}) {
  const limit = options.limit || 50;
  const whereClause: any = {};

  if (options.classCode) whereClause.classCode = options.classCode.toUpperCase();
  if (options.monitorUsername) whereClause.monitorUsername = options.monitorUsername.toUpperCase();

  // Nếu worker không chạy nhưng có item RUNNING hoặc QUEUED, tự động khôi phục và tiếp tục chạy worker
  if (!isWorkerRunning) {
    const activeCount = await prisma.monitorFlowQueueItem.count({
      where: { ...whereClause, status: { in: ['RUNNING', 'QUEUED'] } },
    });
    if (activeCount > 0) {
      await recoverStuckFlowQueueItems({
        classCode: options.classCode,
        monitorUsername: options.monitorUsername,
        batchId: options.batchId,
        autoResumeWorker: true,
      });
    }
  }

  // 1. Lấy danh sách Batches
  const batches = await prisma.monitorFlowBatch.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      _count: {
        select: { queueItems: true },
      },
    },
  });

  // 2. Lấy danh sách Items
  const itemsWhere: any = { ...whereClause };
  if (options.batchId) itemsWhere.batchId = options.batchId;

  const queueItems = await prisma.monitorFlowQueueItem.findMany({
    where: itemsWhere,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  // 3. Thống kê tổng quan toàn bộ hàng đợi
  const totalQueued = await prisma.monitorFlowQueueItem.count({
    where: { ...whereClause, status: 'QUEUED' },
  });
  const totalRunning = await prisma.monitorFlowQueueItem.count({
    where: { ...whereClause, status: 'RUNNING' },
  });
  const totalSuccess = await prisma.monitorFlowQueueItem.count({
    where: { ...whereClause, status: 'SUCCESS' },
  });
  const totalFailed = await prisma.monitorFlowQueueItem.count({
    where: { ...whereClause, status: 'FAILED' },
  });
  const totalCancelled = await prisma.monitorFlowQueueItem.count({
    where: {
      ...whereClause,
      status: { in: ['CANCELLED', 'SKIPPED'] },
    },
  });

  return {
    success: true,
    isWorkerRunning,
    stats: {
      totalQueued,
      totalRunning,
      totalSuccess,
      totalFailed,
      totalCancelled,
      totalItems: totalQueued + totalRunning + totalSuccess + totalFailed + totalCancelled,
    },
    batches,
    queueItems,
  };
}

/**
 * Hủy các tác vụ đang chờ hoặc đang chạy trong Queue
 */
export async function cancelPendingFlowQueue(options: {
  monitorUsername: string;
  classCode: string;
  batchId?: string;
}) {
  const normMonitor = options.monitorUsername.toUpperCase();
  const normClass = options.classCode.toUpperCase();

  const whereClause: any = {
    monitorUsername: normMonitor,
    classCode: normClass,
    status: { in: ['QUEUED', 'RUNNING'] },
  };

  if (options.batchId) {
    whereClause.batchId = options.batchId;
  }

  const updated = await prisma.monitorFlowQueueItem.updateMany({
    where: whereClause,
    data: {
      status: 'CANCELLED',
      resultMessage: 'Đã bị Lớp trưởng hủy bỏ thủ công',
      finishedAt: new Date(),
    },
  });

  // Cập nhật lại các batch
  const activeBatches = await prisma.monitorFlowBatch.findMany({
    where: {
      monitorUsername: normMonitor,
      classCode: normClass,
      ...(options.batchId ? { id: options.batchId } : {}),
    },
    select: { id: true },
  });

  for (const b of activeBatches) {
    await recalculateBatchCounts(b.id);
  }

  return { success: true, cancelledCount: updated.count };
}

/**
 * Chạy lại các tác vụ bị lỗi hoặc bị hủy (FAILED | CANCELLED -> QUEUED)
 */
export async function retryFailedFlowQueue(options: {
  monitorUsername: string;
  classCode: string;
  batchId?: string;
}) {
  const normMonitor = options.monitorUsername.toUpperCase();
  const normClass = options.classCode.toUpperCase();

  const whereClause: any = {
    monitorUsername: normMonitor,
    classCode: normClass,
    status: { in: ['FAILED', 'CANCELLED'] },
  };

  if (options.batchId) {
    whereClause.batchId = options.batchId;
  }

  const updated = await prisma.monitorFlowQueueItem.updateMany({
    where: whereClause,
    data: {
      status: 'QUEUED',
      resultMessage: null,
      startedAt: null,
      finishedAt: null,
    },
  });

  // Cập nhật lại các batch
  const activeBatches = await prisma.monitorFlowBatch.findMany({
    where: {
      monitorUsername: normMonitor,
      classCode: normClass,
      ...(options.batchId ? { id: options.batchId } : {}),
    },
    select: { id: true },
  });

  for (const b of activeBatches) {
    await recalculateBatchCounts(b.id);
  }

  // Kích hoạt lại worker
  setImmediate(() => {
    processFlowQueue(options.batchId).catch(console.error);
  });

  return { success: true, retriedCount: updated.count };
}

/**
 * Dọn dẹp các Batch và Queue Item đã hoàn thành
 */
export async function clearCompletedFlowBatches(options: {
  monitorUsername: string;
  classCode: string;
}) {
  const normMonitor = options.monitorUsername.toUpperCase();
  const normClass = options.classCode.toUpperCase();

  const deletedBatches = await prisma.monitorFlowBatch.deleteMany({
    where: {
      monitorUsername: normMonitor,
      classCode: normClass,
      status: { in: ['COMPLETED', 'CANCELLED', 'FAILED'] },
    },
  });

  return { success: true, deletedCount: deletedBatches.count };
}
