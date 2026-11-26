import { prisma } from '@/src/lib/prisma';
import type {
  GetFlowQueueStatusOptions,
  FlowQueueBatchActionOptions,
  ClearCompletedFlowBatchesOptions,
} from './types';
import { getIsWorkerRunning } from './workerState';
import { recalculateBatchCounts } from './batchStats';
import { recoverStuckFlowQueueItems, processFlowQueue } from './queueWorker';

/**
 * Lấy danh sách Batch và các Queue Item gần nhất
 */
export async function getFlowQueueStatus(options: GetFlowQueueStatusOptions) {
  const limit = options.limit || 50;
  const whereClause: any = {};

  if (options.classCode) whereClause.classCode = options.classCode.toUpperCase();
  if (options.monitorUsername) whereClause.monitorUsername = options.monitorUsername.toUpperCase();

  // Nếu worker không chạy nhưng có item RUNNING hoặc QUEUED, tự động khôi phục và tiếp tục chạy worker
  if (!getIsWorkerRunning()) {
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
    isWorkerRunning: getIsWorkerRunning(),
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
export async function cancelPendingFlowQueue(options: FlowQueueBatchActionOptions) {
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
export async function retryFailedFlowQueue(options: FlowQueueBatchActionOptions) {
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
export async function clearCompletedFlowBatches(options: ClearCompletedFlowBatchesOptions) {
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
