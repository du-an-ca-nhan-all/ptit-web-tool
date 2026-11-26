/**
 * Aggregator for fetching courses across all semesters + current registration.
 */

import { fetchSemesterCoursesFromQLDTTX, fetchStudentCoursesFromQLDTTX } from './courses';
import { fetchStudentSemestersFromQLDTTX } from './timetable';
import type { QldttxAccountInput } from './types';

/**
 * Lấy toàn bộ môn học của tất cả các học kỳ cũ + kỳ hiện tại từ cổng QLDTTX (/#/tkb-hocky & /#/home)
 */
export async function fetchAllSemestersCoursesFromQLDTTX(account: QldttxAccountInput): Promise<{
  currentRegistration: {
    data: any;
    totalCourses: number;
    totalCredits: number;
    tuitionFee: number;
    courses: any[];
  };
  semesters: Array<{
    hoc_ky: number;
    ten_hoc_ky: string;
    ngay_bat_dau_hk?: string;
    ngay_ket_thuc_hk?: string;
    totalCourses: number;
    totalCredits: number;
    courses: any[];
  }>;
  allCourses: any[];
  totalCourses: number;
  totalCredits: number;
  tuitionFee: number;
  newToken?: string;
}> {
  let validToken = account.token;
  let accumulatedToken: string | undefined;

  // 1. Get semesters list from QLDTTX
  const semesterData = await fetchStudentSemestersFromQLDTTX(account);
  if (semesterData.newToken) {
    validToken = semesterData.newToken;
    accumulatedToken = semesterData.newToken;
  }

  const semesterList = semesterData.semesters || [];

  // 2. Fetch current live course registration (ĐKMH)
  let currentRegResult: any = {
    data: null,
    totalCourses: 0,
    totalCredits: 0,
    tuitionFee: 0,
    courses: [],
  };

  try {
    const regRes = await fetchStudentCoursesFromQLDTTX({
      username: account.username,
      password: account.password,
      token: validToken,
    });
    currentRegResult = {
      data: regRes.data,
      totalCourses: regRes.totalCourses,
      totalCredits: regRes.totalCredits,
      tuitionFee: regRes.tuitionFee,
      courses: regRes.data?.data?.ds_kqdkmh || [],
    };
  } catch (e) {
    console.warn('[fetchAllSemestersCoursesFromQLDTTX] Fetch current registration warning:', e);
  }

  // 3. Fetch courses for each semester via /api/sch/w-locdstkbhockytheodoituong
  const semesters: Array<{
    hoc_ky: number;
    ten_hoc_ky: string;
    ngay_bat_dau_hk?: string;
    ngay_ket_thuc_hk?: string;
    totalCourses: number;
    totalCredits: number;
    courses: any[];
  }> = [];

  for (const s of semesterList) {
    try {
      const semCourses = await fetchSemesterCoursesFromQLDTTX(
        {
          username: account.username,
          password: account.password,
          token: validToken,
        },
        s.hoc_ky,
        s.ten_hoc_ky
      );

      if (semCourses.newToken) {
        validToken = semCourses.newToken;
        accumulatedToken = semCourses.newToken;
      }

      semesters.push({
        hoc_ky: s.hoc_ky,
        ten_hoc_ky: s.ten_hoc_ky,
        ngay_bat_dau_hk: s.ngay_bat_dau_hk,
        ngay_ket_thuc_hk: s.ngay_ket_thuc_hk,
        totalCourses: semCourses.totalCourses,
        totalCredits: semCourses.totalCredits,
        courses: semCourses.courses,
      });
    } catch (err) {
      console.warn(`[fetchAllSemestersCoursesFromQLDTTX] Error fetching semester ${s.hoc_ky}:`, err);
    }
  }

  // 4. Combine all courses
  const allCoursesMap = new Map<string, any>();
  semesters.forEach((sem) => {
    sem.courses.forEach((c) => {
      const key = `${sem.hoc_ky}_${c.ma_mon}_${c.nhom_to}`;
      if (!allCoursesMap.has(key)) {
        allCoursesMap.set(key, { ...c, semesterHocKy: sem.hoc_ky, semesterName: sem.ten_hoc_ky });
      }
    });
  });
  const allCourses = Array.from(allCoursesMap.values());

  // Use current registration metrics if available, otherwise latest semester metrics
  const latestSem = semesters[0];
  const finalTotalCourses =
    currentRegResult.totalCourses > 0 ? currentRegResult.totalCourses : latestSem?.totalCourses || 0;
  const finalTotalCredits =
    currentRegResult.totalCredits > 0 ? currentRegResult.totalCredits : latestSem?.totalCredits || 0;
  const finalTuitionFee = currentRegResult.tuitionFee || 0;

  return {
    currentRegistration: currentRegResult,
    semesters,
    allCourses,
    totalCourses: finalTotalCourses,
    totalCredits: finalTotalCredits,
    tuitionFee: finalTuitionFee,
    newToken: accumulatedToken,
  };
}
