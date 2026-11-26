/**
 * QLDTTX Semesters & Weekly Timetable fetchers.
 */

import { QLDTTX_SEMESTER_API_URL, QLDTTX_TIMETABLE_API_URL } from './constants';
import { postQldttxWithAuth, resolveInitialToken } from './httpClient';
import type { QldttxAccountInput } from './types';

/**
 * Lấy danh sách học kỳ thời khóa biểu từ cổng QLDTTX (https://qldttx.pttc1.edu.vn/api/sch/w-locdshockytkbuser)
 */
export async function fetchStudentSemestersFromQLDTTX(account: QldttxAccountInput): Promise<{
  currentSemester: number;
  semesters: Array<{
    hoc_ky: number;
    ten_hoc_ky: string;
    ngay_bat_dau_hk?: string;
    ngay_ket_thuc_hk?: string;
  }>;
  newToken?: string;
}> {
  const bodyPayload = {
    filter: { is_tieng_anh: null },
    additional: {
      paging: { limit: 100, page: 1 },
      ordering: [{ name: 'hoc_ky', order_type: 1 }],
    },
  };

  const { response, parsed, newToken } = await postQldttxWithAuth({
    url: QLDTTX_SEMESTER_API_URL,
    body: bodyPayload,
    account,
  });

  if (!response.ok) {
    throw new Error(
      `Lỗi lấy danh sách học kỳ QLDTTX (${response.status}): ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`
    );
  }

  const dataObj = parsed?.data || {};
  const currentSemester =
    Number(dataObj?.hoc_ky_theo_ngay_hien_tai) || Number(dataObj?.ds_hoc_ky?.[0]?.hoc_ky) || 20261;
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
export async function fetchStudentTimetableFromQLDTTX(
  account: QldttxAccountInput & {
    idHocKy?: number | string | null;
  }
): Promise<{
  data: any;
  rawList: any[];
  weeks: any[];
  currentSemester: number;
  newToken?: string;
}> {
  let { validToken, accumulatedToken } = await resolveInitialToken(account);

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

  const { response, parsed, newToken } = await postQldttxWithAuth({
    url: QLDTTX_TIMETABLE_API_URL,
    body: bodyPayload,
    account,
    resolvedToken: validToken,
    initialAccumulatedToken: accumulatedToken,
  });

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
  const rawList =
    allSessions.length > 0
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
    newToken,
  };
}
