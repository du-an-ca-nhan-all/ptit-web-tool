/**
 * PTIT QLDTTX (https://qldttx.pttc1.edu.vn/) Course Registration (ĐKMH) Server Service
 * Reverse-engineered from Netweb / AQTech frontend architecture
 */

export { QLDTTX_BASE_URL } from './course-registration-server-service/constants';
export { CT, generateUA } from './course-registration-server-service/uaHeader';
export type {
  OpenCourseGroupItem,
  SubjectDictItem,
  OpenCoursesResult,
  RegisteredCoursesResult,
  RegisterCourseResponse,
} from './course-registration-server-service/types';
export {
  fetchOpenCourseGroupsFromQLDTTX,
  fetchRegisteredCoursesFromQLDTTX,
} from './course-registration-server-service/courseQueries';
export {
  registerCourseGroupQLDTTX,
  cancelCourseGroupQLDTTX,
} from './course-registration-server-service/courseMutations';
