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

export const QLDTTX_ANNOUNCEMENTS_API_URL = 'https://qldttx.pttc1.edu.vn/api/web/w-locdsthongbao';

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
    isRead?: boolean;
    isMustRead?: boolean;
    targetSearch?: string;
    link?: string;
  }>;
  unreadCount: number;
  totalCount: number;
  newToken?: string;
}> {
  let validToken = account.token;
  let isNew = false;
  let accumulatedToken: string | undefined;

  if (!validToken && account.password) {
    const res = await getValidTokenOrRefresh({
      username: account.username,
      password: account.password,
      existingToken: account.token,
    });
    validToken = res.token;
    isNew = res.isNew;
    if (isNew) accumulatedToken = validToken;
  }

  if (!validToken) {
    throw new Error('Chưa có token hoặc mật khẩu để kết nối cổng QLDTTX');
  }

  const rawToken = validToken.replace(/^Bearer\s+/i, '').trim();

  const bodyPayload = {
    filter: {
      id: null,
      is_noi_dung: true,
      is_web: true,
    },
    additional: {
      paging: {
        limit: 100,
        page: 1,
      },
      ordering: [
        {
          name: 'ngay_gui',
          order_type: 1,
        },
      ],
    },
  };

  let response = await fetch(QLDTTX_ANNOUNCEMENTS_API_URL, {
    method: 'POST',
    headers: {
      ...STATIC_HEADERS,
      Authorization: `Bearer ${rawToken}`,
      Cookie: `access_token=${rawToken}`,
    },
    body: JSON.stringify(bodyPayload),
  });

  // If token expired (401/403) and password available, auto refresh token & retry
  if ((response.status === 401 || response.status === 403) && account.password) {
    const fresh = await loginAndGetToken({
      username: account.username,
      password: account.password,
    });
    accumulatedToken = fresh;
    const freshRaw = fresh.replace(/^Bearer\s+/i, '').trim();
    response = await fetch(QLDTTX_ANNOUNCEMENTS_API_URL, {
      method: 'POST',
      headers: {
        ...STATIC_HEADERS,
        Authorization: `Bearer ${freshRaw}`,
        Cookie: `access_token=${freshRaw}`,
      },
      body: JSON.stringify(bodyPayload),
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
    throw new Error(
      `Cổng QLDTTX phản hồi lỗi (${response.status}): ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`
    );
  }

  const dataObj = parsed?.data || {};
  const rawList: any[] = Array.isArray(dataObj?.ds_thong_bao)
    ? dataObj.ds_thong_bao
    : Array.isArray(dataObj?.items)
    ? dataObj.items
    : Array.isArray(dataObj)
    ? dataObj
    : [];

  const unreadCount = typeof dataObj?.notification === 'number' ? dataObj.notification : 0;
  const totalCount = typeof dataObj?.total_items === 'number' ? dataObj.total_items : rawList.length;

  const announcements = rawList.map((item: any, idx: number) => {
    const id = String(
      item.id ||
      item.id_thong_bao ||
      item.ma_thong_bao ||
      item.id_tb ||
      item.guid ||
      `${item.tieu_de || item.title || 'tb'}-${item.ngay_gui || item.ngay_tao || item.ngay_dang || idx}`
    );

    const title =
      item.tieu_de ||
      item.title ||
      item.ten_thong_bao ||
      item.subject ||
      'Thông báo mới từ Cổng QLDTTX (PTTC1)';

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
      (content ? content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().slice(0, 350) : '');

    const publishDate =
      item.ngay_gui ||
      item.ngay_dang ||
      item.ngay_tao ||
      item.created_at ||
      new Date().toISOString();

    const sender =
      item.nguoi_gui ||
      item.tac_gia ||
      item.don_vi_gui ||
      'Phòng Đào tạo / Giảng viên PTIT';

    const isRead = item.is_da_doc !== undefined ? Boolean(item.is_da_doc) : true;
    const isMustRead = Boolean(item.is_phai_xem);
    const targetSearch = item.doi_tuong_search || item.phan_cap_search || '';

    return {
      id,
      title,
      summary,
      content,
      publishDate,
      sender,
      isRead,
      isMustRead,
      targetSearch,
      link: 'https://qldttx.pttc1.edu.vn/#/xemthongbao',
    };
  });

  return {
    announcements,
    unreadCount,
    totalCount,
    newToken: accumulatedToken,
  };
}

export const QLDTTX_SEMESTER_API_URL = 'https://qldttx.pttc1.edu.vn/api/sch/w-locdshockytkbuser';
export const QLDTTX_TIMETABLE_API_URL = 'https://qldttx.pttc1.edu.vn/api/sch/w-locdstkbtuanusertheohocky';

/**
 * Lấy danh sách học kỳ thời khóa biểu từ cổng QLDTTX (https://qldttx.pttc1.edu.vn/api/sch/w-locdshockytkbuser)
 */
export async function fetchStudentSemestersFromQLDTTX(account: {
  username: string;
  password?: string;
  token?: string | null;
}): Promise<{
  currentSemester: number;
  semesters: Array<{
    hoc_ky: number;
    ten_hoc_ky: string;
    ngay_bat_dau_hk?: string;
    ngay_ket_thuc_hk?: string;
  }>;
  newToken?: string;
}> {
  let validToken = account.token;
  let isNew = false;

  if (!validToken && account.password) {
    const res = await getValidTokenOrRefresh({
      username: account.username,
      password: account.password,
      existingToken: account.token,
    });
    validToken = res.token;
    isNew = res.isNew;
  }

  if (!validToken) {
    throw new Error('Chưa có token hoặc mật khẩu để kết nối cổng QLDTTX');
  }

  const rawToken = validToken.replace(/^Bearer\s+/i, '').trim();
  const bodyPayload = {
    filter: { is_tieng_anh: null },
    additional: {
      paging: { limit: 100, page: 1 },
      ordering: [{ name: 'hoc_ky', order_type: 1 }],
    },
  };

  let response = await fetch(QLDTTX_SEMESTER_API_URL, {
    method: 'POST',
    headers: {
      ...STATIC_HEADERS,
      Authorization: `Bearer ${rawToken}`,
      Cookie: `access_token=${rawToken}`,
    },
    body: JSON.stringify(bodyPayload),
  });

  let newToken: string | undefined = isNew ? validToken : undefined;

  if ((response.status === 401 || response.status === 403) && account.password) {
    const fresh = await loginAndGetToken({
      username: account.username,
      password: account.password,
    });
    newToken = fresh;
    const freshRaw = fresh.replace(/^Bearer\s+/i, '').trim();
    response = await fetch(QLDTTX_SEMESTER_API_URL, {
      method: 'POST',
      headers: {
        ...STATIC_HEADERS,
        Authorization: `Bearer ${freshRaw}`,
        Cookie: `access_token=${freshRaw}`,
      },
      body: JSON.stringify(bodyPayload),
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
    throw new Error(
      `Lỗi lấy danh sách học kỳ QLDTTX (${response.status}): ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`
    );
  }

  const dataObj = parsed?.data || {};
  const currentSemester = Number(dataObj?.hoc_ky_theo_ngay_hien_tai) || Number(dataObj?.ds_hoc_ky?.[0]?.hoc_ky) || 20261;
  const semesters = Array.isArray(dataObj?.ds_hoc_ky) ? dataObj.ds_hoc_ky : [];

  return {
    currentSemester,
    semesters,
    newToken,
  };
}

/**
 * Lấy thời khóa biểu tuần / học kỳ từ cổng QLDTTX (https://qldttx.pttc1.edu.vn/api/sch/w-locdstkbtuanusertheohocky)
 */
export async function fetchStudentTimetableFromQLDTTX(account: {
  username: string;
  password?: string;
  token?: string | null;
  idHocKy?: number | string | null;
}): Promise<{
  data: any;
  rawList: any[];
  weeks: any[];
  currentSemester: number;
  newToken?: string;
}> {
  let validToken = account.token;
  let isNew = false;
  let accumulatedToken: string | undefined;

  if (!validToken && account.password) {
    const res = await getValidTokenOrRefresh({
      username: account.username,
      password: account.password,
      existingToken: account.token,
    });
    validToken = res.token;
    isNew = res.isNew;
    if (isNew) accumulatedToken = validToken;
  }

  if (!validToken) {
    throw new Error('Chưa có token hoặc mật khẩu để kết nối cổng QLDTTX');
  }

  // Nếu chưa truyền idHocKy, tự động lấy học kỳ hiện tại qua API w-locdshockytkbuser
  let hocKyNum = Number(account.idHocKy);
  if (!hocKyNum || isNaN(hocKyNum)) {
    try {
      const semRes = await fetchStudentSemestersFromQLDTTX({
        username: account.username,
        password: account.password,
        token: validToken,
      });
      hocKyNum = semRes.currentSemester;
      if (semRes.newToken) {
        validToken = semRes.newToken;
        accumulatedToken = semRes.newToken;
      }
    } catch {
      hocKyNum = 20261; // Fallback học kỳ mặc định
    }
  }

  const rawToken = validToken.replace(/^Bearer\s+/i, '').trim();
  const bodyPayload = {
    filter: {
      hoc_ky: hocKyNum,
      ten_hoc_ky: '',
    },
    additional: {
      paging: {
        limit: 100,
        page: 1,
      },
      ordering: [
        {
          name: null,
          order_type: null,
        },
      ],
    },
  };

  let response = await fetch(QLDTTX_TIMETABLE_API_URL, {
    method: 'POST',
    headers: {
      ...STATIC_HEADERS,
      Authorization: `Bearer ${rawToken}`,
      Cookie: `access_token=${rawToken}`,
    },
    body: JSON.stringify(bodyPayload),
  });

  // If token expired (401/403) and password available, auto refresh token & retry
  if ((response.status === 401 || response.status === 403) && account.password) {
    const fresh = await loginAndGetToken({
      username: account.username,
      password: account.password,
    });
    accumulatedToken = fresh;
    const freshRaw = fresh.replace(/^Bearer\s+/i, '').trim();
    response = await fetch(QLDTTX_TIMETABLE_API_URL, {
      method: 'POST',
      headers: {
        ...STATIC_HEADERS,
        Authorization: `Bearer ${freshRaw}`,
        Cookie: `access_token=${freshRaw}`,
      },
      body: JSON.stringify(bodyPayload),
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
    throw new Error(
      `Cổng QLDTTX phản hồi lỗi (${response.status}): ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`
    );
  }

  const dataObj = parsed?.data || parsed || {};
  const weeks = Array.isArray(dataObj?.ds_tuan_tkb) ? dataObj.ds_tuan_tkb : [];
  
  // Trích xuất tất cả các buổi học từ từng tuần trong ds_tuan_tkb
  const allSessions: any[] = [];
  for (const week of weeks) {
    if (Array.isArray(week?.ds_thoi_khoa_bieu)) {
      for (const ses of week.ds_thoi_khoa_bieu) {
        allSessions.push({
          ...ses,
          tuan_hoc_ky: week.tuan_hoc_ky,
          thong_tin_tuan: week.thong_tin_tuan,
          tuan_tu_ngay: week.ngay_bat_dau,
          tuan_den_ngay: week.ngay_ket_thuc,
        });
      }
    }
  }

  // Nếu không có cấu trúc ds_tuan_tkb thì fallback các key khác
  const rawList = allSessions.length > 0
    ? allSessions
    : Array.isArray(dataObj?.ds_thoi_khoa_bieu)
    ? dataObj.ds_thoi_khoa_bieu
    : Array.isArray(dataObj?.ds_tkb_tuan)
    ? dataObj.ds_tkb_tuan
    : Array.isArray(dataObj?.ds_tkb)
    ? dataObj.ds_tkb
    : Array.isArray(dataObj?.ds_kqdkmh)
    ? dataObj.ds_kqdkmh
    : Array.isArray(dataObj)
    ? dataObj
    : [];

  return {
    data: parsed,
    rawList,
    weeks,
    currentSemester: hocKyNum,
    newToken: accumulatedToken,
  };
}

export const QLDTTX_GRADES_API_URL = 'https://qldttx.pttc1.edu.vn/api/srm/w-locdsdiemsinhvien?hien_thi_mon_theo_hkdk=false';
export const QLDTTX_SUMMARY_GRADES_API_URL = 'https://qldttx.pttc1.edu.vn/api/srm/w-locketquadiemsinhvien';
export const QLDTTX_LOW_GRADES_API_URL = 'https://qldttx.pttc1.edu.vn/api/srm/w-locdsmhchuadatdiemtoithieu';

/**
 * Lấy danh sách điểm thi, bảng điểm học kỳ & kết quả học tập từ cổng QLDTTX
 */
export async function fetchStudentGradesFromQLDTTX(account: {
  username: string;
  password?: string;
  token?: string | null;
}): Promise<{
  data: any;
  summaryData: any;
  lowGradesData?: any;
  semesters: any[];
  summary: {
    gpa10: number | null;
    gpa4: number | null;
    totalCreditsAccumulated: number;
    totalPassedCredits: number;
    totalCreditsRegistered: number;
    classification: string;
  };
  newToken?: string;
}> {
  let validToken = account.token;
  let isNew = false;
  let accumulatedToken: string | undefined;

  if (!validToken && account.password) {
    const res = await getValidTokenOrRefresh({
      username: account.username,
      password: account.password,
      existingToken: account.token,
    });
    validToken = res.token;
    isNew = res.isNew;
    if (isNew) accumulatedToken = validToken;
  }

  if (!validToken) {
    throw new Error('Chưa có token hoặc mật khẩu để kết nối cổng QLDTTX');
  }

  const rawToken = validToken.replace(/^Bearer\s+/i, '').trim();

  // 1. Gọi API Bảng điểm chi tiết theo học kỳ
  let response = await fetch(QLDTTX_GRADES_API_URL, {
    method: 'POST',
    headers: {
      ...STATIC_HEADERS,
      Authorization: `Bearer ${rawToken}`,
      Cookie: `access_token=${rawToken}`,
    },
    body: JSON.stringify({}),
  });

  // Nếu token hết hạn (401/403) và có password -> tự động refresh token
  if ((response.status === 401 || response.status === 403) && account.password) {
    const fresh = await loginAndGetToken({
      username: account.username,
      password: account.password,
    });
    accumulatedToken = fresh;
    const freshRaw = fresh.replace(/^Bearer\s+/i, '').trim();
    response = await fetch(QLDTTX_GRADES_API_URL, {
      method: 'POST',
      headers: {
        ...STATIC_HEADERS,
        Authorization: `Bearer ${freshRaw}`,
        Cookie: `access_token=${freshRaw}`,
      },
      body: JSON.stringify({}),
    });
  }

  const text = await response.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }

  if (!response.ok || (parsed && parsed.result === false && parsed.code === 401)) {
    throw new Error(
      `Cổng QLDTTX phản hồi lỗi (${response.status}): ${typeof parsed === 'string' ? parsed : parsed?.message || JSON.stringify(parsed)}`
    );
  }

  const effectiveToken = (accumulatedToken || validToken).replace(/^Bearer\s+/i, '').trim();

  // 2. Gọi thêm API Tổng hợp điểm tích lũy
  let summaryData: any = null;
  try {
    const sumRes = await fetch(QLDTTX_SUMMARY_GRADES_API_URL, {
      method: 'POST',
      headers: {
        ...STATIC_HEADERS,
        Authorization: `Bearer ${effectiveToken}`,
        Cookie: `access_token=${effectiveToken}`,
      },
      body: JSON.stringify({}),
    });
    if (sumRes.ok) {
      summaryData = await sumRes.json();
    }
  } catch (e) {
    console.warn('[fetchStudentGradesFromQLDTTX] Summary grades error:', e);
  }

  // 3. Gọi thêm API Môn điểm thấp / cải thiện
  let lowGradesData: any = null;
  try {
    const lowRes = await fetch(QLDTTX_LOW_GRADES_API_URL, {
      method: 'POST',
      headers: {
        ...STATIC_HEADERS,
        Authorization: `Bearer ${effectiveToken}`,
        Cookie: `access_token=${effectiveToken}`,
      },
      body: JSON.stringify({}),
    });
    if (lowRes.ok) {
      lowGradesData = await lowRes.json();
    }
  } catch (e) {
    console.warn('[fetchStudentGradesFromQLDTTX] Low grades error:', e);
  }

  const dataObj = parsed?.data || parsed || {};
  const rawSemesters = Array.isArray(dataObj?.ds_diem_hocky) ? dataObj.ds_diem_hocky : [];

  // Parse Summary metrics
  const sumDataObj = summaryData?.data || {};
  const gpa10Val = parseFloat(sumDataObj?.diem_tb_tich_luy);
  const gpa4Val = parseFloat(sumDataObj?.diem_tl_he_4);
  const creditsAccVal = parseInt(sumDataObj?.so_tc_tich_luy, 10);

  // Fallback metrics from semester records if summary API is missing fields
  let latestSemesterWithGpa = rawSemesters.find(
    (s: any) => s.dtb_tich_luy_he_4 !== undefined && s.dtb_tich_luy_he_4 !== ''
  );

  const fallbackGpa4 = latestSemesterWithGpa ? parseFloat(latestSemesterWithGpa.dtb_tich_luy_he_4) : null;
  const fallbackGpa10 = latestSemesterWithGpa ? parseFloat(latestSemesterWithGpa.dtb_tich_luy_he_10) : null;
  const fallbackCredits = latestSemesterWithGpa ? parseInt(latestSemesterWithGpa.so_tin_chi_dat_tich_luy, 10) : 0;

  const finalGpa4 = !isNaN(gpa4Val) ? gpa4Val : fallbackGpa4;
  const finalGpa10 = !isNaN(gpa10Val) ? gpa10Val : fallbackGpa10;
  const finalCreditsAccumulated = !isNaN(creditsAccVal) ? creditsAccVal : fallbackCredits || 0;

  // Tính tổng số tín chỉ đã đăng ký và tổng số môn đạt (chỉ tính vào tích lũy nếu môn tính vào GPA)
  let totalRegisteredCredits = 0;
  let totalPassedCredits = 0;

  rawSemesters.forEach((sem: any) => {
    const list = Array.isArray(sem.ds_diem_mon_hoc) ? sem.ds_diem_mon_hoc : [];
    list.forEach((m: any) => {
      const tc = parseFloat(m.so_tin_chi) || 0;
      totalRegisteredCredits += tc;
      const isCalculatedInGpa = !(
        m.khong_tinh_diem_tbtl === 1 ||
        m.khong_tinh_diem_tbtl === '1' ||
        m.khong_tinh_diem_tbtl === true ||
        m.tich_luy === 0 ||
        m.tich_luy === '0' ||
        m.tich_luy === false
      );
      const isPassed = m.ket_qua === 1 || m.ket_qua === '1' || (m.diem_tk_so !== '' && parseFloat(m.diem_tk_so) >= 1.0);
      if (isPassed && isCalculatedInGpa) {
        totalPassedCredits += tc;
      }
    });
  });

  // Xác định xếp loại học lực
  let classification = 'Chưa xếp loại';
  if (finalGpa4 !== null && !isNaN(finalGpa4)) {
    if (finalGpa4 >= 3.6) classification = 'Xuất sắc';
    else if (finalGpa4 >= 3.2) classification = 'Giỏi';
    else if (finalGpa4 >= 2.5) classification = 'Khá';
    else if (finalGpa4 >= 2.0) classification = 'Trung bình';
    else if (finalGpa4 >= 1.0) classification = 'Yếu';
    else classification = 'Kém';
  }

  return {
    data: parsed,
    summaryData,
    lowGradesData,
    semesters: rawSemesters,
    summary: {
      gpa10: finalGpa10,
      gpa4: finalGpa4,
      totalCreditsAccumulated: finalCreditsAccumulated,
      totalPassedCredits,
      totalCreditsRegistered: totalRegisteredCredits,
      classification,
    },
    newToken: accumulatedToken,
  };
}

export const QLDTTX_SEMESTER_COURSES_API_URL = 'https://qldttx.pttc1.edu.vn/api/sch/w-locdstkbhockytheodoituong';

/**
 * Lấy danh sách môn học & thời khóa biểu của một học kỳ cụ thể từ cổng QLDTTX (/#/tkb-hocky)
 */
export async function fetchSemesterCoursesFromQLDTTX(
  account: {
    username: string;
    password?: string;
    token?: string | null;
  },
  hocKy: number | string,
  tenHocKy?: string
): Promise<{
  hoc_ky: number;
  ten_hoc_ky: string;
  totalCourses: number;
  totalCredits: number;
  courses: Array<any>;
  rawNhomTo: Array<any>;
  newToken?: string;
}> {
  let validToken = account.token;
  let isNew = false;
  let accumulatedToken: string | undefined;

  if (!validToken && account.password) {
    const res = await getValidTokenOrRefresh({
      username: account.username,
      password: account.password,
      existingToken: account.token,
    });
    validToken = res.token;
    isNew = res.isNew;
    if (isNew) accumulatedToken = validToken;
  }

  if (!validToken) {
    throw new Error('Chưa có token hoặc mật khẩu để kết nối cổng QLDTTX');
  }

  const rawToken = validToken.replace(/^Bearer\s+/i, '').trim();
  const hocKyNum = Number(hocKy);

  const bodyPayload = {
    hoc_ky: hocKyNum,
    loai_doi_tuong: 1,
    id_du_lieu: null,
  };

  let response = await fetch(QLDTTX_SEMESTER_COURSES_API_URL, {
    method: 'POST',
    headers: {
      ...STATIC_HEADERS,
      Authorization: `Bearer ${rawToken}`,
      Cookie: `access_token=${rawToken}`,
    },
    body: JSON.stringify(bodyPayload),
  });

  if ((response.status === 401 || response.status === 403) && account.password) {
    const fresh = await loginAndGetToken({
      username: account.username,
      password: account.password,
    });
    accumulatedToken = fresh;
    const freshRaw = fresh.replace(/^Bearer\s+/i, '').trim();
    response = await fetch(QLDTTX_SEMESTER_COURSES_API_URL, {
      method: 'POST',
      headers: {
        ...STATIC_HEADERS,
        Authorization: `Bearer ${freshRaw}`,
        Cookie: `access_token=${freshRaw}`,
      },
      body: JSON.stringify(bodyPayload),
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
    throw new Error(
      `Cổng QLDTTX phản hồi lỗi lấy môn học kỳ ${hocKy} (${response.status}): ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`
    );
  }

  const dataObj = parsed?.data || {};
  const rawNhomTo: any[] = Array.isArray(dataObj?.ds_nhom_to) ? dataObj.ds_nhom_to : [];

  // Group raw schedule entries by ma_mon + nhom_to (or id_to_hoc) to get unique course items
  const courseMap = new Map<string, any>();

  for (const item of rawNhomTo) {
    const courseKey = `${item.ma_mon || ''}_${item.nhom_to || ''}_${item.id_to_hoc || ''}`;
    const tcNum = parseFloat(item.so_tc) || parseFloat(item.so_tc_so) || 0;

    const scheduleEntry = {
      thu: item.thu,
      tbd: item.tbd,
      so_tiet: item.so_tiet,
      tu_gio: item.tu_gio,
      den_gio: item.den_gio,
      phong: item.phong,
      tkb: item.tkb,
      gv: item.gv,
      dt_gv: item.dt_gv,
      link_hoc_online: item.link_hoc_online,
      lop: item.lop || item.ten_lop,
    };

    if (!courseMap.has(courseKey)) {
      courseMap.set(courseKey, {
        id_kqdk: item.id_to_hoc || courseKey,
        id_to_hoc: item.id_to_hoc,
        ma_mon: item.ma_mon,
        ten_mon: item.ten_mon,
        so_tc: tcNum,
        so_tc_hp: tcNum,
        nhom_to: item.nhom_to,
        lop: item.lop || item.ten_lop || '',
        ten_lop: item.ten_lop || item.lop || '',
        ds_lop: item.ds_lop || [],
        khoi: item.khoi || '',
        tkb: item.tkb || '',
        phong: item.phong || '',
        gv: item.gv || '',
        dt_gv: item.dt_gv || '',
        link_hoc_online: item.link_hoc_online || '',
        thu: item.thu,
        tbd: item.tbd,
        so_tiet: item.so_tiet,
        tu_gio: item.tu_gio,
        den_gio: item.den_gio,
        sl_dk: item.sl_dk,
        gc_kqdk: item.gc_kqdk || '',
        hoc_ky: hocKyNum,
        ten_hoc_ky: tenHocKy || `Học kỳ ${hocKyNum}`,
        schedules: [scheduleEntry],
        to_hoc: {
          id_to_hoc: item.id_to_hoc,
          ma_mon: item.ma_mon,
          ten_mon: item.ten_mon,
          so_tc: tcNum,
          so_tc_hp: tcNum,
          nhom_to: item.nhom_to,
          lop: item.lop || item.ten_lop || '',
          tkb: item.tkb || '',
          phong: item.phong || '',
          gv: item.gv || '',
          dt_gv: item.dt_gv || '',
          link_hoc_online: item.link_hoc_online || '',
          thu: item.thu,
          tbd: item.tbd,
          so_tiet: item.so_tiet,
          tu_gio: item.tu_gio,
          den_gio: item.den_gio,
          phai_dong: 0,
        },
      });
    } else {
      const existing = courseMap.get(courseKey);
      existing.schedules.push(scheduleEntry);
      // Append TKB string if different
      if (item.tkb && !existing.tkb.includes(item.tkb)) {
        existing.tkb = existing.tkb ? `${existing.tkb}; ${item.tkb}` : item.tkb;
        existing.to_hoc.tkb = existing.tkb;
      }
      if (!existing.link_hoc_online && item.link_hoc_online) {
        existing.link_hoc_online = item.link_hoc_online;
        existing.to_hoc.link_hoc_online = item.link_hoc_online;
      }
    }
  }

  const courses = Array.from(courseMap.values());
  let totalCredits = 0;
  courses.forEach((c) => {
    totalCredits += c.so_tc || 0;
  });

  return {
    hoc_ky: hocKyNum,
    ten_hoc_ky: tenHocKy || `Học kỳ ${hocKyNum}`,
    totalCourses: courses.length,
    totalCredits,
    courses,
    rawNhomTo,
    newToken: accumulatedToken,
  };
}

/**
 * Lấy toàn bộ môn học của tất cả các học kỳ cũ + kỳ hiện tại từ cổng QLDTTX (/#/tkb-hocky & /#/home)
 */
export async function fetchAllSemestersCoursesFromQLDTTX(account: {
  username: string;
  password?: string;
  token?: string | null;
}): Promise<{
  currentRegistration: {
    data: any;
    totalCourses: number;
    totalCredits: number;
    tuitionFee: number;
    courses: any[];
  };
  semesters: Array<{
    hoc_ky: number;
    ten_hoc_ky: string;
    ngay_bat_dau_hk?: string;
    ngay_ket_thuc_hk?: string;
    totalCourses: number;
    totalCredits: number;
    courses: any[];
  }>;
  allCourses: any[];
  totalCourses: number;
  totalCredits: number;
  tuitionFee: number;
  newToken?: string;
}> {
  let validToken = account.token;
  let accumulatedToken: string | undefined;

  // 1. Get semesters list from QLDTTX
  const semesterData = await fetchStudentSemestersFromQLDTTX(account);
  if (semesterData.newToken) {
    validToken = semesterData.newToken;
    accumulatedToken = semesterData.newToken;
  }

  const semesterList = semesterData.semesters || [];

  // 2. Fetch current live course registration (ĐKMH)
  let currentRegResult: any = {
    data: null,
    totalCourses: 0,
    totalCredits: 0,
    tuitionFee: 0,
    courses: [],
  };

  try {
    const regRes = await fetchStudentCoursesFromQLDTTX({
      username: account.username,
      password: account.password,
      token: validToken,
    });
    currentRegResult = {
      data: regRes.data,
      totalCourses: regRes.totalCourses,
      totalCredits: regRes.totalCredits,
      tuitionFee: regRes.tuitionFee,
      courses: regRes.data?.data?.ds_kqdkmh || [],
    };
  } catch (e) {
    console.warn('[fetchAllSemestersCoursesFromQLDTTX] Fetch current registration warning:', e);
  }

  // 3. Fetch courses for each semester via /api/sch/w-locdstkbhockytheodoituong
  const semesters: Array<{
    hoc_ky: number;
    ten_hoc_ky: string;
    ngay_bat_dau_hk?: string;
    ngay_ket_thuc_hk?: string;
    totalCourses: number;
    totalCredits: number;
    courses: any[];
  }> = [];

  for (const s of semesterList) {
    try {
      const semCourses = await fetchSemesterCoursesFromQLDTTX(
        {
          username: account.username,
          password: account.password,
          token: validToken,
        },
        s.hoc_ky,
        s.ten_hoc_ky
      );

      if (semCourses.newToken) {
        validToken = semCourses.newToken;
        accumulatedToken = semCourses.newToken;
      }

      semesters.push({
        hoc_ky: s.hoc_ky,
        ten_hoc_ky: s.ten_hoc_ky,
        ngay_bat_dau_hk: s.ngay_bat_dau_hk,
        ngay_ket_thuc_hk: s.ngay_ket_thuc_hk,
        totalCourses: semCourses.totalCourses,
        totalCredits: semCourses.totalCredits,
        courses: semCourses.courses,
      });
    } catch (err) {
      console.warn(`[fetchAllSemestersCoursesFromQLDTTX] Error fetching semester ${s.hoc_ky}:`, err);
    }
  }

  // 4. Combine all courses
  const allCoursesMap = new Map<string, any>();
  semesters.forEach((sem) => {
    sem.courses.forEach((c) => {
      const key = `${sem.hoc_ky}_${c.ma_mon}_${c.nhom_to}`;
      if (!allCoursesMap.has(key)) {
        allCoursesMap.set(key, { ...c, semesterHocKy: sem.hoc_ky, semesterName: sem.ten_hoc_ky });
      }
    });
  });
  const allCourses = Array.from(allCoursesMap.values());

  // Use current registration metrics if available, otherwise latest semester metrics
  const latestSem = semesters[0];
  const finalTotalCourses = currentRegResult.totalCourses > 0 ? currentRegResult.totalCourses : (latestSem?.totalCourses || 0);
  const finalTotalCredits = currentRegResult.totalCredits > 0 ? currentRegResult.totalCredits : (latestSem?.totalCredits || 0);
  const finalTuitionFee = currentRegResult.tuitionFee || 0;

  return {
    currentRegistration: currentRegResult,
    semesters,
    allCourses,
    totalCourses: finalTotalCourses,
    totalCredits: finalTotalCredits,
    tuitionFee: finalTuitionFee,
    newToken: accumulatedToken,
  };
}
