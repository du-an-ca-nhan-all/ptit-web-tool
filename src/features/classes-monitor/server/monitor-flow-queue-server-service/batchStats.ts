import { prisma } from '@/src/lib/prisma';

/**
 * Tính toán lại số đếm (Pending, Processing, Success, Failed, Cancelled) cho 1 Batch
 */
export async function recalculateBatchCounts(batchId: string) {
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
