import { prisma } from '@/src/lib/prisma';
import type { RecoverStuckFlowQueueOptions } from './types';
import {
  FLOW_QUEUE_CONCURRENCY,
  DELAY_BETWEEN_CHUNKS_MS,
  getIsWorkerRunning,
  setIsWorkerRunning,
} from './workerState';
import { recalculateBatchCounts } from './batchStats';
import { processSingleQueueItem } from './queueItemProcessor';

/**
 * Tự động quét và phục hồi các tác vụ bị kẹt ở trạng thái RUNNING
 * (Xảy ra khi server/app bị tắt đột ngột, khởi động lại hoặc crash trong lúc đang chạy)
 */
export async function recoverStuckFlowQueueItems(options?: RecoverStuckFlowQueueOptions) {
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

    if (queuedCount > 0 && !getIsWorkerRunning()) {
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
export async function processFlowQueue(specificBatchId?: string) {
  if (getIsWorkerRunning()) {
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

  setIsWorkerRunning(true);

  try {
    let hasMore = true;

    while (hasMore) {
      // 1. Lấy các item đang QUEUED theo thứ tự thời gian tạo (FIFO)
      const queuedItems = await prisma.monitorFlowQueueItem.findMany({
        where: {
          status: 'QUEUED',
          ...(specificBatchId ? { batchId: specificBatchId } : {}),
        },
        take: FLOW_QUEUE_CONCURRENCY,
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
    setIsWorkerRunning(false);
  }

  return { status: 'DONE' };
}
