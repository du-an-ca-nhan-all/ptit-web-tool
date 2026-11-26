/**
 * QLDTTX Authentication & Token Management
 */

import { API_URL, BASE_URL, ORIGIN, REQUEST_BODY, STATIC_HEADERS } from './constants';

/**
 * Mã hóa payload đăng nhập Base64 URL encoded
 */
export function encodeLoginCode(account: { username: string; password: string }): string {
  const payload = {
    username: account.username,
    password: account.password,
    uri: BASE_URL,
    vaitro: '',
  };

  return encodeURIComponent(Buffer.from(JSON.stringify(payload), 'utf8').toString('base64'));
}

/**
 * Giải mã location header từ phản hồi 302 để trích xuất access_token
 */
export function decodeCurrUserToken(locationHeader: string): string {
  if (!locationHeader) {
    return '';
  }

  try {
    const location = new URL(locationHeader.replace('/#', ''), ORIGIN);
    const currUser = location.searchParams.get('CurrUser');
    if (!currUser) {
      return '';
    }

    const raw = Buffer.from(decodeURIComponent(currUser), 'base64').toString('utf8');
    return JSON.parse(raw)?.access_token ?? '';
  } catch {
    return '';
  }
}

/**
 * Thực hiện đăng nhập tới https://qldttx.pttc1.edu.vn/ và trích xuất Bearer token
 */
export async function loginAndGetToken(account: { username: string; password: string }): Promise<string> {
  const loginUrl = `${ORIGIN}/api/pn-signin?code=${encodeLoginCode(account)}&gopage=&mgr=1`;

  const response = await fetch(loginUrl, {
    method: 'GET',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': STATIC_HEADERS['Accept-Language'],
      Referer: `${ORIGIN}/`,
      'User-Agent': STATIC_HEADERS['User-Agent'],
      'Upgrade-Insecure-Requests': '1',
    },
    redirect: 'manual',
  });

  if (response.status !== 302) {
    throw new Error(
      `Đăng nhập thất bại (HTTP ${response.status}) - Sai tên đăng nhập/mật khẩu hoặc cổng trường không phản hồi.`
    );
  }

  const locationHeader = response.headers.get('location') ?? '';
  const accessToken = decodeCurrUserToken(locationHeader);

  if (!accessToken) {
    throw new Error('Không thể trích xuất access_token từ kết quả đăng nhập cổng QLDTTX');
  }

  return `Bearer ${accessToken}`;
}

/**
 * Kiểm tra xem token hiện tại còn hiệu lực (alive) không bằng cách gọi API ĐKMH
 */
export async function validateToken(token: string): Promise<boolean> {
  const rawToken = token.replace(/^Bearer\s+/i, '').trim();
  if (!rawToken) {
    return false;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        ...STATIC_HEADERS,
        Authorization: `Bearer ${rawToken}`,
        Cookie: `access_token=${rawToken}`,
      },
      body: JSON.stringify(REQUEST_BODY),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Lấy token hợp lệ: Nếu token cũ còn sống thì giữ nguyên, nếu hết hạn hoặc chưa có thì tự động login lại
 */
export async function getValidTokenOrRefresh(account: {
  username: string;
  password: string;
  existingToken?: string | null;
}): Promise<{ token: string; isNew: boolean }> {
  if (account.existingToken && !account.existingToken.startsWith('ERROR')) {
    const isAlive = await validateToken(account.existingToken);
    if (isAlive) {
      return { token: account.existingToken, isNew: false };
    }
  }

  // Token hết hạn hoặc chưa có -> Đăng nhập lấy token mới
  const freshToken = await loginAndGetToken({
    username: account.username,
    password: account.password,
  });

  return { token: freshToken, isNew: true };
}
