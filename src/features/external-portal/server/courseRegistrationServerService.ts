/**
 * PTIT QLDTTX (https://qldttx.pttc1.edu.vn/) Course Registration (ĐKMH) Server Service
 * Reverse-engineered from Netweb / AQTech frontend architecture
 */

import { getValidTokenOrRefresh } from './qldttxServerService';

export const QLDTTX_BASE_URL = 'https://qldttx.pttc1.edu.vn';

const STATIC_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
  'Content-Type': 'application/json',
  Origin: QLDTTX_BASE_URL,
  Referer: `${QLDTTX_BASE_URL}/`,
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  idpc: '0',
};

/**
 * Thuật toán mã hóa Header 'ua' reverse-engineered từ hệ thống Frontend netweb (AQTech)
 */
export class CT {
  rk(start: number): number[] {
    const ks = this.sc();
    const step = (start % 3) + 1;
    return Array.from({ length: 10 }, (_, i) => ks[(start + i * step) % ks.length]);
  }

  sc(): number[] {
    const ki = [
      58, 43, 197, 133, 4, 165, 110, 3, 44, 202, 186, 28, 118, 177, 32, 94,
      219, 6, 199, 27, 101, 191, 66, 115, 234, 120, 10, 236, 104, 108, 74, 247,
      68, 198, 62, 203, 17, 102, 185, 42,
    ];
    return ki.slice(-36).slice(0, 32);
  }

  ec(s: string, start: number): number[] {
    const pw = this.rk(start).reverse();
    const hx = s.split('').map((x) => x.charCodeAt(0));
    let bi: number[] = [];
    while (bi.length < hx.length) bi = [...bi, ...pw];
    return hx.map((x, i) => x ^ bi[i]);
  }
}

function rnd(mx: number): number {
  return Math.ceil(Math.random() * mx);
}

/**
 * Tạo header 'ua' cần thiết cho tất cả các API endpoint /api/* của AQTech
 * @param endpoint - URI endpoint (ví dụ: '/api/dkmh/w-locdsnhomto')
 */
export function generateUA(endpoint: string): string {
  const parts = endpoint.toLowerCase().split('/api/');
  let pfx = (parts[1] || endpoint).toUpperCase();
  if (pfx.length > 22) pfx = pfx.slice(0, 22);
  const now = `${rnd(89) + 10}${Date.now()}${rnd(89) + 10}${pfx}`;
  const start = rnd(31);
  const ret = [start + 32, ...new CT().ec(now, start)].map((x) => String.fromCharCode(x)).join('');
  return Buffer.from(ret, 'latin1').toString('base64');
}

export interface OpenCourseGroupItem {
  id_to_hoc: string;
  ma_mon: string;
  ten_mon?: string;
  nhom_to: string;
  so_tc?: number;
  so_tc_hp?: number;
  sl_dk: number;
  sl_cl: number;
  sl_cp: number;
  enable: boolean;
  gc_enable?: string;
  tkb?: string;
  phai_dong?: number;
  hoc_phi_tam_tinh?: number;
  lop?: string;
  ds_khoa?: any[];
  [key: string]: any;
}

export interface SubjectDictItem {
  ma: string;
  ten: string;
  so_tc?: number;
  so_tc_hp?: number;
  [key: string]: any;
}

export interface OpenCoursesResult {
  ds_nhom_to: OpenCourseGroupItem[];
  ds_mon_hoc: SubjectDictItem[];
  hoc_ky_dang_ky: string;
  trong_thoi_gian_dang_ky: boolean;
  id_rs: string;
  newToken?: string;
  rawResponse?: any;
}

export interface RegisteredCoursesResult {
  ds_kqdkmh: any[];
  totalCourses: number;
  totalCredits: number;
  tuitionFee: number;
  id_rs?: string;
  newToken?: string;
  rawResponse?: any;
}

export interface RegisterCourseResponse {
  success: boolean;
  message?: string;
  id_rs?: string;
  ket_qua_dang_ky?: any;
  newToken?: string;
  rawResponse?: any;
}

/**
 * Lấy danh sách nhóm tổ môn học mở để đăng ký (/api/dkmh/w-locdsnhomto)
 */
