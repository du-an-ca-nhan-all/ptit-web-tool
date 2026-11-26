import { GlobalNightlySyncConfigValue } from '@/src/lib/globalConfig';
import {
  GlobalSyncBatchItem,
  GlobalSyncJobItem,
} from '../../hooks/useGlobalSyncQueue';
import { SyncConfigFormState } from './types';

export function buildConfigFormFromConfig(
  config?: GlobalNightlySyncConfigValue | null
): SyncConfigFormState {
  return {
    isEnabled: config?.isEnabled !== false,
    timetableJob: {
      isEnabled: config?.timetableJob?.isEnabled !== false,
      scheduleTime: config?.timetableJob?.scheduleTime || '22:00',
    },
    gradesJob: {
      isEnabled: config?.gradesJob?.isEnabled !== false,
      scheduleTime: config?.gradesJob?.scheduleTime || '22:00',
    },
    lmsJob: {
      isEnabled: config?.lmsJob?.isEnabled !== false,
      scheduleTime: config?.lmsJob?.scheduleTime || '22:00',
    },
    examsJob: {
      isEnabled: config?.examsJob?.isEnabled !== false,
      scheduleTime: config?.examsJob?.scheduleTime || '07:00',
    },
    slinkGradesJob: {
      isEnabled: config?.slinkGradesJob?.isEnabled !== false,
      scheduleTime: config?.slinkGradesJob?.scheduleTime || '23:00',
    },
    profileJob: {
      isEnabled: config?.profileJob?.isEnabled !== false,
      scheduleTime: config?.profileJob?.scheduleTime || '22:30',
    },
  };
}

export function filterQueueItems(
  queueItems: GlobalSyncJobItem[],
  searchQuery: string,
  statusFilter: string
): GlobalSyncJobItem[] {
  const query = searchQuery.trim().toLowerCase();
  return queueItems.filter((item) => {
    const matchQuery =
      !query ||
      item.username.toLowerCase().includes(query) ||
      (item.studentName && item.studentName.toLowerCase().includes(query)) ||
      (item.resultMessage && item.resultMessage.toLowerCase().includes(query));

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

export function calculateBatchProgress(
  activeBatch: GlobalSyncBatchItem | null
): number {
  if (!activeBatch || activeBatch.totalItems === 0) return 0;
  const finished =
    activeBatch.successCount +
    activeBatch.failedCount +
    activeBatch.cancelledCount +
    activeBatch.skippedCount;
  return Math.round((finished / activeBatch.totalItems) * 100);
}
