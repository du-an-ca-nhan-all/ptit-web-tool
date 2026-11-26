import { EnrolledCourseOption } from '../../types/reminder.types';
import { CourseMatchTarget, RawCourseRecord } from './types';

/**
 * Trích xuất tên giảng viên từ chuỗi TKB (ví dụ: "Thứ 3,tiết 13->15,Ph lopmonhoc27,GV Nguyễn Quang Huy,18/08/26 đến 25/08/26")
 */
export function extractLecturerFromTkb(tkb?: string): string | undefined {
  if (!tkb) return undefined;
  const match = tkb.match(/GV\s+([^,<\n]+)/i);
  return match ? match[1].trim() : undefined;
}

/**
 * Parse danh sách môn học từ chuỗi JSON của bảng CourseRegistration
 */
export function parseCourseRegistrationList(rawData: string): RawCourseRecord[] {
  const parsed = JSON.parse(rawData);
  const list =
    parsed?.ds_kqdkmh ||
    parsed?.data?.ds_kqdkmh ||
    parsed?.data?.ds_thoi_khoa_bieu ||
    (Array.isArray(parsed) ? parsed : []);

  return Array.isArray(list) ? list : [];
}

/**
 * Parse danh sách môn học từ chuỗi JSON của bảng StudentTimetableRecord
 */
export function parseTimetableList(rawData: string): RawCourseRecord[] {
  const parsed = JSON.parse(rawData);
  const list =
    parsed?.rawList ||
    parsed?.data?.ds_thoi_khoa_bieu ||
    parsed?.data?.ds_tkb_tuan ||
    parsed?.data?.ds_kqdkmh ||
    (Array.isArray(parsed) ? parsed : []);

  return Array.isArray(list) ? list : [];
}

/**
 * Thu thập các môn học hợp lệ từ danh sách raw vào courseMap (không ghi đè key đã tồn tại)
 */
export function collectCoursesFromList(
  list: RawCourseRecord[],
  courseMap: Map<string, EnrolledCourseOption>,
  fallbackClassCode?: string | null,
): void {
  for (const item of list) {
    if (item.is_da_rut_mon_hoc === true) continue;
    const toHoc = item.to_hoc || item;
    const idToHoc = String(toHoc.id_to_hoc || item.id_to_hoc || '').trim();
    const maMon = String(toHoc.ma_mon || item.ma_mon || '').trim();
    const tenMon = String(toHoc.ten_mon || item.ten_mon || '').trim();
    const nhomTo = String(toHoc.nhom_to || item.nhom_to || '01').trim();
    const lop = String(toHoc.lop || item.lop || fallbackClassCode || '').trim();
    const tkb = String(toHoc.tkb || item.tkb || '').trim();
    const giangVien = extractLecturerFromTkb(tkb);
    const soTc = Number(toHoc.so_tc_hp || toHoc.so_tc || item.so_tc) || 3;

    if (maMon && tenMon) {
      const key = idToHoc || `${maMon}_${nhomTo}`;
      if (!courseMap.has(key)) {
        courseMap.set(key, {
          idToHoc: idToHoc || `${maMon}-${nhomTo}`,
          idMon: toHoc.id_mon ? String(toHoc.id_mon) : undefined,
          maMon,
          tenMon,
          nhomTo,
          lop,
          tkb: tkb || undefined,
          giangVien,
          soTc,
        });
      }
    }
  }
}

/**
 * Kiểm tra xem danh sách môn học raw có chứa môn khớp với tiêu chí tìm kiếm hay không
 */
export function matchesCourseList(
  list: RawCourseRecord[],
  target: CourseMatchTarget,
  options?: { checkLop?: boolean; fallbackClassCode?: string | null },
): boolean {
  const { targetIdToHoc, targetMaMon, targetNhomTo, targetLop } = target;
  const checkLop = options?.checkLop ?? false;
  const fallbackClassCode = options?.fallbackClassCode;

  for (const item of list) {
    if (item.is_da_rut_mon_hoc === true) continue;
    const toHoc = item.to_hoc || item;
    const itemToHocId = String(toHoc.id_to_hoc || item.id_to_hoc || '').trim();
    const itemMaMon = String(toHoc.ma_mon || item.ma_mon || '').trim().toUpperCase();
    const itemNhomTo = String(toHoc.nhom_to || item.nhom_to || '').trim();

    let matches = false;

    // Khớp chính xác theo id_to_hoc (độ chính xác cao nhất)
    if (targetIdToHoc && itemToHocId && targetIdToHoc === itemToHocId) {
      matches = true;
    }
    // Khớp theo mã môn & nhóm tổ
    else if (targetMaMon && itemMaMon === targetMaMon) {
      if (targetNhomTo && itemNhomTo && targetNhomTo !== itemNhomTo) {
        // Khác nhóm tổ -> không match
        continue;
      }
      if (checkLop) {
        const itemLop = String(toHoc.lop || item.lop || fallbackClassCode || '').trim();
        if (targetLop && itemLop && !itemLop.includes(targetLop) && !fallbackClassCode?.includes(targetLop)) {
          // Khác lớp -> không match
          continue;
        }
      }
      matches = true;
    }

    if (matches) {
      return true;
    }
  }

  return false;
}
