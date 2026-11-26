import { CourseItem, DiffSummary } from './types';

/**
 * Trích xuất danh sách môn học từ chuỗi JSON CourseRegistration.data
 */
export function extractCourseListFromData(dataStr?: string | null): CourseItem[] {
  if (!dataStr) return [];
  try {
    const parsed = JSON.parse(dataStr);
    const rawList = parsed?.data?.ds_kqdkmh || parsed?.ds_kqdkmh || (Array.isArray(parsed) ? parsed : []);
    return rawList
      .map((item: any) => {
        const toHoc = item.to_hoc || item;
        const maMon = toHoc.ma_mon || toHoc.MaMH || '';
        const idToHoc = String(toHoc.id_to_hoc || item.id_to_hoc || '').trim();
        if (!maMon && !idToHoc) return null;

        return {
          id_to_hoc: idToHoc,
          ma_mon: maMon,
          ten_mon: toHoc.ten_mon || toHoc.TenMH || maMon,
          nhom_to: String(toHoc.nhom_to || toHoc.NhomHoc || '').trim(),
          so_tc: Number(toHoc.so_tc) || Number(toHoc.so_tc_hp) || 0,
          lop: toHoc.lop || toHoc.Lop || '',
          tkb: toHoc.tkb || '',
          phai_dong: Number(toHoc.phai_dong) || Number(item.hoc_phi_tam_tinh) || 0,
          ngay_dang_ky: item.ngay_dang_ky || null,
          raw: item,
        };
      })
      .filter(Boolean) as CourseItem[];
  } catch {
    return [];
  }
}

/**
 * Tính toán so sánh môn học giữa Lớp trưởng và Sinh viên
 */
export function calculateCourseDiff(monitorCourses: CourseItem[], followerCourses: CourseItem[]): DiffSummary {
  const monitorMapByCode = new Map<string, CourseItem>();
  monitorCourses.forEach((c) => {
    const code = String(c.ma_mon || '').trim().toUpperCase();
    if (code) monitorMapByCode.set(code, c);
  });

  const followerMapByCode = new Map<string, CourseItem>();
  followerCourses.forEach((c) => {
    const code = String(c.ma_mon || '').trim().toUpperCase();
    if (code) followerMapByCode.set(code, c);
  });

  let matchedCount = 0;
  let diffGroupCount = 0;
  let missingCount = 0;
  let extraCount = 0;

  // So sánh môn của Lớp trưởng với Sinh viên
  monitorMapByCode.forEach((monCourse, code) => {
    const folCourse = followerMapByCode.get(code);
    if (!folCourse) {
      missingCount++; // Sinh viên chưa đăng ký môn này
    } else {
      const monGroup = String(monCourse.nhom_to || '').trim().toUpperCase();
      const folGroup = String(folCourse.nhom_to || '').trim().toUpperCase();
      const monId = String(monCourse.id_to_hoc || '').trim();
      const folId = String(folCourse.id_to_hoc || '').trim();

      if ((monId && folId && monId === folId) || (monGroup && folGroup && monGroup === folGroup)) {
        matchedCount++; // Trùng cả mã môn và nhóm tổ
      } else {
        diffGroupCount++; // Trùng mã môn nhưng lệch nhóm tổ
      }
    }
  });

  // Môn sinh viên đăng ký mà Lớp trưởng không có
  followerMapByCode.forEach((_, code) => {
    if (!monitorMapByCode.has(code)) {
      extraCount++;
    }
  });

  const totalMon = monitorCourses.length;
  const matchPercent =
    totalMon > 0
      ? Math.round((matchedCount / totalMon) * 100)
      : followerCourses.length === 0
      ? 100
      : 0;

  return {
    matchedCount,
    diffGroupCount,
    missingCount,
    extraCount,
    matchPercent,
  };
}
