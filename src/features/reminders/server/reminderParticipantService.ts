import { prisma } from '@/src/lib/prisma';
import { EnrolledCourseOption } from '../types/reminder.types';
import {
  collectCoursesFromList,
  parseCourseRegistrationList,
  parseTimetableList,
} from './reminder-participant-service/courseParsing';

export { findEnrolledStudentsForCourse } from './reminder-participant-service/enrolledStudentsLookup';

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
      const list = parseCourseRegistrationList(courseReg.data);
      collectCoursesFromList(list, courseMap, courseReg.classCode);
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
      const list = parseTimetableList(timetableRecord.rawData);
      collectCoursesFromList(list, courseMap);
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
