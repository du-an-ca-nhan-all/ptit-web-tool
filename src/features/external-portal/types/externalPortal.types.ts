import { LoginUser } from '../../../types';
import {
  StudentGradesResult,
  StudentCourseGrade,
  SemesterGradeSummary,
} from '../server/studentGradesServerService';
import {
  TimetableCalendarEvent,
  TimetableSubjectSummary,
  StudentTimetableCalendarResult,
} from '../server/studentTimetableServerService';
import {
  SlinkAuthTokenResponse,
  SlinkUserInfo,
  SlinkNotificationItem,
  SlinkNotificationResponse,
  SlinkLoginResult,
} from '../server/slinkServerService';

export type {
  LoginUser,
  StudentGradesResult,
  StudentCourseGrade,
  SemesterGradeSummary,
  TimetableCalendarEvent,
  TimetableSubjectSummary,
  StudentTimetableCalendarResult,
  SlinkAuthTokenResponse,
  SlinkUserInfo,
  SlinkNotificationItem,
  SlinkNotificationResponse,
  SlinkLoginResult,
};
