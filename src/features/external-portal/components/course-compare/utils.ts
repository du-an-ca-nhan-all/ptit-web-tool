import {
  CourseCompareData,
  CourseComparisonResult,
  PopupStats,
  SelectedCourseInfo,
  SemesterInfo,
} from './types';

// Helper safely extracting courses from any nesting structure based on selectedSemester
export const extractCoursesFromAccount = (acc: any, selectedSemester?: string): any[] => {
  if (!acc) return [];
  const rawData = acc.data?.data || acc.data || acc;
  const semesters: SemesterInfo[] = acc.semesters || rawData.semesters || [];

  if (selectedSemester && selectedSemester !== 'CURRENT') {
    if (selectedSemester === 'ALL') {
      if (acc.allCourses && acc.allCourses.length > 0) {
        return acc.allCourses.map((c: any) => c.to_hoc || c);
      }
      const allCombined: any[] = [];
      semesters.forEach((s: any) => {
        (s.courses || []).forEach((c: any) => {
          allCombined.push({
            ...(c.to_hoc || c),
            semesterHocKy: s.hoc_ky,
            semesterName: s.ten_hoc_ky,
          });
        });
      });
      if (allCombined.length > 0) return allCombined;
    } else {
      const foundSem = semesters.find((s: any) => String(s.hoc_ky) === String(selectedSemester));
      if (foundSem && Array.isArray((foundSem as any).courses)) {
        return (foundSem as any).courses.map((c: any) => c.to_hoc || c);
      }
    }
  }

  // Default: current registration courses
  const rawList =
    rawData.ds_kqdkmh ||
    acc.data?.ds_kqdkmh ||
    acc.ds_kqdkmh ||
    (Array.isArray(rawData) ? rawData : []) ||
    [];

  if (rawList.length > 0) {
    return rawList
      .map((item: any) => item.to_hoc || item)
      .filter((c: any) => c && (c.ma_mon || c.MaMH));
  }

  // Fallback to first available semester if ds_kqdkmh is empty
  if (semesters.length > 0 && (semesters[0] as any)?.courses?.length > 0) {
    return ((semesters[0] as any).courses || []).map((item: any) => item.to_hoc || item);
  }

  return [];
};

export const extractAvailableSemesters = (
  data: CourseCompareData | null,
  activeSubAccount: any
): SemesterInfo[] => {
  if (Array.isArray(data?.semesters) && data.semesters.length > 0) {
    return data.semesters;
  }
  const map = new Map<string, SemesterInfo>();
  const scanSemesters = (acc: any) => {
    const sems = acc?.semesters || acc?.data?.semesters || [];
    if (Array.isArray(sems)) {
      sems.forEach((s: any) => {
        if (!map.has(String(s.hoc_ky))) {
          map.set(String(s.hoc_ky), {
            hoc_ky: s.hoc_ky,
            ten_hoc_ky: s.ten_hoc_ky,
            totalCourses: s.totalCourses || (s.courses || []).length,
            totalCredits: s.totalCredits || 0,
          });
        }
      });
    }
  };
  scanSemesters(data?.main);
  scanSemesters(activeSubAccount);
  (data?.allSubAccounts || []).forEach(scanSemesters);
  return Array.from(map.values());
};

export const computePopupStats = (
  selectedCourse: SelectedCourseInfo | null,
  data: CourseCompareData | null,
  selectedSemester: string
): PopupStats | null => {
  if (!selectedCourse || !data?.allSubAccounts) return null;
  const { courseCode } = selectedCourse;

  let totalAnalyzed = 0;
  const missingUsers: any[] = [];
  const groupMap = new Map<string, any[]>();

  data.allSubAccounts.forEach((acc) => {
    // Bỏ qua lớp trưởng
    if (data.main && acc.username?.toLowerCase() === data.main.username?.toLowerCase()) return;

    const courses = extractCoursesFromAccount(acc, selectedSemester);
    const course = courses.find((c: any) => (c.ma_mon || c.MaMH) === courseCode);

    totalAnalyzed++;
    if (!course) {
      missingUsers.push(acc.username);
    } else {
      const grp = course.nhom_to || course.NhomTo || '01';
      if (!groupMap.has(grp)) groupMap.set(grp, []);
      groupMap.get(grp)!.push(acc.username);
    }
  });

  return {
    totalAnalyzed,
    missingUsers,
    groupMap,
  };
};

export const computeCourseComparison = (
  monitorCourses: any[],
  myCourses: any[]
): CourseComparisonResult => {
  const monitorMap = new Map<string, any>(
    monitorCourses.map((c: any) => [c.ma_mon || c.MaMH, c])
  );
  const myMap = new Map<string, any>(
    myCourses.map((c: any) => [c.ma_mon || c.MaMH, c])
  );

  const exactMatch: any[] = [];
  const diffGroup: { monitor: any; mine: any }[] = [];
  const missing: any[] = [];
  const extra: any[] = [];

  monitorCourses.forEach((mc: any) => {
    const code = mc.ma_mon || mc.MaMH;
    const myC = myMap.get(code);
    if (!myC) {
      missing.push(mc);
    } else if ((myC.nhom_to || myC.NhomTo) !== (mc.nhom_to || mc.NhomTo)) {
      diffGroup.push({ monitor: mc, mine: myC });
    } else {
      exactMatch.push(mc);
    }
  });

  myCourses.forEach((myC: any) => {
    const code = myC.ma_mon || myC.MaMH;
    if (!monitorMap.has(code)) {
      extra.push(myC);
    }
  });

  return { exactMatch, diffGroup, missing, extra };
};
