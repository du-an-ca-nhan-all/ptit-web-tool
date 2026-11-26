/**
 * QLDTTX (https://qldttx.pttc1.edu.vn/) Authentication & Token Management Service
 *
 * Public orchestrator re-exporting all QLDTTX portal service modules.
 */

export {
  QLDTTX_ANNOUNCEMENTS_API_URL,
  QLDTTX_SEMESTER_API_URL,
  QLDTTX_TIMETABLE_API_URL,
  QLDTTX_GRADES_API_URL,
  QLDTTX_SUMMARY_GRADES_API_URL,
  QLDTTX_LOW_GRADES_API_URL,
  QLDTTX_SEMESTER_COURSES_API_URL,
  QLDTTX_STUDENT_INFO_API_URL,
} from './qldttx-server-service/constants';

export type { QldttxStudentProfileInfo } from './qldttx-server-service/types';

export {
  encodeLoginCode,
  decodeCurrUserToken,
  loginAndGetToken,
  validateToken,
  getValidTokenOrRefresh,
} from './qldttx-server-service/auth';

export {
  fetchStudentCoursesFromQLDTTX,
  fetchSemesterCoursesFromQLDTTX,
} from './qldttx-server-service/courses';

export { fetchAllSemestersCoursesFromQLDTTX } from './qldttx-server-service/allSemestersCourses';

export { fetchStudentAnnouncementsFromQLDTTX } from './qldttx-server-service/announcements';

export {
  fetchStudentSemestersFromQLDTTX,
  fetchStudentTimetableFromQLDTTX,
} from './qldttx-server-service/timetable';

export { fetchStudentGradesFromQLDTTX } from './qldttx-server-service/grades';

export { fetchStudentInfoFromQLDTTX } from './qldttx-server-service/studentInfo';
