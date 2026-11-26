import {
  getValidSlinkTokenOrRefresh,
  SLINK_USER_AGENT,
} from '../slinkServerService';
import { SLINK_QLDT_API_BASE } from './constants';
import { SlinkCredentials, SlinkFetchedGradesPayload } from './types';

/**
 * Gọi API S-Link lấy toàn bộ thông tin kết quả học tập của sinh viên
 */
export async function fetchStudentGradesFromSlink(
  credentials: SlinkCredentials
): Promise<SlinkFetchedGradesPayload> {
  // Lấy hoặc refresh token
  const authRes = await getValidSlinkTokenOrRefresh({
    username: credentials.username,
    password: credentials.password,
    existingToken: credentials.token,
    refreshToken: credentials.refreshToken,
  });

  const rawToken = authRes.token.replace(/^Bearer\s+/i, '').trim();
  const headers = {
    Authorization: `Bearer ${rawToken}`,
    'x-data-partition-code': 'PTIT',
    'Accept-Language': 'vi',
    Accept: 'application/json, text/plain, */*',
    'User-Agent': SLINK_USER_AGENT,
  };

  // 1. Lấy thông tin sinh viên & ngành
  const resMe = await fetch(`${SLINK_QLDT_API_BASE}/sinh-vien/me`, {
    headers,
  });
  if (!resMe.ok) {
    throw new Error(`Gọi API thông tin sinh viên S-Link thất bại (HTTP ${resMe.status})`);
  }
  const dataMe = await resMe.json();
  const sinhVien = dataMe?.data || null;

  // 2. Lấy thông tin khóa ngành
  let khoaNganh = null;
  try {
    const resKhoaNganh = await fetch(`${SLINK_QLDT_API_BASE}/sinh-vien/me/khoa-nganh`, {
      headers,
    });
    if (resKhoaNganh.ok) {
      const dataKhoaNganh = await resKhoaNganh.json();
      khoaNganh = dataKhoaNganh?.data || null;
    }
  } catch (err) {
    console.warn('[fetchStudentGradesFromSlink] Lỗi lấy khóa ngành:', err);
  }

  const maKhoaNganh =
    khoaNganh?.khoaNganhChinh?.ma ||
    sinhVien?.maKhoaNganh ||
    sinhVien?.kqhtTichLuyNganh1?.maKhoaNganh ||
    '';

  // 2.1 Lấy thông tin Chương Trình Đào Tạo chuẩn (CTĐT hiện tại để lấy tổng số tín chỉ CTĐT chuẩn: ví dụ 150 TC)
  let chuongTrinhDaoTao = null;
  if (maKhoaNganh) {
    try {
      const resCtdt = await fetch(
        `${SLINK_QLDT_API_BASE}/chuong-trinh-dao-tao/me/khoa-nganh/${encodeURIComponent(
          maKhoaNganh
        )}/hien-tai`,
        { headers }
      );
      if (resCtdt.ok) {
        const dataCtdt = await resCtdt.json();
        chuongTrinhDaoTao = dataCtdt?.data || null;
      }
    } catch (err) {
      console.warn('[fetchStudentGradesFromSlink] Lỗi lấy CTĐT hiện tại:', err);
    }

    // Fallback qua tiến trình chuẩn đầu ra nếu chưa có
    if (!chuongTrinhDaoTao) {
      try {
        const resChuanDauRa = await fetch(
          `${SLINK_QLDT_API_BASE}/chung-chi-sv/chung-chi-chuan-dau-ra/tien-trinh/me/khoa-nganh/${encodeURIComponent(
            maKhoaNganh
          )}`,
          { headers }
        );
        if (resChuanDauRa.ok) {
          const dataCdr = await resChuanDauRa.json();
          chuongTrinhDaoTao = dataCdr?.data?.ctdtKeHoach || null;
        }
      } catch (err) {
        console.warn('[fetchStudentGradesFromSlink] Lỗi lấy CTĐT từ chuẩn đầu ra:', err);
      }
    }
  }

  // 3. Lấy danh sách kết quả học tập theo từng học kỳ
  let semesters: any[] = [];
  if (maKhoaNganh) {
    try {
      const resSem = await fetch(
        `${SLINK_QLDT_API_BASE}/kqht-hoc-ky/me/many/khoa-nganh/${encodeURIComponent(
          maKhoaNganh
        )}?sort=${encodeURIComponent(JSON.stringify({ maHocKy: 1 }))}`,
        { headers }
      );
      if (resSem.ok) {
        const dataSem = await resSem.json();
        semesters = dataSem?.data || [];
      }
    } catch (err) {
      console.warn('[fetchStudentGradesFromSlink] Lỗi lấy danh sách học kỳ:', err);
    }
  }

  // 4. Lấy danh sách toàn bộ điểm học phần
  let courses: any[] = [];
  const courseUrl = maKhoaNganh
    ? `${SLINK_QLDT_API_BASE}/diem-hp-sv-hk/sinh-vien/me?maKhoaNganh=${encodeURIComponent(maKhoaNganh)}`
    : `${SLINK_QLDT_API_BASE}/diem-hp-sv-hk/sinh-vien/me`;

  const resCourses = await fetch(courseUrl, { headers });
  if (!resCourses.ok) {
    throw new Error(`Gọi API danh sách môn học & điểm S-Link thất bại (HTTP ${resCourses.status})`);
  }
  const dataCourses = await resCourses.json();
  courses = dataCourses?.data || [];

  // 5. Lấy thống kê điểm PI / PLO (tùy chọn)
  let statistics: any = null;
  if (maKhoaNganh) {
    try {
      const resStat = await fetch(
        `${SLINK_QLDT_API_BASE}/diem-hp-sv-hk/thong-ke-diem-pi/me/khoa-nganh/${encodeURIComponent(
          maKhoaNganh
        )}`,
        { headers }
      );
      if (resStat.ok) {
        const dataStat = await resStat.json();
        statistics = dataStat?.data || null;
      }
    } catch (err) {
      console.warn('[fetchStudentGradesFromSlink] Lỗi lấy thống kê PI:', err);
    }
  }

  return {
    sinhVien,
    khoaNganh,
    chuongTrinhDaoTao,
    semesters,
    courses,
    statistics,
    newToken: authRes.isNew ? authRes.token : undefined,
    newRefreshToken: authRes.isNew ? authRes.refreshToken : undefined,
    tokenExpiresAt: authRes.isNew ? authRes.tokenExpiresAt : undefined,
    refreshTokenExpiresAt: authRes.isNew ? authRes.refreshTokenExpiresAt : undefined,
    lastPulledAt: new Date().toISOString(),
  };
}
