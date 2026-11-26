import { NextRequest } from 'next/server';
import { AuthUser, getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  let authUser = await getCurrentUserFromCookie();
  if (!authUser) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      authUser = await verifyAuthToken(token);
    }
  }
  return authUser;
}

export interface ParsedRegistrationData {
  parsedData: any;
  currentCoursesList: any[];
  semestersList: any[];
  allCoursesList: any[];
}

export function parseRegistrationData(rawData?: string | null): ParsedRegistrationData {
  let parsedData: any = null;
  let currentCoursesList: any[] = [];
  let semestersList: any[] = [];
  let allCoursesList: any[] = [];

  if (rawData) {
    try {
      parsedData = JSON.parse(rawData);
      currentCoursesList = parsedData?.data?.ds_kqdkmh || parsedData?.ds_kqdkmh || [];
      semestersList = parsedData?.semesters || [];
      allCoursesList = parsedData?.allCourses || [];
    } catch (e) {
      console.error('Parse registration data error:', e);
    }
  }

  return { parsedData, currentCoursesList, semestersList, allCoursesList };
}

export function mapAvailableSemesters(semestersList: any[]) {
  return semestersList.map((s: any) => ({
    hoc_ky: s.hoc_ky,
    ten_hoc_ky: s.ten_hoc_ky,
    totalCourses: s.totalCourses || (s.courses || []).length,
    totalCredits: s.totalCredits || 0,
    ngay_bat_dau_hk: s.ngay_bat_dau_hk,
    ngay_ket_thuc_hk: s.ngay_ket_thuc_hk,
  }));
}

interface ResolveSemesterCoursesParams {
  requestedSemester: string;
  currentCoursesList: any[];
  semestersList: any[];
  allCoursesList: any[];
  registration: {
    totalCourses?: number | null;
    totalCredits?: number | null;
    tuitionFee?: number | null;
  } | null;
}

export function resolveSelectedSemesterCourses({
  requestedSemester,
  currentCoursesList,
  semestersList,
  allCoursesList,
  registration,
}: ResolveSemesterCoursesParams) {
  let coursesList: any[] = [];
  let totalCourses = registration?.totalCourses || 0;
  let totalCredits = registration?.totalCredits || 0;
  let tuitionFee = registration?.tuitionFee || 0;
  let selectedSemester: string | number = 'CURRENT';
  let selectedSemesterName = 'Đợt ĐKMH Hiện Tại';

  if (requestedSemester && requestedSemester !== 'CURRENT') {
    if (requestedSemester === 'ALL') {
      selectedSemester = 'ALL';
      selectedSemesterName = 'Tất Cả Các Học Kỳ';
      if (allCoursesList.length > 0) {
        coursesList = allCoursesList;
      } else {
        // Combine all courses from semesters
        const combined: any[] = [];
        semestersList.forEach((sem: any) => {
          (sem.courses || []).forEach((c: any) => {
            combined.push({
              ...c,
              semesterHocKy: sem.hoc_ky,
              semesterName: sem.ten_hoc_ky,
            });
          });
        });
        coursesList = combined.length > 0 ? combined : currentCoursesList;
      }
      totalCourses = coursesList.length;
      totalCredits = coursesList.reduce((acc, c) => acc + (c.so_tc || c.to_hoc?.so_tc || 0), 0);
    } else {
      // Specific semester requested by hoc_ky (e.g. 20261, 20252, 20251)
      const targetSem = semestersList.find((s: any) => String(s.hoc_ky) === String(requestedSemester));
      if (targetSem) {
        selectedSemester = targetSem.hoc_ky;
        selectedSemesterName = targetSem.ten_hoc_ky;
        coursesList = targetSem.courses || [];
        totalCourses = targetSem.totalCourses || coursesList.length;
        totalCredits =
          targetSem.totalCredits ||
          coursesList.reduce((acc, c) => acc + (c.so_tc || c.to_hoc?.so_tc || 0), 0);
      } else {
        coursesList = currentCoursesList;
      }
    }
  } else {
    // Default: Current registration courses, or latest semester courses if current registration is empty
    if (currentCoursesList.length > 0) {
      coursesList = currentCoursesList;
      totalCourses = registration?.totalCourses || currentCoursesList.length;
      totalCredits = registration?.totalCredits || 0;
      tuitionFee = registration?.tuitionFee || 0;
      selectedSemester = 'CURRENT';
      selectedSemesterName = 'Đợt ĐKMH Hiện Tại';
    } else if (semestersList.length > 0) {
      const latestSem = semestersList[0];
      coursesList = latestSem.courses || [];
      totalCourses = latestSem.totalCourses || coursesList.length;
      totalCredits = latestSem.totalCredits || 0;
      selectedSemester = latestSem.hoc_ky;
      selectedSemesterName = latestSem.ten_hoc_ky;
    }
  }

  return {
    coursesList,
    totalCourses,
    totalCredits,
    tuitionFee,
    selectedSemester,
    selectedSemesterName,
  };
}

export function buildRegistrationStoragePayload(fetched: {
  currentRegistration: { courses: any[] };
  semesters: any[];
  allCourses: any[];
}) {
  return {
    data: {
      ds_kqdkmh: fetched.currentRegistration.courses,
    },
    semesters: fetched.semesters,
    allCourses: fetched.allCourses,
    lastPulledAt: new Date(),
  };
}
