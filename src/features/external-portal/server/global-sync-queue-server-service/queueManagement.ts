import { prisma } from '@/src/lib/prisma';
import {
  getGlobalConfig,
  GlobalNightlySyncConfigValue,
  GLOBAL_CONFIG_KEYS,
} from '@/src/lib/globalConfig';
import { getNormalizedGlobalSyncConfig } from './config';
import { recalculateGlobalBatchCounts } from './batchCounts';
import {
  getIsGlobalSyncWorkerRunning,
  recoverStuckGlobalSyncQueueItems,
  processGlobalSyncQueue,
} from './worker';

/**
 * Lấy trạng thái hàng đợi và danh sách batches gần nhất
 */
export async function getGlobalSyncQueueStatus(options?: {
  batchId?: string;
  jobType?: string;
  limit?: number;
}) {
  const limit = options?.limit || 20;

  // Nếu worker không chạy nhưng có item RUNNING hoặc QUEUED, tự động khôi phục và tiếp tục chạy worker
  if (!getIsGlobalSyncWorkerRunning()) {
    const activeCount = await prisma.globalSyncQueueItem.count({
      where: {
        ...(options?.batchId ? { batchId: options.batchId } : {}),
        status: { in: ['RUNNING', 'QUEUED'] },
      },
    });
    if (activeCount > 0) {
      await recoverStuckGlobalSyncQueueItems({
        batchId: options?.batchId,
        autoResumeWorker: true,
      });
    }
  }

  const [batches, activeBatch, queueItems, totalStats] = await Promise.all([
    prisma.globalSyncBatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(options?.jobType ? { where: { jobType: options.jobType } } : {}),
    }),
    options?.batchId
      ? prisma.globalSyncBatch.findUnique({ where: { id: options.batchId } })
      : prisma.globalSyncBatch.findFirst({ orderBy: { createdAt: 'desc' } }),
    prisma.globalSyncQueueItem.findMany({
      where: {
        ...(options?.batchId ? { batchId: options.batchId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.globalSyncQueueItem.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
  ]);

  const statsMap: Record<string, number> = {
    QUEUED: 0,
    RUNNING: 0,
    SUCCESS: 0,
    FAILED: 0,
    CANCELLED: 0,
    SKIPPED: 0,
  };

  totalStats.forEach((st) => {
    statsMap[st.status] = st._count.id;
  });

  const rawConfig = await getGlobalConfig<GlobalNightlySyncConfigValue>(GLOBAL_CONFIG_KEYS.GLOBAL_NIGHTLY_SYNC);
  const config = getNormalizedGlobalSyncConfig(rawConfig);

  return {
    batches,
    activeBatch,
    queueItems,
    stats: statsMap,
    isWorkerRunning: getIsGlobalSyncWorkerRunning(),
    config,
  };
}

/**
 * Hủy các tác vụ đang chờ hoặc đang chạy trong Queue
 */
export async function cancelPendingGlobalQueue(batchId?: string) {
  const whereClause = {
    status: { in: ['QUEUED', 'RUNNING'] },
    ...(batchId ? { batchId } : {}),
  };

  const pendingItems = await prisma.globalSyncQueueItem.findMany({
    where: whereClause,
    select: { id: true, batchId: true },
  });

  if (pendingItems.length === 0) {
    return { cancelledCount: 0 };
  }

  const ids = pendingItems.map((i) => i.id);
  await prisma.globalSyncQueueItem.updateMany({
    where: { id: { in: ids } },
    data: {
      status: 'CANCELLED',
      resultMessage: 'Đã hủy theo yêu cầu của Quản trị viên',
      finishedAt: new Date(),
    },
  });

  const affectedBatchIds = [...new Set(pendingItems.map((i) => i.batchId))];
  for (const bId of affectedBatchIds) {
    await recalculateGlobalBatchCounts(bId);
  }

  return { cancelledCount: pendingItems.length };
}

/**
 * Thử lại các tác vụ bị lỗi trong Queue
 */
export async function retryFailedGlobalQueue(batchId?: string) {
  const whereClause = {
    status: { in: ['FAILED', 'CANCELLED'] },
    ...(batchId ? { batchId } : {}),
  };

  const failedItems = await prisma.globalSyncQueueItem.findMany({
    where: whereClause,
    select: { id: true, batchId: true },
  });

  if (failedItems.length === 0) {
    return { retriedCount: 0 };
  }

  const ids = failedItems.map((i) => i.id);
  await prisma.globalSyncQueueItem.updateMany({
    where: { id: { in: ids } },
    data: {
      status: 'QUEUED',
      resultMessage: 'Đang chờ thử lại trong hàng đợi...',
      finishedAt: null,
    },
  });

  const affectedBatchIds = [...new Set(failedItems.map((i) => i.batchId))];
  for (const bId of affectedBatchIds) {
    await recalculateGlobalBatchCounts(bId);
  }

  // Kích hoạt lại worker
  setImmediate(() => {
    processGlobalSyncQueue().catch(console.error);
  });

  return { retriedCount: failedItems.length };
}

/**
 * Xóa các batch đã hoàn thành
 */
export async function clearCompletedGlobalBatches() {
  const completedBatches = await prisma.globalSyncBatch.findMany({
    where: {
      status: { in: ['COMPLETED', 'CANCELLED', 'FAILED'] },
    },
    select: { id: true },
  });

  if (completedBatches.length === 0) {
    return { deletedCount: 0 };
  }

  const batchIds = completedBatches.map((b) => b.id);
  await prisma.globalSyncBatch.deleteMany({
    where: { id: { in: batchIds } },
  });

  return { deletedCount: batchIds.length };
}
