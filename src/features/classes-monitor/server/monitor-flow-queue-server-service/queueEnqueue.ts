import { prisma } from '@/src/lib/prisma';
import {
  normalizeFlowAction,
  getFlowActionDefinition,
} from '@/src/features/classes-monitor/types/flow.types';
import type { EnqueueFlowOptions } from './types';
import { recalculateBatchCounts } from './batchStats';
import { processFlowQueue } from './queueWorker';

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
