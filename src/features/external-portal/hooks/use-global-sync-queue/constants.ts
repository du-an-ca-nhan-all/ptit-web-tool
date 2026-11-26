import { GlobalNightlySyncConfigValue } from '@/src/lib/globalConfig';
import { GlobalSyncStats } from './types';

export const GLOBAL_SYNC_API_ENDPOINT = '/api/global-sync';
export const QUEUE_FETCH_LIMIT = '50';
export const ACTIVE_POLL_INTERVAL_MS = 2500;
export const IDLE_POLL_INTERVAL_MS = 8000;

export const INITIAL_GLOBAL_SYNC_STATS: GlobalSyncStats = {
  QUEUED: 0,
  RUNNING: 0,
  SUCCESS: 0,
  FAILED: 0,
  CANCELLED: 0,
  SKIPPED: 0,
};

export const INITIAL_GLOBAL_SYNC_CONFIG: GlobalNightlySyncConfigValue = {
  isEnabled: true,
  timetableJob: { isEnabled: true, scheduleTime: '22:00' },
  gradesJob: { isEnabled: true, scheduleTime: '22:00' },
  lmsJob: { isEnabled: true, scheduleTime: '22:00' },
  examsJob: { isEnabled: true, scheduleTime: '07:00' },
  slinkGradesJob: { isEnabled: true, scheduleTime: '23:00' },
  profileJob: { isEnabled: true, scheduleTime: '22:30' },
};
