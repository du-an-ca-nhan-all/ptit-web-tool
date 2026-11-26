import { LMS_BASE_URL, LMS_USER_AGENT } from './constants';
import { CookieJar } from './cookieJar';
import { getValidLmsTokenOrRefresh, loginLMS } from './authService';
import {
  extractDashboardUserAndStats,
  mapCoreCourses,
  mapRemuiCourses,
  parseCoursesHtml,
  parseGradesOverviewHtml,
} from './courseParsers';
import type { LmsCourseOverviewItem, LmsDashboardOverview } from './types';

async function fetchGradesMap(jar: CookieJar): Promise<Map<string, string>> {
  try {
    const gradeRes = await fetch(`${LMS_BASE_URL}/grade/report/overview/index.php`, {
      headers: {
        Cookie: jar.getCookieHeader(),
        'User-Agent': LMS_USER_AGENT,
      },
    });
    if (gradeRes.ok) {
      const gradeHtml = await gradeRes.text();
      return parseGradesOverviewHtml(gradeHtml);
    }
  } catch (caughtError) {
    console.warn(`[dashboardFetcher] Non-fatal error:`, caughtError);
  }
  return new Map<string, string>();
}

export interface FetchLmsCoursesParams {
  sesskey: string;
  jar: CookieJar;
  seenIds: Set<string>;
  gradeMap: Map<string, string>;
}

async function fetchRemuiCourses(
  params: FetchLmsCoursesParams
): Promise<LmsCourseOverviewItem[]> {
  const { sesskey, jar, seenIds, gradeMap } = params;
  try {
    const ajaxRes = await fetch(
      `${LMS_BASE_URL}/lib/ajax/service.php?sesskey=${sesskey}&info=theme_remui_get_myoverviewcourses`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: jar.getCookieHeader(),
          'User-Agent': LMS_USER_AGENT,
        },
        body: JSON.stringify([
          {
            index: 0,
            methodname: 'theme_remui_get_myoverviewcourses',
            args: {
              classification: 'all',
              sort: 'fullname',
              customfieldname: '',
              customfieldvalue: '',
              searchvalue: '',
            },
          },
        ]),
      }
    );

    if (ajaxRes.ok) {
      const ajaxJson = await ajaxRes.json();
      const remuiList = ajaxJson?.[0]?.data?.courses;
      if (Array.isArray(remuiList) && remuiList.length > 0) {
        return mapRemuiCourses(remuiList, seenIds, gradeMap);
      }
    }
  } catch (e) {
    console.error('Error fetching remui courses:', e);
  }
  return [];
}