export async function fetchOpenCourseGroupsFromQLDTTX(account: {
  username: string;
  password?: string;
  token?: string | null;
}): Promise<OpenCoursesResult> {
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

  const endpoint = '/api/dkmh/w-locdsnhomto';
  const url = `${QLDTTX_BASE_URL}${endpoint}`;
  const rawToken = validToken.replace(/^Bearer\s+/i, '').trim();

  const body = {
    is_CVHT: false,
    additional: {
      paging: { limit: 99999, page: 1 },
      ordering: [{ name: '', order_type: '' }],
    },
  };

  let response = await fetch(url, {
    method: 'POST',
    headers: {
      ...STATIC_HEADERS,
      Authorization: `Bearer ${rawToken}`,
      Cookie: `access_token=${rawToken}`,
      ua: generateUA(endpoint),
    },
    body: JSON.stringify(body),
  });

  // Token hết hạn -> tự động login lại & retry
  if ((response.status === 401 || response.status === 403) && account.password) {
    const fresh = await getValidTokenOrRefresh({
      username: account.username,
      password: account.password,
    });
    accumulatedToken = fresh.token;
    const freshRaw = fresh.token.replace(/^Bearer\s+/i, '').trim();
    response = await fetch(url, {
      method: 'POST',
      headers: {
        ...STATIC_HEADERS,
        Authorization: `Bearer ${freshRaw}`,
        Cookie: `access_token=${freshRaw}`,
        ua: generateUA(endpoint),
      },
      body: JSON.stringify(body),
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
      `Cổng QLDTTX phản hồi lỗi (${response.status}): ${typeof parsed === 'string' ? parsed : parsed?.message || JSON.stringify(parsed)}`
    );
  }

  if (parsed && parsed.result === false) {
    throw new Error(parsed.message || 'Không thể lấy danh sách nhóm tổ môn học mở');
  }

  const dataObj = parsed?.data || {};
  const dsNhomTo: OpenCourseGroupItem[] = Array.isArray(dataObj?.ds_nhom_to) ? dataObj.ds_nhom_to : [];
  const dsMonHoc: SubjectDictItem[] = Array.isArray(dataObj?.ds_mon_hoc) ? dataObj.ds_mon_hoc : [];
  const idRs = String(parsed?.id_rs || dataObj?.id_rs || '');
  const hocKyDangKy = String(dataObj?.hoc_ky_dang_ky || '');
  const trongThoiGianDangKy = Boolean(dataObj?.trong_thoi_gian_dang_ky ?? true);

  return {
    ds_nhom_to: dsNhomTo,
    ds_mon_hoc: dsMonHoc,
    hoc_ky_dang_ky: hocKyDangKy,
    trong_thoi_gian_dang_ky: trongThoiGianDangKy,
    id_rs: idRs,
    newToken: accumulatedToken,
    rawResponse: parsed,
  };
}

/**
 * Lấy danh sách kết quả môn học đã đăng ký (/api/dkmh/w-locdskqdkmhsinhvien)
 */
export async function fetchRegisteredCoursesFromQLDTTX(account: {
  username: string;
  password?: string;
  token?: string | null;
}): Promise<RegisteredCoursesResult> {
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

  const endpoint = '/api/dkmh/w-locdskqdkmhsinhvien';
  const url = `${QLDTTX_BASE_URL}${endpoint}`;
  const rawToken = validToken.replace(/^Bearer\s+/i, '').trim();

  const body = {
    is_CVHT: false,
    is_Clear: false,
  };

  let response = await fetch(url, {
    method: 'POST',
    headers: {
      ...STATIC_HEADERS,
      Authorization: `Bearer ${rawToken}`,
      Cookie: `access_token=${rawToken}`,
      ua: generateUA(endpoint),
    },
    body: JSON.stringify(body),
  });

  if ((response.status === 401 || response.status === 403) && account.password) {
    const fresh = await getValidTokenOrRefresh({
      username: account.username,
      password: account.password,
    });
    accumulatedToken = fresh.token;
    const freshRaw = fresh.token.replace(/^Bearer\s+/i, '').trim();
    response = await fetch(url, {
      method: 'POST',
      headers: {
        ...STATIC_HEADERS,
        Authorization: `Bearer ${freshRaw}`,
        Cookie: `access_token=${freshRaw}`,
        ua: generateUA(endpoint),
      },
      body: JSON.stringify(body),
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
      `Cổng QLDTTX phản hồi lỗi (${response.status}): ${typeof parsed === 'string' ? parsed : parsed?.message || JSON.stringify(parsed)}`
    );
  }

  const dataObj = parsed?.data || {};
  const courseList = Array.isArray(dataObj?.ds_kqdkmh) ? dataObj.ds_kqdkmh : [];
  const idRs = String(parsed?.id_rs || dataObj?.id_rs || '');

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
    ds_kqdkmh: courseList,
    totalCourses: courseList.length,
    totalCredits,
    tuitionFee,
    id_rs: idRs,
    newToken: accumulatedToken,
    rawResponse: parsed,
  };
}

/**
 * Đăng ký một nhóm tổ môn học (/api/dkmh/w-xulydkmhsinhvien)
 */
export async function registerCourseGroupQLDTTX(
  account: {
    username: string;
    password?: string;
    token?: string | null;
  },
  options: {
    id_to_hoc: string;
    id_rs?: string;
    sv_nganh?: number;
  }
): Promise<RegisterCourseResponse> {
  let validToken = account.token;
  let accumulatedToken: string | undefined;

  if (!validToken && account.password) {
    const res = await getValidTokenOrRefresh({
      username: account.username,
      password: account.password,
      existingToken: account.token,
    });
    validToken = res.token;
    accumulatedToken = validToken;
  }

  if (!validToken) {
    throw new Error('Chưa có token hoặc mật khẩu để kết nối cổng QLDTTX');
  }

  let effectiveIdRs = options.id_rs;
  // Nếu chưa có id_rs, tự động fetch w-locdsnhomto để lấy id_rs
  if (!effectiveIdRs) {
    const openRes = await fetchOpenCourseGroupsFromQLDTTX({
      username: account.username,
      password: account.password,
      token: validToken,
    });
    effectiveIdRs = openRes.id_rs;
    if (openRes.newToken) {
      validToken = openRes.newToken;
      accumulatedToken = openRes.newToken;
    }
  }

  const endpoint = '/api/dkmh/w-xulydkmhsinhvien';
  const url = `${QLDTTX_BASE_URL}${endpoint}`;
  const rawToken = validToken.replace(/^Bearer\s+/i, '').trim();

  const body = {
    filter: {
      id_to_hoc: options.id_to_hoc,
      is_checked: true,
      sv_nganh: options.sv_nganh ?? 1,
      id_rs: effectiveIdRs || '',
    },
  };

  let response = await fetch(url, {
    method: 'POST',
    headers: {
      ...STATIC_HEADERS,
      Authorization: `Bearer ${rawToken}`,
      Cookie: `access_token=${rawToken}`,
      ua: generateUA(endpoint),
    },
    body: JSON.stringify(body),
  });

  if ((response.status === 401 || response.status === 403) && account.password) {
    const fresh = await getValidTokenOrRefresh({
      username: account.username,
      password: account.password,
    });
    accumulatedToken = fresh.token;
    const freshRaw = fresh.token.replace(/^Bearer\s+/i, '').trim();
    response = await fetch(url, {
      method: 'POST',
      headers: {
        ...STATIC_HEADERS,
        Authorization: `Bearer ${freshRaw}`,
        Cookie: `access_token=${freshRaw}`,
        ua: generateUA(endpoint),
      },
      body: JSON.stringify(body),
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
      `Cổng QLDTTX phản hồi lỗi (${response.status}): ${typeof parsed === 'string' ? parsed : parsed?.message || JSON.stringify(parsed)}`
    );
  }

  const resData = parsed?.data || {};
  const isThanhCong = Boolean(resData?.is_thanh_cong || (parsed?.code === 200 && parsed?.result === true && !resData?.thong_bao_loi));
  const newIdRs = String(resData?.id_rs || parsed?.id_rs || effectiveIdRs || '');
  const thongBaoLoi = resData?.thong_bao_loi || parsed?.message || '';

  return {
    success: isThanhCong,
    message: isThanhCong ? 'Đăng ký môn học thành công' : (thongBaoLoi || 'Đăng ký không thành công'),
    id_rs: newIdRs,
    ket_qua_dang_ky: resData?.ket_qua_dang_ky,
    newToken: accumulatedToken,
    rawResponse: parsed,
  };
}

/**
 * Hủy đăng ký một môn học (/api/dkmh/w-xulydkmhsinhvien)
 */
export async function cancelCourseGroupQLDTTX(
  account: {
    username: string;
    password?: string;
    token?: string | null;
  },
  options: {
    id_to_hoc: string;
    id_rs?: string;
    sv_nganh?: number;
  }
): Promise<RegisterCourseResponse> {
  let validToken = account.token;
  let accumulatedToken: string | undefined;

  if (!validToken && account.password) {
    const res = await getValidTokenOrRefresh({
      username: account.username,
      password: account.password,
      existingToken: account.token,
    });
    validToken = res.token;
    accumulatedToken = validToken;
  }

  if (!validToken) {
    throw new Error('Chưa có token hoặc mật khẩu để kết nối cổng QLDTTX');
  }

  let effectiveIdRs = options.id_rs;
  if (!effectiveIdRs) {
    const openRes = await fetchOpenCourseGroupsFromQLDTTX({
      username: account.username,
      password: account.password,
      token: validToken,
    });
    effectiveIdRs = openRes.id_rs;
    if (openRes.newToken) {
      validToken = openRes.newToken;
      accumulatedToken = openRes.newToken;
    }
  }

  const endpoint = '/api/dkmh/w-xulydkmhsinhvien';
  const url = `${QLDTTX_BASE_URL}${endpoint}`;
  const rawToken = validToken.replace(/^Bearer\s+/i, '').trim();

  const body = {
    filter: {
      id_to_hoc: options.id_to_hoc,
      is_checked: false,
      sv_nganh: options.sv_nganh ?? 1,
      id_rs: effectiveIdRs || '',
    },
  };

  let response = await fetch(url, {
    method: 'POST',
    headers: {
      ...STATIC_HEADERS,
      Authorization: `Bearer ${rawToken}`,
      Cookie: `access_token=${rawToken}`,
      ua: generateUA(endpoint),
    },
    body: JSON.stringify(body),
  });

  if ((response.status === 401 || response.status === 403) && account.password) {
    const fresh = await getValidTokenOrRefresh({
      username: account.username,
      password: account.password,
    });
    accumulatedToken = fresh.token;
    const freshRaw = fresh.token.replace(/^Bearer\s+/i, '').trim();
    response = await fetch(url, {
      method: 'POST',
      headers: {
        ...STATIC_HEADERS,
        Authorization: `Bearer ${freshRaw}`,
        Cookie: `access_token=${freshRaw}`,
        ua: generateUA(endpoint),
      },
      body: JSON.stringify(body),
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
      `Cổng QLDTTX phản hồi lỗi (${response.status}): ${typeof parsed === 'string' ? parsed : parsed?.message || JSON.stringify(parsed)}`
    );
  }

  const resData = parsed?.data || {};
  const thongBaoLoi = resData?.thong_bao_loi || parsed?.message || '';
  const isThanhCong = Boolean(
    resData?.is_thanh_cong === true ||
    resData?.is_thanh_cong === 'true' ||
    (parsed?.result === true && !thongBaoLoi && resData?.is_thanh_cong !== false) ||
    (parsed?.code === 200 && parsed?.result === true && !thongBaoLoi) ||
    (parsed?.code === 200 && !thongBaoLoi && resData?.is_thanh_cong !== false && parsed?.result !== false)
  );
  const newIdRs = String(resData?.id_rs || parsed?.id_rs || effectiveIdRs || '');

  return {
    success: isThanhCong,
    message: isThanhCong ? 'Hủy môn học thành công' : (thongBaoLoi || 'Hủy môn học không thành công'),
    id_rs: newIdRs,
    newToken: accumulatedToken,
    rawResponse: parsed,
  };
}
