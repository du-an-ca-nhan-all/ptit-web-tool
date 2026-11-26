import { LMS_BASE_URL, LMS_USER_AGENT } from './constants';
import { CookieJar } from './cookieJar';
import type { LmsLoginResult } from './types';

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
  password?: string;
  existingToken?: string | null;
}): Promise<{ token: string; isNew: boolean; sesskey?: string }> {
  if (account.existingToken && !account.existingToken.startsWith('ERROR')) {
    const isAlive = await validateLmsToken(account.existingToken);
    if (isAlive) {
      return { token: account.existingToken, isNew: false };
    }
  }

  // Token hết hạn hoặc chưa có -> Đăng nhập lấy token / cookies mới nếu có mật khẩu
  if (!account.password || !account.password.trim()) {
    throw new Error(
      'Phiên đăng nhập LMS đã hết hạn và chưa có mật khẩu để tự động đăng nhập lại. Vui lòng cập nhật mật khẩu LMS trong phần Tài khoản liên kết.'
    );
  }

  const fresh = await loginLMS({
    username: account.username,
    password: account.password,
  });

  return { token: fresh.token, isNew: true, sesskey: fresh.sesskey };
}
