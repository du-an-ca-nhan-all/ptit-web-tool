/**
 * QLDTTX Student Grades & Academic Summary fetcher.
 */

import {
  QLDTTX_GRADES_API_URL,
  QLDTTX_LOW_GRADES_API_URL,
  QLDTTX_SUMMARY_GRADES_API_URL,
} from './constants';
import { buildAuthHeaders, postQldttxWithAuth } from './httpClient';
import type { QldttxAccountInput } from './types';

/**
 * Lấy danh sách điểm thi, bảng điểm học kỳ & kết quả học tập từ cổng QLDTTX
 */
export async function fetchStudentGradesFromQLDTTX(account: QldttxAccountInput): Promise<{
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
  // 1. Gọi API Bảng điểm chi tiết theo học kỳ
  const { response, parsed, effectiveToken, newToken } = await postQldttxWithAuth({
    url: QLDTTX_GRADES_API_URL,
    body: {},
    account,
  });

  if (!response.ok || (parsed && parsed.result === false && parsed.code === 401)) {
    throw new Error(
      `Cổng QLDTTX phản hồi lỗi (${response.status}): ${typeof parsed === 'string' ? parsed : parsed?.message || JSON.stringify(parsed)}`
    );
  }

  // 2. Gọi thêm API Tổng hợp điểm tích lũy
  let summaryData: any = null;
  try {
    const sumRes = await fetch(QLDTTX_SUMMARY_GRADES_API_URL, {
      method: 'POST',
      headers: buildAuthHeaders(effectiveToken),
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
      headers: buildAuthHeaders(effectiveToken),
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
  const latestSemesterWithGpa = rawSemesters.find(
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
      const isPassed =
        m.ket_qua === 1 || m.ket_qua === '1' || (m.diem_tk_so !== '' && parseFloat(m.diem_tk_so) >= 1.0);
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
    newToken,
  };
}
