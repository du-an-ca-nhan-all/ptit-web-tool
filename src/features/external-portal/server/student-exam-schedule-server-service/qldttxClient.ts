import { getValidTokenOrRefresh, loginAndGetToken } from '../qldttxServerService';
import { QLDTTX_EXAM_SEMESTERS_URL, QLDTTX_PERSONAL_EXAMS_URL, STATIC_HEADERS } from './constants';
import type { StudentQldtSemester } from './types';

/**
 * Lấy danh sách học kỳ lịch thi từ cổng QLDTTX
 */
export async function fetchStudentExamSemestersFromQLDTTX(account: {
  username: string;
  password?: string;
  token?: string | null;
}): Promise<{
  semesters: StudentQldtSemester[];
  currentSemester: number;
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
    additional: { paging: { limit: 100, page: 1 }, ordering: [{ name: null, order_type: 1 }] },
  };

  let response = await fetch(QLDTTX_EXAM_SEMESTERS_URL, {
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
    response = await fetch(QLDTTX_EXAM_SEMESTERS_URL, {
      method: 'POST',
      headers: {
        ...STATIC_HEADERS,
        Authorization: `Bearer ${freshRaw}`,
        Cookie: `access_token=${freshRaw}`,
      },
      body: JSON.stringify(bodyPayload),
    });
  }

  if (!response.ok) {
    throw new Error(`Lỗi lấy danh sách học kỳ lịch thi QLDTTX (${response.status})`);
  }

  const json = await response.json();
  const rawSemesters: any[] = json?.data?.ds_hoc_ky || [];
  const semesters: StudentQldtSemester[] = rawSemesters.map((s) => ({
    hocKy: Number(s.hoc_ky),
    tenHocKy: s.ten_hoc_ky || `Học kỳ ${s.hoc_ky}`,
    ngayBatDauHk: s.ngay_bat_dau_hk,
    ngayKetThucHk: s.ngay_ket_thuc_hk,
  }));

  const currentSemester = semesters[0]?.hocKy || 20251;

  return {
    semesters,
    currentSemester,
    newToken,
  };
}

/**
 * Lấy danh sách lịch thi cá nhân theo học kỳ từ cổng QLDTTX
 */
export async function fetchStudentPersonalExamsFromQLDTTX(account: {
  username: string;
  password?: string;
  token?: string | null;
  idHocKy?: number | string | null;
}): Promise<{
  data: any;
  exams: any[];
  currentSemester: number;
  noticeNoTuitionFee?: string;
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

  let hocKyNum = Number(account.idHocKy);
  if (!hocKyNum || isNaN(hocKyNum)) {
    try {
      const semRes = await fetchStudentExamSemestersFromQLDTTX({
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
      hocKyNum = 20251;
    }
  }

  const rawToken = validToken.replace(/^Bearer\s+/i, '').trim();
  const bodyPayload = {
    filter: { hoc_ky: hocKyNum, is_giua_ky: false },
    additional: { paging: { limit: 100, page: 1 }, ordering: [{ name: null, order_type: null }] },
  };

  let response = await fetch(QLDTTX_PERSONAL_EXAMS_URL, {
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
    response = await fetch(QLDTTX_PERSONAL_EXAMS_URL, {
      method: 'POST',
      headers: {
        ...STATIC_HEADERS,
        Authorization: `Bearer ${freshRaw}`,
        Cookie: `access_token=${freshRaw}`,
      },
      body: JSON.stringify(bodyPayload),
    });
  }

  if (!response.ok) {
    throw new Error(`Lỗi lấy lịch thi cá nhân QLDTTX (${response.status})`);
  }

  const json = await response.json();
  const data = json?.data || {};
  const exams = Array.isArray(data?.ds_lich_thi) ? data.ds_lich_thi : [];

  return {
    data,
    exams,
    currentSemester: hocKyNum,
    noticeNoTuitionFee: data?.thong_bao_no_hoc_phi || undefined,
    newToken: accumulatedToken,
  };
}
