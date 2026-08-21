/**
 * PTIT LMS (https://lms.pttc1.edu.vn/) Authentication & Management Service
 * Hỗ trợ tự động đăng nhập LMS PTTC1, quản lý phiên/cookie, đồng bộ khóa học,
 * tiến độ hoàn thành, điểm quá trình và tự động học (auto-study activities).
 */

export const LMS_BASE_URL = 'https://lms.pttc1.edu.vn';
export const LMS_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface LmsCourseOverviewItem {
  id: string;
  courseCode: string;
  courseName: string;
  fullName: string;
  instructor?: string;
  instructorImg?: string;
  category?: string;
  progressPercent: number;
  completedActivities: number;
  totalActivities: number;
  grade?: string | null;
  url: string;
  isCompleted: boolean;
}

export interface LmsDashboardOverview {
  userFullName: string;
  username: string;
  stats: {
    enrolledCourses: number;
    completedActivities: number;
    completedCourses: number;
    dueActivities: number;
  };
  courses: LmsCourseOverviewItem[];
  lastSyncAt: string;
}

export interface LmsActivityItem {
  id: string;
  type: string;
  name: string;
  url: string;
  isCompleted?: boolean;
}

export interface LmsSectionItem {
  id?: string;
  title: string;
  activities: LmsActivityItem[];
}

export interface LmsLoginResult {
  token: string;
  sesskey: string;
  username: string;
  cookieHeader: string;
}

/**
 * Quản lý Cookies trong suốt quá trình gửi HTTP requests tới LMS
 */
export class CookieJar {
  private cookies: Map<string, string>;

  constructor(initialCookies?: string) {
    this.cookies = new Map();
    if (initialCookies) {
      this.loadFromCookieString(initialCookies);
    }
  }

  loadFromCookieString(cookieStr: string) {
    if (!cookieStr) return;
    const pairs = cookieStr.split(';');
    pairs.forEach((p) => {
      const parts = p.trim().split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        if (key) this.cookies.set(key, val);
      }
    });
  }

  updateFromResponse(response: Response) {
    let setCookies: string[] = [];
    if (typeof (response.headers as any).getSetCookie === 'function') {
      setCookies = (response.headers as any).getSetCookie();
    } else {
      const raw = response.headers.get('set-cookie');
      if (raw) setCookies = [raw];
    }

    setCookies.forEach((cookieStr) => {
      const parts = cookieStr.split(';')[0].trim().split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        if (key) this.cookies.set(key, val);
      }
    });
  }

  getCookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  get(name: string): string | undefined {
    return this.cookies.get(name);
  }
}

/**
 * Đăng nhập vào Moodle LMS PTTC1 và trích xuất session cookies + sesskey
 * @param account - Tên đăng nhập (MSV) và mật khẩu
 * @returns Promise<LmsLoginResult>
 */
