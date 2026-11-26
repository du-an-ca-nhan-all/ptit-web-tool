import { NavigationTab } from '../../types/navigation';

export const ADMIN_ONLY_TABS: NavigationTab[] = [
  'batches',
  'external_accounts_admin',
  'global_jobs',
  'activity_logs',
  'telegram_admin',
  'user_registrations',
  'database_backup',
  'announcements_admin',
];

export const MONITOR_ONLY_TABS: NavigationTab[] = [
  'members',
  'monitor_flow',
  'exam_review',
  'room_analysis',
  'monitor',
  'envelope',
  'envelope_all',
  'settlement',
];

export const MONITOR_AND_ADMIN_TABS: NavigationTab[] = [
  ...ADMIN_ONLY_TABS,
  ...MONITOR_ONLY_TABS,
];

export const TABS_REQUIRING_EXAM_RECORDS: NavigationTab[] = [
  'schedule',
  'personal_schedule',
  'members',
  'monitor',
  'envelope',
  'envelope_all',
  'settlement',
];

export function getRoleDisplayLabel(role: string): string {
  if (role === 'admin') {
    return '👑 Quản Trị Viên (Admin)';
  }
  if (role === 'lop_truong') {
    return '🛡️ Lớp Trưởng';
  }
  return '🎓 Sinh Viên';
}
