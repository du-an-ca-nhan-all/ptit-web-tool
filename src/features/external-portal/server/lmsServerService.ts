/**
 * PTIT LMS (https://lms.pttc1.edu.vn/) Authentication & Management Service
 * Hỗ trợ tự động đăng nhập LMS PTTC1, quản lý phiên/cookie, đồng bộ đầy đủ
 * 100% khóa học (đang học, đã học xong, chưa học), tiến độ %, điểm quá trình,
 * và lưu trữ Cache trong Database (với quy tắc hết hạn 24h & không ghi đè nếu lỗi).
 */

export { LMS_BASE_URL, LMS_USER_AGENT } from './lms-server-service/constants';
export type {
  LmsCourseOverviewItem,
  LmsDashboardOverview,
  LmsActivityItem,
  LmsSectionItem,
  LmsLoginResult,
} from './lms-server-service/types';
export { CookieJar } from './lms-server-service/cookieJar';
export {
  loginLMS,
  validateLmsToken,
  getValidLmsTokenOrRefresh,
} from './lms-server-service/authService';
export { fetchLmsDashboardOverview } from './lms-server-service/dashboardFetcher';
export { getOrFetchStudentLmsOverview } from './lms-server-service/studentOverviewCacheService';
export { fetchLmsCourseSections } from './lms-server-service/courseSectionsFetcher';
