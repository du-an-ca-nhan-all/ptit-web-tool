import { postQldttxEndpoint, resolveAccountToken } from './httpClient';
import type {
  OpenCourseGroupItem,
  OpenCoursesResult,
  QldttxAccountInput,
  RegisteredCoursesResult,
  SubjectDictItem,
} from './types';

/**
 * Lấy danh sách nhóm tổ môn học mở để đăng ký (/api/dkmh/w-locdsnhomto)
 */
export async function fetchOpenCourseGroupsFromQLDTTX(
  account: QldttxAccountInput
): Promise<OpenCoursesResult> {
  const tokenState = await resolveAccountToken(account, true);
  const endpoint = '/api/dkmh/w-locdsnhomto';
  const body = {
    is_CVHT: false,
    additional: {
      paging: { limit: 99999, page: 1 },
      ordering: [{ name: '', order_type: '' }],
    },
  };

  const { parsed, accumulatedToken } = await postQldttxEndpoint({ endpoint, body, account, tokenState });

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
export async function fetchRegisteredCoursesFromQLDTTX(
  account: QldttxAccountInput
): Promise<RegisteredCoursesResult> {
  const tokenState = await resolveAccountToken(account, true);
  const endpoint = '/api/dkmh/w-locdskqdkmhsinhvien';
  const body = {
    is_CVHT: false,
    is_Clear: false,
  };

  const { parsed, accumulatedToken } = await postQldttxEndpoint({ endpoint, body, account, tokenState });

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