export async function loginLMS(account: { username: string; password: string }): Promise<LmsLoginResult> {
  const jar = new CookieJar();
  const loginUrl = `${LMS_BASE_URL}/login/index.php`;

  // B1: Lấy trang đăng nhập để trích xuất logintoken và cookie ban đầu
  const getRes = await fetch(loginUrl, {
    headers: { 'User-Agent': LMS_USER_AGENT },
    redirect: 'manual',
  });

  jar.updateFromResponse(getRes);
  const html = await getRes.text();

  const tokenMatch = html.match(/name="logintoken"\s+value="([^"]+)"/i);
  if (!tokenMatch) {
    throw new Error('Không tìm thấy logintoken trên trang đăng nhập LMS PTTC1');
  }
  const logintoken = tokenMatch[1];

  // B2: Gửi thông tin đăng nhập POST
  const formData = new URLSearchParams();
  formData.append('anchor', '');
  formData.append('logintoken', logintoken);
  formData.append('username', account.username.trim());
  formData.append('password', account.password.trim());
  formData.append('rememberusername', '1');

  const postRes = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: jar.getCookieHeader(),
      'User-Agent': LMS_USER_AGENT,
      Origin: LMS_BASE_URL,
      Referer: loginUrl,
    },
    body: formData.toString(),
    redirect: 'manual',
  });

  jar.updateFromResponse(postRes);

  // B3: Xử lý chuyển hướng nếu có (testsession redirect)
  let redirectUrl = postRes.headers.get('location');
  if (redirectUrl) {
    if (redirectUrl.startsWith('/')) redirectUrl = LMS_BASE_URL + redirectUrl;
    const redirRes = await fetch(redirectUrl, {
      headers: {
        Cookie: jar.getCookieHeader(),
        'User-Agent': LMS_USER_AGENT,
      },
      redirect: 'manual',
    });
    jar.updateFromResponse(redirRes);
  }

  // B4: Kiểm tra trạng thái đăng nhập tại /my/
  const myRes = await fetch(`${LMS_BASE_URL}/my/`, {
    headers: {
      Cookie: jar.getCookieHeader(),
      'User-Agent': LMS_USER_AGENT,
    },
  });

  const myHtml = await myRes.text();
  const isLogged = myHtml.includes('logout.php') || myHtml.includes(account.username);

  if (!isLogged) {
    const errMatch = myHtml.match(/class="alert alert-danger"[^>]*>([\s\S]*?)<\/div>/i);
    const errMsg = errMatch ? errMatch[1].replace(/<[^>]+>/g, '').trim() : 'Sai tên đăng nhập hoặc mật khẩu trên LMS';
    throw new Error(`Đăng nhập LMS thất bại: ${errMsg}`);
  }

  // Trích xuất sesskey
  const sesskeyMatch = myHtml.match(/"sesskey":"([^"]+)"/i) || myHtml.match(/sesskey=([a-zA-Z0-9]+)/i);
  const sesskey = sesskeyMatch ? sesskeyMatch[1] : '';
  const cookieHeader = jar.getCookieHeader();

  return {
    token: cookieHeader,
    sesskey,
    username: account.username,
    cookieHeader,
  };
}

/**
 * Kiểm tra xem Session Token LMS hiện tại còn sống (alive) không
 */
export async function validateLmsToken(token: string): Promise<boolean> {
  if (!token || !token.trim()) return false;
  try {
    const res = await fetch(`${LMS_BASE_URL}/my/`, {
      headers: {
        Cookie: token.trim(),
        'User-Agent': LMS_USER_AGENT,
      },
      redirect: 'manual',
    });

    if (res.status !== 200) return false;
    const html = await res.text();
    return html.includes('logout.php');
  } catch {
    return false;
  }
}

/**
 * Lấy Token LMS hợp lệ: Nếu token cũ còn sống thì giữ nguyên, nếu hết hạn hoặc chưa có thì tự động login lại
 */
export async function getValidLmsTokenOrRefresh(account: {
  username: string;
  password: string;
  existingToken?: string | null;
}): Promise<{ token: string; isNew: boolean; sesskey?: string }> {
  if (account.existingToken && !account.existingToken.startsWith('ERROR')) {
    const isAlive = await validateLmsToken(account.existingToken);
    if (isAlive) {
      return { token: account.existingToken, isNew: false };
    }
  }

  // Token hết hạn hoặc chưa có -> Đăng nhập lấy token / cookies mới
  const fresh = await loginLMS({
    username: account.username,
    password: account.password,
  });

  return { token: fresh.token, isNew: true, sesskey: fresh.sesskey };
}

/**
 * Phân tích mã môn và tên môn học từ chuỗi tiêu đề Moodle
 * Ví dụ: "INT1450 - Quản lý dự án phần mềm - 2503 - Nhóm 7"
 */
function parseCourseTitle(rawTitle: string): { courseCode: string; courseName: string; category: string } {
  const clean = rawTitle.replace(/^Tên khóa học\s+/i, '').replace(/Khoá học\s+/i, '').replace(/Actions for course\s+/i, '').trim();
  const parts = clean.split('-').map((s) => s.trim());

  if (parts.length >= 3) {
    return {
      courseCode: parts[0],
      courseName: parts[1],
      category: parts.slice(2).join(' - '),
    };
  } else if (parts.length === 2) {
    return {
      courseCode: parts[0],
      courseName: parts[1],
      category: '',
    };
  }
  return {
    courseCode: clean.slice(0, 10),
    courseName: clean,
    category: '',
  };
}

/**
 * Lấy toàn bộ dữ liệu Tổng quan LMS: Số liệu thống kê, danh sách khóa học, tiến độ % và bảng điểm quá trình
 */
