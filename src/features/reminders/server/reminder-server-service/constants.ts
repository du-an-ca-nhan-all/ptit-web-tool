export const DEFAULT_OFFSET_MINUTES = [1440, 60];

export const UPCOMING_GRACE_WINDOW_MS = 2 * 60 * 60 * 1000;

export const REMINDER_INCLUDE = {
  creator: { include: { student: true } },
  alerts: { orderBy: { triggerTime: 'asc' as const } },
  participants: { include: { user: { include: { student: true } } } },
};
