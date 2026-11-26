import { prisma } from '@/src/lib/prisma';

/**
 * Tính toán lại số lượng và trạng thái của Global Batch
 */
export async function recalculateGlobalBatchCounts(batchId: string) {
  const [
    total,
    queued,
    running,
    success,
    failed,
    cancelled,
    skipped,
  ] = await Promise.all([
    prisma.globalSyncQueueItem.count({ where: { batchId } }),
    prisma.globalSyncQueueItem.count({ where: { batchId, status: 'QUEUED' } }),
    prisma.globalSyncQueueItem.count({ where: { batchId, status: 'RUNNING' } }),
    prisma.globalSyncQueueItem.count({ where: { batchId, status: 'SUCCESS' } }),
    prisma.globalSyncQueueItem.count({ where: { batchId, status: 'FAILED' } }),
    prisma.globalSyncQueueItem.count({ where: { batchId, status: 'CANCELLED' } }),
    prisma.globalSyncQueueItem.count({ where: { batchId, status: 'SKIPPED' } }),
  ]);

  let status = 'PROCESSING';
  if (queued === 0 && running === 0) {
    if (total === 0) {
      status = 'COMPLETED';
    } else if (success === total || success + skipped === total) {
      status = 'COMPLETED';
    } else if (cancelled === total) {
      status = 'CANCELLED';
    } else if (failed === total) {
      status = 'FAILED';
    } else {
      status = 'COMPLETED'; // Hoàn tất có lỗi
    }
  } else if (running === 0 && queued === total) {
    status = 'PENDING';
  }

  const updatedBatch = await prisma.globalSyncBatch.update({
    where: { id: batchId },
    data: {
      totalItems: total,
      pendingCount: queued,
      processingCount: running,
      successCount: success,
      failedCount: failed,
      cancelledCount: cancelled,
      skippedCount: skipped,
      status,
      ...(status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED'
        ? { finishedAt: new Date() }
        : {}),
    },
  });

  return updatedBatch;
}