export async function fetchLmsDashboardOverview(account: {
  username: string;
  password?: string;
  token?: string | null;
}): Promise<LmsDashboardOverview> {
  let validToken = account.token;
  if (!validToken && account.password) {
    const refreshed = await getValidLmsTokenOrRefresh({
      username: account.username,
      password: account.password,
      existingToken: account.token,
    });
    validToken = refreshed.token;
  }

  if (!validToken) {
    throw new Error('Chưa có Session Token hoặc Mật khẩu kết nối LMS');
  }

  const jar = new CookieJar(validToken);

  // 1. Fetch Dashboard /my/ for user name and overall stats
  const myRes = await fetch(`${LMS_BASE_URL}/my/`, {
    headers: {
      Cookie: jar.getCookieHeader(),
      'User-Agent': LMS_USER_AGENT,
    },
  });

  if (myRes.status === 303 || myRes.status === 302) {
    // Session expired -> retry with password if available
    if (account.password) {
      const refreshed = await loginLMS({ username: account.username, password: account.password });
      validToken = refreshed.token;
      jar.loadFromCookieString(validToken);
    }
  }

  const myHtml = await myRes.text();

  // Extract user full name
  const nameMatch = myHtml.match(/Chào mừng quay trở lại,\s*([^!]+)!/i) || myHtml.match(/class="usertext[^>]*>([^<]+)/i);
  const userFullName = nameMatch ? nameMatch[1].trim() : account.username;

  // Extract stats
  const enrolledMatch = myHtml.match(/(\d+)\s*<\/div>\s*<[^>]+>\s*Khóa học đã đăng ký/i) || myHtml.match(/(\d+)\s*Khóa học đã đăng ký/i);
  const completedActMatch = myHtml.match(/(\d+)\s*<\/div>\s*<[^>]+>\s*Hoạt động đã hoàn thành/i) || myHtml.match(/(\d+)\s*Hoạt động đã hoàn thành/i);
  const completedCoursesMatch = myHtml.match(/(\d+)\s*<\/div>\s*<[^>]+>\s*Khóa học đã hoàn thành/i) || myHtml.match(/(\d+)\s*Khóa học đã hoàn thành/i);
  const dueActMatch = myHtml.match(/(\d+)\s*<\/div>\s*<[^>]+>\s*Hoạt động đến hạn/i) || myHtml.match(/(\d+)\s*Hoạt động đến hạn/i);

  const stats = {
    enrolledCourses: enrolledMatch ? parseInt(enrolledMatch[1]) : 0,
    completedActivities: completedActMatch ? parseInt(completedActMatch[1]) : 0,
    completedCourses: completedCoursesMatch ? parseInt(completedCoursesMatch[1]) : 0,
    dueActivities: dueActMatch ? parseInt(dueActMatch[1]) : 0,
  };

  // 2. Fetch Grades Overview /grade/report/overview/index.php
  const gradeMap = new Map<string, string>();
  try {
    const gradeRes = await fetch(`${LMS_BASE_URL}/grade/report/overview/index.php`, {
      headers: {
        Cookie: jar.getCookieHeader(),
        'User-Agent': LMS_USER_AGENT,
      },
    });
    if (gradeRes.ok) {
      const gradeHtml = await gradeRes.text();
      // Match course link and grade cell
      const gradeRowRegex = /href="https:\/\/lms\.pttc1\.edu\.vn\/course\/user\.php\?mode=grade&amp;id=(\d+)[^>]*>([\s\S]*?)<\/a>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/g;
      let gMatch: RegExpExecArray | null;
      while ((gMatch = gradeRowRegex.exec(gradeHtml)) !== null) {
        const cId = gMatch[1];
        const rawGrade = gMatch[3].replace(/<[^>]+>/g, '').trim();
        if (rawGrade && rawGrade !== '-') {
          gradeMap.set(cId, rawGrade);
        }
      }
    }
  } catch {
    // Ignore grade overview error
  }

  // 3. Fetch Courses & Progress from /my/courses.php
  const coursesRes = await fetch(`${LMS_BASE_URL}/my/courses.php`, {
    headers: {
      Cookie: jar.getCookieHeader(),
      'User-Agent': LMS_USER_AGENT,
    },
  });
  const coursesHtml = await coursesRes.text();

  // Extract each course box / card HTML
  const courses: LmsCourseOverviewItem[] = [];
  const courseCardRegex = /<div[^>]*data-course-id="(\d+)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
  let cMatch: RegExpExecArray | null;
  const seenIds = new Set<string>();

  while ((cMatch = courseCardRegex.exec(coursesHtml)) !== null) {
    const id = cMatch[1];
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const cardContent = cMatch[2];

    // Extract title
    const titleMatch = cardContent.match(/class="[^"]*coursename[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
      cardContent.match(/href="https:\/\/lms\.pttc1\.edu\.vn\/course\/view\.php\?id=\d+"[^>]*>([\s\S]*?)<\/a>/i);
    const rawFullName = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : `Khóa học ${id}`;
    const { courseCode, courseName, category } = parseCourseTitle(rawFullName);

    // Extract instructor
    const teacherMatch = cardContent.match(/class="[^"]*course-instructors[^"]*"[^>]*>([\s\S]*?)<\/h6>/i) ||
      cardContent.match(/title="([^"]+)"[^>]*>\s*<img/i);
    const instructor = teacherMatch ? teacherMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // Extract progress activities
    const actProgressMatch = cardContent.match(/(\d+)\s+trong\s+(\d+)\s+hoạt động đã hoàn thành/i);
    const completedActivities = actProgressMatch ? parseInt(actProgressMatch[1]) : 0;
    const totalActivities = actProgressMatch ? parseInt(actProgressMatch[2]) : 0;

    // Extract progress %
    const percentMatch = cardContent.match(/aria-valuenow="(\d+)"/i) || cardContent.match(/(\d+)%\s+Khóa học đã hoàn thành/i);
    const progressPercent = percentMatch ? parseInt(percentMatch[1]) : totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

    const grade = gradeMap.get(id) || null;

    courses.push({
      id,
      courseCode,
      courseName,
      fullName: rawFullName,
      instructor,
      category,
      progressPercent,
      completedActivities,
      totalActivities,
      grade,
      url: `${LMS_BASE_URL}/course/view.php?id=${id}`,
      isCompleted: progressPercent === 100,
    });
  }

  // Fallback: If regex didn't catch cards (e.g. format variations), parse course links
  if (courses.length === 0) {
    const fallbackRegex = /href="https:\/\/lms\.pttc1\.edu\.vn\/course\/view\.php\?id=(\d+)"[^>]*>([\s\S]*?)<\/a>/g;
    let fbMatch: RegExpExecArray | null;
    while ((fbMatch = fallbackRegex.exec(coursesHtml)) !== null) {
      const id = fbMatch[1];
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      const rawFullName = fbMatch[2].replace(/<[^>]+>/g, '').trim();
      if (!rawFullName || rawFullName.includes('img')) continue;

      const { courseCode, courseName, category } = parseCourseTitle(rawFullName);
      const grade = gradeMap.get(id) || null;

      courses.push({
        id,
        courseCode,
        courseName,
        fullName: rawFullName,
        category,
        progressPercent: 0,
        completedActivities: 0,
        totalActivities: 0,
        grade,
        url: `${LMS_BASE_URL}/course/view.php?id=${id}`,
        isCompleted: false,
      });
    }
  }

  // Update total stats if parsed
  if (stats.enrolledCourses === 0 && courses.length > 0) {
    stats.enrolledCourses = courses.length;
    stats.completedCourses = courses.filter((c) => c.isCompleted).length;
    stats.completedActivities = courses.reduce((acc, c) => acc + c.completedActivities, 0);
  }

  return {
    userFullName,
    username: account.username,
    stats,
    courses,
    lastSyncAt: new Date().toISOString(),
  };
}

/**
 * Lấy chi tiết các chương (sections) và hoạt động học tập (activities) trong một khóa học LMS
 */
export async function fetchLmsCourseSections(
  courseId: string,
  tokenOrCookies: string
): Promise<{
  courseId: string;
  courseTitle: string;
  sections: LmsSectionItem[];
  totalActivities: number;
}> {
  const jar = new CookieJar(tokenOrCookies);
  const courseUrl = `${LMS_BASE_URL}/course/view.php?id=${courseId}`;

  const res = await fetch(courseUrl, {
    headers: {
      Cookie: jar.getCookieHeader(),
      'User-Agent': LMS_USER_AGENT,
    },
  });
  const html = await res.text();

  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([\s\S]*?)<\/title>/i);
  const courseTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : `Môn học ${courseId}`;

  const sections: LmsSectionItem[] = [];
  const sectionRegex = /<li[^>]*class="[^"]*section[^"]*"[^>]*>([\s\S]*?)<\/li>/g;
  let secMatch: RegExpExecArray | null;
  let totalAct = 0;

  while ((secMatch = sectionRegex.exec(html)) !== null) {
    const secHtml = secMatch[1];
    const secTitleMatch = secHtml.match(/class="[^"]*sectionname[^"]*"[^>]*>([\s\S]*?)<\/(?:h3|a)>/i);
    const secTitle = secTitleMatch ? secTitleMatch[1].replace(/<[^>]+>/g, '').trim() : 'Chung';

    const actRegex = /href="(https:\/\/lms\.pttc1\.edu\.vn\/mod\/([a-z0-9_]+)\/view\.php\?id=(\d+))"[^>]*>([\s\S]*?)<\/a>/g;
    let actMatch: RegExpExecArray | null;
    const activities: LmsActivityItem[] = [];
    const seenActId = new Set<string>();

    while ((actMatch = actRegex.exec(secHtml)) !== null) {
      const fullUrl = actMatch[1];
      const modType = actMatch[2];
      const actId = actMatch[3];
      const actName = actMatch[4].replace(/<[^>]+>/g, '').trim();

      if (!seenActId.has(actId) && actName) {
        seenActId.add(actId);
        activities.push({
          id: actId,
          type: modType,
          name: actName,
          url: fullUrl,
        });
        totalAct++;
      }
    }

    if (activities.length > 0) {
      sections.push({
        title: secTitle,
        activities,
      });
    }
  }

  return {
    courseId,
    courseTitle,
    sections,
    totalActivities: totalAct,
  };
}

