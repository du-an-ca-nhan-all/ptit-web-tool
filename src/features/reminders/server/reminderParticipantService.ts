import { prisma } from '@/src/lib/prisma';
import { EnrolledCourseOption } from '../types/reminder.types';

/**
 * Trích xuất tên giảng viên từ chuỗi TKB (ví dụ: "Thứ 3,tiết 13->15,Ph lopmonhoc27,GV Nguyễn Quang Huy,18/08/26 đến 25/08/26")
 */
function extractLecturerFromTkb(tkb?: string): string | undefined {
  if (!tkb) return undefined;
  const match = tkb.match(/GV\s+([^,<\n]+)/i);
  return match ? match[1].trim() : undefined;
}

/**
 * Lấy danh sách các môn học hiện tại sinh viên đang học từ CSDL
 * (kết hợp dữ liệu từ CourseRegistration và StudentTimetableRecord)
 */
export async function getStudentCurrentCourses(username: string): Promise<EnrolledCourseOption[]> {
  const cleanUsername = username.trim().toUpperCase();
  const courseMap = new Map<string, EnrolledCourseOption>();

  // 1. Quét từ bảng CourseRegistration (Dữ liệu ĐKMH chính thức có to_hoc đầy đủ)
  try {
    const courseReg = await prisma.courseRegistration.findFirst({
      where: { username: cleanUsername },
    });

    if (courseReg && courseReg.data) {
      const parsed = JSON.parse(courseReg.data);
      const list =
        parsed?.ds_kqdkmh ||
        parsed?.data?.ds_kqdkmh ||
        parsed?.data?.ds_thoi_khoa_bieu ||
        (Array.isArray(parsed) ? parsed : []);

      if (Array.isArray(list)) {
        for (const item of list) {
          if (item.is_da_rut_mon_hoc === true) continue;
          const toHoc = item.to_hoc || item;
          const idToHoc = String(toHoc.id_to_hoc || item.id_to_hoc || '').trim();
          const maMon = String(toHoc.ma_mon || item.ma_mon || '').trim();
          const tenMon = String(toHoc.ten_mon || item.ten_mon || '').trim();
          const nhomTo = String(toHoc.nhom_to || item.nhom_to || '01').trim();
          const lop = String(toHoc.lop || item.lop || courseReg.classCode || '').trim();
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
    }
  } catch (err) {
    console.error(`[getStudentCurrentCourses] Lỗi đọc CourseRegistration cho ${cleanUsername}:`, err);
  }

  // 2. Bổ sung từ bảng StudentTimetableRecord
  try {
    const timetableRecord = await prisma.studentTimetableRecord.findUnique({
      where: { username: cleanUsername },
    });

    if (timetableRecord && timetableRecord.rawData) {
      const parsed = JSON.parse(timetableRecord.rawData);
      const list =
        parsed?.rawList ||
        parsed?.data?.ds_thoi_khoa_bieu ||
        parsed?.data?.ds_tkb_tuan ||
        parsed?.data?.ds_kqdkmh ||
        (Array.isArray(parsed) ? parsed : []);

      if (Array.isArray(list)) {
        for (const item of list) {
          if (item.is_da_rut_mon_hoc === true) continue;
          const toHoc = item.to_hoc || item;
          const idToHoc = String(toHoc.id_to_hoc || item.id_to_hoc || '').trim();
          const maMon = String(toHoc.ma_mon || item.ma_mon || '').trim();
          const tenMon = String(toHoc.ten_mon || item.ten_mon || '').trim();
          const nhomTo = String(toHoc.nhom_to || item.nhom_to || '01').trim();
          const lop = String(toHoc.lop || item.lop || '').trim();
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
    }
  } catch (err) {
    console.error(`[getStudentCurrentCourses] Lỗi đọc StudentTimetableRecord cho ${cleanUsername}:`, err);
  }

  // 3. Fallback từ bảng ExamRecord nếu chưa có
  if (courseMap.size === 0) {
    try {
      const exams = await prisma.examRecord.findMany({
        where: { maSV: cleanUsername },
        distinct: ['maMH'],
      });

      for (const ex of exams) {
        if (ex.maMH && ex.tenMH) {
          const key = `${ex.maMH}_${ex.nhomHoc || '01'}`;
          courseMap.set(key, {
            idToHoc: `${ex.maMH}-${ex.nhomHoc || '01'}`,
            maMon: ex.maMH,
            tenMon: ex.tenMH,
            nhomTo: ex.nhomHoc || '01',
            lop: ex.maLopMH || '',
          });
        }
      }
    } catch (err) {
      console.error(`[getStudentCurrentCourses] Lỗi đọc ExamRecord cho ${cleanUsername}:`, err);
    }
  }

  return Array.from(courseMap.values()).sort((a, b) => a.tenMon.localeCompare(b.tenMon, 'vi'));
}

/**
 * Tìm tất cả sinh viên đang học cùng môn, lớp, tổ...etc...
 * Quét toàn bộ CSDL (CourseRegistration, StudentTimetableRecord, ExamRecord, Student)
 */
export async function findEnrolledStudentsForCourse(params: {
  idToHoc?: string | null;
  idMon?: string | null;
  maMon?: string | null;
  nhomTo?: string | null;
  lop?: string | null;
  creatorUsername: string;
}): Promise<string[]> {
  const matchedUsernames = new Set<string>();
  const cleanCreator = params.creatorUsername.trim().toUpperCase();
  matchedUsernames.add(cleanCreator);

  const targetIdToHoc = params.idToHoc?.trim();
  const targetMaMon = params.maMon?.trim().toUpperCase();
  const targetNhomTo = params.nhomTo?.trim();
  const targetLop = params.lop?.trim();

  // 1. Quét trong bảng CourseRegistration
  try {
    const allCourseRegs = await prisma.courseRegistration.findMany({
      select: {
        username: true,
        classCode: true,
        data: true,
      },
    });

    for (const reg of allCourseRegs) {
      if (!reg.data) continue;
      try {
        const parsed = JSON.parse(reg.data);
        const list =
          parsed?.ds_kqdkmh ||
          parsed?.data?.ds_kqdkmh ||
          parsed?.data?.ds_thoi_khoa_bieu ||
          (Array.isArray(parsed) ? parsed : []);

        if (Array.isArray(list)) {
          for (const item of list) {
            if (item.is_da_rut_mon_hoc === true) continue;
            const toHoc = item.to_hoc || item;
            const itemToHocId = String(toHoc.id_to_hoc || item.id_to_hoc || '').trim();
            const itemMaMon = String(toHoc.ma_mon || item.ma_mon || '').trim().toUpperCase();
            const itemNhomTo = String(toHoc.nhom_to || item.nhom_to || '').trim();
            const itemLop = String(toHoc.lop || item.lop || reg.classCode || '').trim();

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
              if (targetLop && itemLop && !itemLop.includes(targetLop) && !reg.classCode?.includes(targetLop)) {
                // Khác lớp -> không match
                continue;
              }
              matches = true;
            }

            if (matches && reg.username) {
              matchedUsernames.add(reg.username.trim().toUpperCase());
              break;
            }
          }
        }
      } catch {}
    }
  } catch (err) {
    console.error('[findEnrolledStudentsForCourse] Lỗi quét CourseRegistration:', err);
  }

  // 2. Quét trong bảng StudentTimetableRecord
  try {
    const allTimetables = await prisma.studentTimetableRecord.findMany({
      select: {
        username: true,
        rawData: true,
      },
    });

    for (const tt of allTimetables) {
      if (!tt.rawData) continue;
      try {
        const parsed = JSON.parse(tt.rawData);
        const list =
          parsed?.rawList ||
          parsed?.data?.ds_thoi_khoa_bieu ||
          parsed?.data?.ds_tkb_tuan ||
          parsed?.data?.ds_kqdkmh ||
          (Array.isArray(parsed) ? parsed : []);

        if (Array.isArray(list)) {
          for (const item of list) {
            if (item.is_da_rut_mon_hoc === true) continue;
            const toHoc = item.to_hoc || item;
            const itemToHocId = String(toHoc.id_to_hoc || item.id_to_hoc || '').trim();
            const itemMaMon = String(toHoc.ma_mon || item.ma_mon || '').trim().toUpperCase();
            const itemNhomTo = String(toHoc.nhom_to || item.nhom_to || '').trim();

            let matches = false;
            if (targetIdToHoc && itemToHocId && targetIdToHoc === itemToHocId) {
              matches = true;
            } else if (targetMaMon && itemMaMon === targetMaMon) {
              if (targetNhomTo && itemNhomTo && targetNhomTo !== itemNhomTo) {
                continue;
              }
              matches = true;
            }

            if (matches && tt.username) {
              matchedUsernames.add(tt.username.trim().toUpperCase());
              break;
            }
          }
        }
      } catch {}
    }
  } catch (err) {
    console.error('[findEnrolledStudentsForCourse] Lỗi quét StudentTimetableRecord:', err);
  }

  // 3. Bổ sung từ bảng ExamRecord
  if (targetMaMon) {
    try {
      const exams = await prisma.examRecord.findMany({
        where: {
          maMH: targetMaMon,
          ...(targetNhomTo ? { nhomHoc: targetNhomTo } : {}),
        },
        select: { maSV: true },
      });

      for (const ex of exams) {
        if (ex.maSV) {
          matchedUsernames.add(ex.maSV.trim().toUpperCase());
        }
      }
    } catch (err) {
      console.error('[findEnrolledStudentsForCourse] Lỗi quét ExamRecord:', err);
    }
  }

  // 4. Nếu có lớp cụ thể (lop), bổ sung sinh viên trong lớp đó từ bảng Student
  if (targetLop) {
    try {
      const classStudents = await prisma.student.findMany({
        where: { maLop: targetLop },
        select: { maSV: true },
      });

      for (const st of classStudents) {
        if (st.maSV) {
          matchedUsernames.add(st.maSV.trim().toUpperCase());
        }
      }
    } catch (err) {
      console.error('[findEnrolledStudentsForCourse] Lỗi quét Student maLop:', err);
    }
  }

  return Array.from(matchedUsernames);
}
