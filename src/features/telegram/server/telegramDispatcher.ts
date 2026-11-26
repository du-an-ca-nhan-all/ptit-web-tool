/**
 * Telegram Dispatcher Orchestrator
 * Re-exports all public dispatcher functions and types from modular domain files
 * under ./telegram-dispatcher/ to preserve 100% backward compatibility.
 */

export type {
  ParsedClassSession,
  NearestClassScheduleResult,
  QldtExamChangeItem,
} from './telegram-dispatcher/types';

export {
  normalizeDateVN,
  getVietnamTime,
  formatDateVN,
} from './telegram-dispatcher/dateUtils';

export {
  dispatchExamScheduleUpdated,
  dispatchExamPostponed,
  dispatchClassActivityAnnouncement,
} from './telegram-dispatcher/examEvents';

export { runExamScheduleReminders } from './telegram-dispatcher/examReminders';

export { checkAndDispatchQldtAnnouncements } from './telegram-dispatcher/qldtAnnouncements';

export { checkAndDispatchSlinkAnnouncements } from './telegram-dispatcher/slinkAnnouncements';

export {
  parseTkbDate,
  parseTkbString,
} from './telegram-dispatcher/tkbParser';

export { parseSessionFromApiItem } from './telegram-dispatcher/timetableItemParser';

export {
  getStudentAllSemesterSessions,
  getStudentClassSessionsForDate,
} from './telegram-dispatcher/timetableSessions';

export { runClassScheduleReminders } from './telegram-dispatcher/classScheduleReminders';

export {
  findNearestStudentClassSchedule,
  dispatchNearestClassScheduleNotification,
} from './telegram-dispatcher/nearestClassSchedule';

export {
  dispatchNewUserRegistered,
  dispatchDatabaseExportOrBackup,
  dispatchDatabaseRestore,
  dispatchExamBatchImportedToAdmin,
} from './telegram-dispatcher/adminEvents';

export { dispatchQldtExamScheduleChanges } from './telegram-dispatcher/qldtExamChanges';
