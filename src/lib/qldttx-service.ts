/**
 * QLDTTX (https://qldttx.pttc1.edu.vn/) Authentication & Token Management Service
 */

const BASE_URL = 'https://qldttx.pttc1.edu.vn/#/home';
const ORIGIN = 'https://qldttx.pttc1.edu.vn';
const API_URL = 'https://qldttx.pttc1.edu.vn/api/dkmh/w-locdskqdkmhsinhvien';
const REQUEST_BODY = {
  is_CVHT: false,
  is_Clear: false,
};
const STATIC_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
  'Content-Type': 'application/json',
  Origin: 'https://qldttx.pttc1.edu.vn',
  Referer: 'https://qldttx.pttc1.edu.vn/',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  idpc: '0',
};

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
    throw new Error(`Đăng nhập thất bại (HTTP ${response.status}) - Sai tên đăng nhập/mật khẩu hoặc cổng trường không phản hồi.`);
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

/**
 * Lấy danh sách kết quả đăng ký môn học (ĐKMH) từ cổng QLDTTX cho sinh viên
 */
export async function fetchStudentCoursesFromQLDTTX(account: {
  username: string;
  password?: string;
  token?: string | null;
}): Promise<{
  data: any;
  totalCourses: number;
  totalCredits: number;
  tuitionFee: number;
}> {
  let validToken = account.token;
  if (!validToken && account.password) {
    const res = await getValidTokenOrRefresh({
      username: account.username,
      password: account.password,
      existingToken: account.token,
    });
    validToken = res.token;
  }

  if (!validToken) {
    throw new Error('Chưa có token hoặc mật khẩu để kết nối cổng QLDTTX');
  }

  const rawToken = validToken.replace(/^Bearer\s+/i, '').trim();

  let response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      ...STATIC_HEADERS,
      Authorization: `Bearer ${rawToken}`,
      Cookie: `access_token=${rawToken}`,
    },
    body: JSON.stringify(REQUEST_BODY),
  });

  // If token expired (401/403) and password available, auto refresh token & retry
  if ((response.status === 401 || response.status === 403) && account.password) {
    const fresh = await loginAndGetToken({
      username: account.username,
      password: account.password,
    });
    const freshRaw = fresh.replace(/^Bearer\s+/i, '').trim();
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        ...STATIC_HEADERS,
        Authorization: `Bearer ${freshRaw}`,
        Cookie: `access_token=${freshRaw}`,
      },
      body: JSON.stringify(REQUEST_BODY),
    });
  }

  const text = await response.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }

  if (!response.ok) {
    throw new Error(`Cổng QLDTTX phản hồi lỗi (${response.status}): ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`);
  }

  const courseList = parsed?.data?.ds_kqdkmh || [];
  let totalCredits = 0;
  let tuitionFee = 0;

  courseList.forEach((item: any) => {
    const toHoc = item.to_hoc;
    if (toHoc) {
      const tc = Number(toHoc.so_tc) || Number(toHoc.so_tc_hp) || 0;
      totalCredits += tc;
      const fee = Number(toHoc.phai_dong) || Number(item.hoc_phi_tam_tinh) || 0;
      tuitionFee += fee;
    }
  });

  return {
    data: parsed,
    totalCourses: courseList.length,
    totalCredits,
    tuitionFee,
  };
}

/**
 * Lấy danh sách thông báo từ cổng QLDTTX (https://qldttx.pttc1.edu.vn/#/xemthongbao)
 */
export async function fetchStudentAnnouncementsFromQLDTTX(account: {
  username: string;
  password?: string;
  token?: string | null;
}): Promise<{
  announcements: Array<{
    id: string;
    title: string;
    summary?: string;
    content?: string;
    publishDate?: string;
    sender?: string;
    link?: string;
  }>;
}> {
  let validToken = account.token;
  if (!validToken && account.password) {
    const res = await getValidTokenOrRefresh({
      username: account.username,
      password: account.password,
      existingToken: account.token,
    });
    validToken = res.token;
  }

  if (!validToken) {
    throw new Error('Chưa có token hoặc mật khẩu để kết nối cổng QLDTTX');
  }

  const rawToken = validToken.replace(/^Bearer\s+/i, '').trim();

  // Candidate endpoints for /#/xemthongbao
  const candidateEndpoints = [
    'https://qldttx.pttc1.edu.vn/api/dkmh/w-locdsthongbaosinhvien',
    'https://qldttx.pttc1.edu.vn/api/dkmh/w-locdsthongbaocanhan',
    'https://qldttx.pttc1.edu.vn/api/dkmh/w-locdsthongbao',
    'https://qldttx.pttc1.edu.vn/api/qldt/w-locdsthongbaosinhvien',
  ];

  let rawList: any[] = [];

  for (const endpoint of candidateEndpoints) {
    try {
      let response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...STATIC_HEADERS,
          Authorization: `Bearer ${rawToken}`,
          Cookie: `access_token=${rawToken}`,
        },
        body: JSON.stringify({ is_CVHT: false, is_Clear: false, limit: 20 }),
      });

      if ((response.status === 401 || response.status === 403) && account.password) {
        const fresh = await loginAndGetToken({
          username: account.username,
          password: account.password,
        });
        const freshRaw = fresh.replace(/^Bearer\s+/i, '').trim();
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            ...STATIC_HEADERS,
            Authorization: `Bearer ${freshRaw}`,
            Cookie: `access_token=${freshRaw}`,
          },
          body: JSON.stringify({ is_CVHT: false, is_Clear: false, limit: 20 }),
        });
      }

      if (response.ok) {
        const json = await response.json();
        const items =
          json?.data?.ds_thong_bao ||
          json?.data?.ds_thongbao ||
          json?.data?.items ||
          (Array.isArray(json?.data) ? json.data : []) ||
          (Array.isArray(json) ? json : []);

        if (Array.isArray(items) && items.length > 0) {
          rawList = items;
          break;
        }
      }
    } catch {
      // Continue to next endpoint fallback
    }
  }

  const announcements = rawList.map((item: any, idx: number) => {
    const id = String(
      item.id ||
      item.id_thong_bao ||
      item.ma_thong_bao ||
      item.id_tb ||
      item.guid ||
      `${item.tieu_de || item.title || 'tb'}-${item.ngay_tao || item.ngay_dang || idx}`
    );

    const title =
      item.tieu_de ||
      item.title ||
      item.ten_thong_bao ||
      item.subject ||
      'Thông báo mới từ Học viện PTIT';

    const content =
      item.noi_dung ||
      item.content ||
      item.noi_dung_chi_tiet ||
      item.description ||
      '';

    const summary =
      item.noi_dung_tom_tat ||
      item.tom_tat ||
      item.summary ||
      (content ? content.replace(/<[^>]+>/g, '').slice(0, 250) : '');

    const publishDate =
      item.ngay_dang ||
      item.ngay_tao ||
      item.created_at ||
      item.ngay_gui ||
      new Date().toLocaleDateString('vi-VN');

    const sender =
      item.nguoi_gui ||
      item.tac_gia ||
      item.don_vi_gui ||
      'Phòng Đào tạo / Học viện PTIT';

    return {
      id,
      title,
      summary,
      content,
      publishDate,
      sender,
      link: 'https://qldttx.pttc1.edu.vn/#/xemthongbao',
    };
  });

  return { announcements };
}
