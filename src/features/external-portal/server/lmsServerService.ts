/**
 * PTIT LMS (https://lms.pttc1.edu.vn/) Authentication & Management Service
 * Hỗ trợ tự động đăng nhập LMS PTTC1, quản lý phiên/cookie và đồng bộ hoạt động học tập.
 */

export const LMS_BASE_URL = 'https://lms.pttc1.edu.vn';
export const LMS_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface LmsCourseItem {
  id: string;
  title: string;
  url: string;
}

export interface LmsActivityItem {
  id: string;
  type: string;
  url: string;
  title?: string;
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
 * Lấy danh sách khóa học của người dùng từ LMS
 */
export async function getMyCoursesFromLMS(tokenOrCookies: string): Promise<LmsCourseItem[]> {
  const res = await fetch(`${LMS_BASE_URL}/my/courses.php`, {
    headers: {
      Cookie: tokenOrCookies,
      'User-Agent': LMS_USER_AGENT,
    },
  });
  const html = await res.text();

  const courses: LmsCourseItem[] = [];
  const courseRegex = /href="https:\/\/lms\.pttc1\.edu\.vn\/course\/view\.php\?id=(\d+)"[^>]*>([\s\S]*?)<\/a>/g;
  let match: RegExpExecArray | null;
  const seen = new Set<string>();

  while ((match = courseRegex.exec(html)) !== null) {
    const id = match[1];
    const rawTitle = match[2].replace(/<[^>]+>/g, '').trim();
    if (id && rawTitle && !seen.has(id) && !rawTitle.includes('img')) {
      seen.add(id);
      courses.push({
        id,
        title: rawTitle,
        url: `${LMS_BASE_URL}/course/view.php?id=${id}`,
      });
    }
  }

  return courses;
}

/**
 * Tự động duyệt và trigger xem các hoạt động trong một khóa học cụ thể trên LMS
 */
export async function studyCourseOnLMS(
  courseId: string,
  tokenOrCookies: string
): Promise<{
  courseId: string;
  courseTitle: string;
  totalActivities: number;
  completedActivities: number;
  activities: LmsActivityItem[];
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

  const actRegex = /href="(https:\/\/lms\.pttc1\.edu\.vn\/mod\/([a-z0-9_]+)\/view\.php\?id=(\d+))"/g;
  let match: RegExpExecArray | null;
  const activities: LmsActivityItem[] = [];
  const seenAct = new Set<string>();

  while ((match = actRegex.exec(html)) !== null) {
    const fullUrl = match[1];
    const modType = match[2];
    const actId = match[3];

    if (!seenAct.has(actId)) {
      seenAct.add(actId);
      activities.push({ id: actId, type: modType, url: fullUrl });
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
      if (actRes.ok) completedCount++;
    } catch {
      // Tiếp tục các activity khác nếu có 1 request lỗi
    }

    if (i < activities.length - 1) {
      await new Promise((r) => setTimeout(r, 300));
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
