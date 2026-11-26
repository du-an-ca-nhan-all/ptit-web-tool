/**
 * QLDTTX Course Registration & Single-Semester Courses fetchers.
 */

import { API_URL, QLDTTX_SEMESTER_COURSES_API_URL, REQUEST_BODY } from './constants';
import { postQldttxWithAuth } from './httpClient';
import type { QldttxAccountInput } from './types';

/**
 * Lấy danh sách kết quả đăng ký môn học (ĐKMH) từ cổng QLDTTX cho sinh viên
 */
export async function fetchStudentCoursesFromQLDTTX(account: QldttxAccountInput): Promise<{
  data: any;
  totalCourses: number;
  totalCredits: number;
  tuitionFee: number;
}> {
  const { response, parsed } = await postQldttxWithAuth({
    url: API_URL,
    body: REQUEST_BODY,
    account,
  });

  if (!response.ok) {
    throw new Error(
      `Cổng QLDTTX phản hồi lỗi (${response.status}): ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`
    );
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
 * Lấy danh sách môn học & thời khóa biểu của một học kỳ cụ thể từ cổng QLDTTX (/#/tkb-hocky)
 */
export async function fetchSemesterCoursesFromQLDTTX(
  account: QldttxAccountInput,
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
  const hocKyNum = Number(hocKy);
  const bodyPayload = {
    hoc_ky: hocKyNum,
    loai_doi_tuong: 1,
    id_du_lieu: null,
  };

  const { response, parsed, newToken } = await postQldttxWithAuth({
    url: QLDTTX_SEMESTER_COURSES_API_URL,
    body: bodyPayload,
    account,
  });

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
    newToken,
  };
}
