import { prisma } from '@/src/lib/prisma';
import {
  matchesCourseList,
  parseCourseRegistrationList,
  parseTimetableList,
} from './courseParsing';
import { CourseMatchTarget, FindEnrolledStudentsParams } from './types';

/**
 * Tìm tất cả sinh viên đang học cùng môn, lớp, tổ...etc...
 * Quét toàn bộ CSDL (CourseRegistration, StudentTimetableRecord, ExamRecord, Student)
 */
export async function findEnrolledStudentsForCourse(
  params: FindEnrolledStudentsParams,
): Promise<string[]> {
  const matchedUsernames = new Set<string>();
  const cleanCreator = params.creatorUsername.trim().toUpperCase();
  matchedUsernames.add(cleanCreator);

  const target: CourseMatchTarget = {
    targetIdToHoc: params.idToHoc?.trim(),
    targetMaMon: params.maMon?.trim().toUpperCase(),
    targetNhomTo: params.nhomTo?.trim(),
    targetLop: params.lop?.trim(),
  };

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
        const list = parseCourseRegistrationList(reg.data);
        const matches = matchesCourseList(list, target, {
          checkLop: true,
          fallbackClassCode: reg.classCode,
        });
        if (matches && reg.username) {
          matchedUsernames.add(reg.username.trim().toUpperCase());
        }
      } catch (caughtError) {
        console.warn(`[enrolledStudentsLookup] Non-fatal error:`, caughtError);
      }
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
        const list = parseTimetableList(tt.rawData);
        const matches = matchesCourseList(list, target);
        if (matches && tt.username) {
          matchedUsernames.add(tt.username.trim().toUpperCase());
        }
      } catch (caughtError) {
        console.warn(`[enrolledStudentsLookup] Non-fatal error:`, caughtError);
      }
    }
  } catch (err) {
    console.error('[findEnrolledStudentsForCourse] Lỗi quét StudentTimetableRecord:', err);
  }

  // 3. Bổ sung từ bảng ExamRecord
  if (target.targetMaMon) {
    try {
      const exams = await prisma.examRecord.findMany({
        where: {
          maMH: target.targetMaMon,
          ...(target.targetNhomTo ? { nhomHoc: target.targetNhomTo } : {}),
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
  if (target.targetLop) {
    try {
      const classStudents = await prisma.student.findMany({
        where: { maLop: target.targetLop },
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
