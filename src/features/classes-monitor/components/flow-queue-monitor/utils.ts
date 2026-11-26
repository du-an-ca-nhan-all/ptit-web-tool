import { FlowBatchItem, FlowQueueJobItem } from './types';

export function filterQueueItems(
  queueItems: FlowQueueJobItem[],
  searchQuery: string,
  statusFilter: string
): FlowQueueJobItem[] {
  const query = searchQuery.trim().toLowerCase();
  return queueItems.filter((item) => {
    const matchQuery =
      !query ||
      item.followerUsername.toLowerCase().includes(query) ||
      (item.followerName && item.followerName.toLowerCase().includes(query)) ||
      (item.ten_mon && item.ten_mon.toLowerCase().includes(query)) ||
      (item.ma_mon && item.ma_mon.toLowerCase().includes(query));

    if (!matchQuery) return false;

    if (statusFilter === 'QUEUED') return item.status === 'QUEUED';
    if (statusFilter === 'RUNNING') return item.status === 'RUNNING';
    if (statusFilter === 'SUCCESS') return item.status === 'SUCCESS';
    if (statusFilter === 'FAILED') return item.status === 'FAILED';
    if (statusFilter === 'CANCELLED') {
      return item.status === 'CANCELLED' || item.status === 'SKIPPED';
    }

    return true;
  });
}

export function findActiveBatch(
  batches: FlowBatchItem[],
  selectedBatchId: string | null
): FlowBatchItem | null {
  if (!selectedBatchId) return batches[0] || null;
  return batches.find((b) => b.id === selectedBatchId) || null;
}

export function calculateBatchProgress(activeBatch: FlowBatchItem | null): number {
  if (!activeBatch || activeBatch.totalItems === 0) return 0;
  const finished =
    activeBatch.successCount + activeBatch.failedCount + activeBatch.cancelledCount;
  return Math.round((finished / activeBatch.totalItems) * 100);
}