/**
 * Tự động duyệt và trigger xem các hoạt động bài học trong một khóa học cụ thể trên LMS (Auto-Study)
 */
export async function studyCourseOnLMS(
  courseId: string,
  tokenOrCookies: string
): Promise<{
  courseId: string;
  courseTitle: string;
  totalActivities: number;
  completedActivities: number;
  activities: { id: string; type: string; name: string; url: string; status: 'SUCCESS' | 'ERROR' }[];
}> {
  const jar = new CookieJar(tokenOrCookies);
  const courseUrl = `${LMS_BASE_URL}/course/view.php?id=${courseId}`;

  const res = await fetch(courseUrl, {
    headers: {
      Cookie: jar.getCookieHeader(),
      'User-Agent': LMS_USER_AGENT,
    },
  });
  const html = await res.text();

  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([\s\S]*?)<\/title>/i);
  const courseTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : `Môn học ${courseId}`;

  const actRegex = /href="(https:\/\/lms\.pttc1\.edu\.vn\/mod\/([a-z0-9_]+)\/view\.php\?id=(\d+))"[^>]*>([\s\S]*?)<\/a>/g;
  let match: RegExpExecArray | null;
  const activities: { id: string; type: string; name: string; url: string; status: 'SUCCESS' | 'ERROR' }[] = [];
  const seenAct = new Set<string>();

  while ((match = actRegex.exec(html)) !== null) {
    const fullUrl = match[1];
    const modType = match[2];
    const actId = match[3];
    const rawName = match[4].replace(/<[^>]+>/g, '').trim();

    if (!seenAct.has(actId) && rawName) {
      seenAct.add(actId);
      activities.push({ id: actId, type: modType, name: rawName, url: fullUrl, status: 'SUCCESS' });
    }
  }

  let completedCount = 0;
  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    try {
      const actRes = await fetch(act.url, {
        headers: {
          Cookie: jar.getCookieHeader(),
          'User-Agent': LMS_USER_AGENT,
        },
        redirect: 'follow',
      });
      jar.updateFromResponse(actRes);
      if (actRes.ok) {
        act.status = 'SUCCESS';
        completedCount++;
      }
    } catch {
      act.status = 'ERROR';
    }

    if (i < activities.length - 1) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  return {
    courseId,
    courseTitle,
    totalActivities: activities.length,
    completedActivities: completedCount,
    activities,
  };
}