async function fetchCoreCourses(
  params: FetchLmsCoursesParams
): Promise<LmsCourseOverviewItem[]> {
  const { sesskey, jar, seenIds, gradeMap } = params;
  try {
    const coreRes = await fetch(
      `${LMS_BASE_URL}/lib/ajax/service.php?sesskey=${sesskey}&info=core_course_get_enrolled_courses_by_timeline_classification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: jar.getCookieHeader(),
          'User-Agent': LMS_USER_AGENT,
        },
        body: JSON.stringify([
          {
            index: 0,
            methodname: 'core_course_get_enrolled_courses_by_timeline_classification',
            args: {
              classification: 'all',
              limit: 0,
              offset: 0,
              sort: 'fullname',
            },
          },
        ]),
      }
    );

    if (coreRes.ok) {
      const coreJson = await coreRes.json();
      const coreList = coreJson?.[0]?.data?.courses;
      if (Array.isArray(coreList) && coreList.length > 0) {
        return mapCoreCourses(coreList, seenIds, gradeMap);
      }
    }
  } catch (e) {
    console.error('Error fetching core courses:', e);
  }
  return [];
}

/**
 * Lấy toàn bộ dữ liệu Tổng quan LMS trực tiếp từ cổng học tập:
 * Số liệu thống kê, danh sách 100% khóa học (kể cả đã học xong), tiến độ % chính xác và bảng điểm quá trình.
 */
export async function fetchLmsDashboardOverview(account: {
  username: string;
  password?: string;
  token?: string | null;
}): Promise<LmsDashboardOverview & { newToken?: string }> {
  let validToken = account.token;
  let sesskey = '';
  let accumulatedNewToken: string | undefined;

  // 1. Luôn kiểm tra và xác thực token ngay từ đầu (hoặc tự động login lại nếu token chết)
  if (account.password) {
    const authResult = await getValidLmsTokenOrRefresh({
      username: account.username,
      password: account.password,
      existingToken: account.token,
    });
    validToken = authResult.token;
    if (authResult.isNew) {
      accumulatedNewToken = authResult.token;
    }
    if (authResult.sesskey) {
      sesskey = authResult.sesskey;
    }
  }

  if (!validToken) {
    throw new Error('Chưa có Session Token hoặc Mật khẩu kết nối LMS');
  }

  let jar = new CookieJar(validToken);

  // 2. Fetch Dashboard /my/ for user name, sesskey and overall stats
  let myRes = await fetch(`${LMS_BASE_URL}/my/`, {
    headers: {
      Cookie: jar.getCookieHeader(),
      'User-Agent': LMS_USER_AGENT,
    },
    redirect: 'manual',
  });

  // Kiểm tra trạng thái phiên: nếu bị 302/303 redirect hoặc status != 200 thì phiên không còn hiệu lực
  let isSessionValid = myRes.status === 200;
  let myHtml = '';
  if (isSessionValid) {
    myHtml = await myRes.text();
    isSessionValid = myHtml.includes('logout.php');
  }

  if (!isSessionValid) {
    if (account.password) {
      // Token cũ không hợp lệ -> Đăng nhập lại ngay
      const fresh = await loginLMS({ username: account.username, password: account.password });
      validToken = fresh.token;
      accumulatedNewToken = fresh.token;
      sesskey = fresh.sesskey;
      jar = new CookieJar(validToken);

      myRes = await fetch(`${LMS_BASE_URL}/my/`, {
        headers: {
          Cookie: jar.getCookieHeader(),
          'User-Agent': LMS_USER_AGENT,
        },
      });
      myHtml = await myRes.text();
      if (!myHtml.includes('logout.php')) {
        throw new Error('Đăng nhập lại LMS thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu LMS.');
      }
    } else {
      throw new Error(
        'Phiên đăng nhập LMS đã hết hạn hoặc không hợp lệ. Vui lòng cấu hình mật khẩu LMS để tự động đăng nhập lại.'
      );
    }
  }

  if (!sesskey) {
    const sMatch = myHtml.match(/"sesskey":"([^"]+)"/i) || myHtml.match(/sesskey=([a-zA-Z0-9]+)/i);
    sesskey = sMatch ? sMatch[1] : '';
  }

  const { userFullName, stats } = extractDashboardUserAndStats(myHtml, account.username);

  // 3. Fetch Grades Overview /grade/report/overview/index.php
  const gradeMap = await fetchGradesMap(jar);

  // 4. Fetch ALL Courses & Exact Progress via Edwiser RemUI & Moodle AJAX API
  const courses: LmsCourseOverviewItem[] = [];
  const seenIds = new Set<string>();

  if (sesskey) {
    // Primary source: Edwiser RemUI `theme_remui_get_myoverviewcourses`
    courses.push(...(await fetchRemuiCourses({ sesskey, jar, seenIds, gradeMap })));

    // Secondary fallback: Moodle core `core_course_get_enrolled_courses_by_timeline_classification`
    if (courses.length === 0) {
      courses.push(...(await fetchCoreCourses({ sesskey, jar, seenIds, gradeMap })));
    }
  }

  // 5. HTML Fallback if AJAX endpoints were unreachable
  if (courses.length === 0) {
    const coursesRes = await fetch(`${LMS_BASE_URL}/my/courses.php`, {
      headers: {
        Cookie: jar.getCookieHeader(),
        'User-Agent': LMS_USER_AGENT,
      },
    });
    const coursesHtml = await coursesRes.text();
    courses.push(...parseCoursesHtml(coursesHtml, seenIds, gradeMap));
  }

  // Update total stats accurately
  if (courses.length > 0) {
    stats.enrolledCourses = courses.length;
    stats.completedCourses = courses.filter((c) => c.isCompleted || c.progressPercent === 100).length;
    stats.completedActivities = courses.reduce((acc, c) => acc + c.completedActivities, 0);
    stats.dueActivities = courses.reduce((acc, c) => acc + Math.max(0, c.totalActivities - c.completedActivities), 0);
  }

  return {
    userFullName,
    username: account.username,
    stats,
    courses,
    lastSyncAt: new Date().toISOString(),
    newToken: accumulatedNewToken,
  };
}
