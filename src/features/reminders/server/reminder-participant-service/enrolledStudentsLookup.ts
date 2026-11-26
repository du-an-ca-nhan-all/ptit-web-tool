import { prisma } from '@/src/lib/prisma';
import {
  matchesCourseList,
  parseCourseRegistrationList,
  parseTimetableList,
} from './courseParsing';
import { CourseMatchTarget, FindEnrolledStudentsParams } from './types';

function addNormalizedUsername(targetSet: Set<string>, username?: string | null): void {
  if (username) targetSet.add(username.trim().toUpperCase());
}

function checkSingleCourseRegistration(params: {
  reg: { username: string | null; classCode: string | null; data: string | null };
  target: CourseMatchTarget;
  matchedUsernames: Set<string>;
}): void {
  const { reg, target, matchedUsernames } = params;
  if (!reg.data) return;
  try {
    const list = parseCourseRegistrationList(reg.data);
    const matches = matchesCourseList(list, target, { checkLop: true, fallbackClassCode: reg.classCode });
    if (matches) addNormalizedUsername(matchedUsernames, reg.username);
  } catch (caughtError) {
    console.warn(`[enrolledStudentsLookup] Non-fatal error:`, caughtError);
  }
}

function checkSingleTimetable(params: {
  tt: { username: string | null; rawData: string | null };
  target: CourseMatchTarget;
  matchedUsernames: Set<string>;
}): void {
  const { tt, target, matchedUsernames } = params;
  if (!tt.rawData) return;
  try {
    const list = parseTimetableList(tt.rawData);
    if (matchesCourseList(list, target)) addNormalizedUsername(matchedUsernames, tt.username);
  } catch (caughtError) {
    console.warn(`[enrolledStudentsLookup] Non-fatal error:`, caughtError);
  }
}

async function collectFromCourseRegistrations(target: CourseMatchTarget, matchedUsernames: Set<string>): Promise<void> {
  try {
    const allCourseRegs = await prisma.courseRegistration.findMany({
      select: { username: true, classCode: true, data: true },
    });
    for (const reg of allCourseRegs) {
      checkSingleCourseRegistration({ reg, target, matchedUsernames });
    }
  } catch (err) {
    console.error('[findEnrolledStudentsForCourse] Lỗi quét CourseRegistration:', err);
  }
}

async function collectFromTimetables(target: CourseMatchTarget, matchedUsernames: Set<string>): Promise<void> {
  try {
    const allTimetables = await prisma.studentTimetableRecord.findMany({
      select: { username: true, rawData: true },
    });
    for (const tt of allTimetables) {
      checkSingleTimetable({ tt, target, matchedUsernames });
    }
  } catch (err) {
    console.error('[findEnrolledStudentsForCourse] Lỗi quét StudentTimetableRecord:', err);
  }
}

async function collectFromExamRecords(target: CourseMatchTarget, matchedUsernames: Set<string>): Promise<void> {
  if (!target.targetMaMon) return;
  try {
    const exams = await prisma.examRecord.findMany({
      where: {
        maMH: target.targetMaMon,
        ...(target.targetNhomTo ? { nhomHoc: target.targetNhomTo } : {}),
      },
      select: { maSV: true },
    });
    for (const ex of exams) addNormalizedUsername(matchedUsernames, ex.maSV);
  } catch (err) {
    console.error('[findEnrolledStudentsForCourse] Lỗi quét ExamRecord:', err);
  }
}

async function collectFromClassStudents(target: CourseMatchTarget, matchedUsernames: Set<string>): Promise<void> {
  if (!target.targetLop) return;
  try {
    const classStudents = await prisma.student.findMany({
      where: { maLop: target.targetLop },
      select: { maSV: true },
    });
    for (const st of classStudents) addNormalizedUsername(matchedUsernames, st.maSV);
  } catch (err) {
    console.error('[findEnrolledStudentsForCourse] Lỗi quét Student maLop:', err);
  }
}

/**
 * Tìm tất cả sinh viên đang học cùng môn, lớp, tổ...etc...
 * Quét toàn bộ CSDL (CourseRegistration, StudentTimetableRecord, ExamRecord, Student)
 */
export async function findEnrolledStudentsForCourse(
  params: FindEnrolledStudentsParams,
): Promise<string[]> {
  const matchedUsernames = new Set<string>();
  matchedUsernames.add(params.creatorUsername.trim().toUpperCase());

  const target: CourseMatchTarget = {
    targetIdToHoc: params.idToHoc?.trim(),
    targetMaMon: params.maMon?.trim().toUpperCase(),
    targetNhomTo: params.nhomTo?.trim(),
    targetLop: params.lop?.trim(),
  };

  await collectFromCourseRegistrations(target, matchedUsernames);
  await collectFromTimetables(target, matchedUsernames);
  await collectFromExamRecords(target, matchedUsernames);
  await collectFromClassStudents(target, matchedUsernames);

  return Array.from(matchedUsernames);
}
