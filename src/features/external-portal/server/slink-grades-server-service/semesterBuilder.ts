import {
  StudentCourseGrade,
  SemesterGradeSummary,
  GpaTrendItem,
} from '../studentGradesServerService';
import { GradeCountMap } from './types';
import {
  createInitialGradeCounts,
  parseCourseGrade,
  parseScore,
} from './courseParser';

export function buildProcessedSemesters(
  rawSemesters: any[],
  rawCourses: any[]
): {
  processedSemesters: SemesterGradeSummary[];
  allCourses: StudentCourseGrade[];
  gradeCounts: GradeCountMap;
  gpaProgression: GpaTrendItem[];
} {
  const processedSemesters: SemesterGradeSummary[] = [];
  const allCourses: StudentCourseGrade[] = [];
  const gradeCounts = createInitialGradeCounts();

  // Gom các môn học theo mã học kỳ (maHocKy)
  const coursesBySemester: Record<string, any[]> = {};
  for (const c of rawCourses) {
    const hkKey = String(c.maHocKy || 'OTHER');
    if (!coursesBySemester[hkKey]) {
      coursesBySemester[hkKey] = [];
    }
    coursesBySemester[hkKey].push(c);
  }

  // Danh sách các học kỳ đã biết
  const semesterMap = new Map<string, any>();
  for (const s of rawSemesters) {
    const sKey = String(s.maHocKy || s.hocKy?.ma || '');
    if (sKey) {
      semesterMap.set(sKey, s);
    }
  }

  // Thêm cả các học kỳ có trong courses nhưng chưa có trong rawSemesters
  for (const hkKey of Object.keys(coursesBySemester)) {
    if (hkKey !== 'OTHER' && !semesterMap.has(hkKey)) {
      semesterMap.set(hkKey, { maHocKy: hkKey, hocKy: { ma: hkKey, ten: `Học kỳ ${hkKey}` } });
    }
  }

  // Sắp xếp các học kỳ theo thứ tự gần nhất đến cũ nhất (descending)
  const sortedSemesterKeys = Array.from(semesterMap.keys()).sort((a, b) => {
    if (a === 'OTHER') return 1;
    if (b === 'OTHER') return -1;
    return b.localeCompare(a, undefined, { numeric: true });
  });

  for (const semesterId of sortedSemesterKeys) {
    const semData = semesterMap.get(semesterId) || {};
    const semesterName =
      semData.hocKy?.ten ||
      semData.tenHocKy ||
      (semesterId ? `Học kỳ ${semesterId}` : 'Khác');

    const semCoursesRaw = coursesBySemester[semesterId] || [];
    const processedCourses: StudentCourseGrade[] = [];

    for (const c of semCoursesRaw) {
      const courseObj = parseCourseGrade(c, semesterId, semesterName, gradeCounts);
      processedCourses.push(courseObj);
      allCourses.push(courseObj);
    }

    // Tính GPA học kỳ từ các môn có isCalculatedInGpa
    const semGpaCourses = processedCourses.filter(
      (c) => c.isCalculatedInGpa && c.finalScore4 !== null && c.credits > 0
    );
    const semGpaCredits = semGpaCourses.reduce((sum, c) => sum + c.credits, 0);
    const calcSemGpa4 = semGpaCredits > 0
      ? semGpaCourses.reduce((sum, c) => sum + (c.finalScore4 || 0) * c.credits, 0) / semGpaCredits
      : null;
    const calcSemGpa10 = semGpaCredits > 0
      ? semGpaCourses.reduce((sum, c) => sum + (c.finalScore10 || 0) * c.credits, 0) / semGpaCredits
      : null;

    // TC Đạt trong kỳ: chỉ cần pass là được tính
    const semPassedCredits = processedCourses
      .filter((c) => c.isPassed === true)
      .reduce((sum, c) => sum + c.credits, 0);

    // TC Đã chốt chính thức trong kỳ (các môn có cờ tichLuy / isAccumulatedOfficial)
    const semOfficialAccCredits = processedCourses
      .filter((c) => c.isPassed === true && c.isAccumulatedOfficial)
      .reduce((sum, c) => sum + c.credits, 0);

    // TC Dự kiến đạt trong kỳ (toàn bộ môn Đạt VÀ tính vào GPA)
    const semExpectedAccCredits = processedCourses
      .filter((c) => c.isPassed === true && c.isCalculatedInGpa)
      .reduce((sum, c) => sum + c.credits, 0);

    const rawAccSem = Number(semData.tongSoTinChiTichLuyHocKy || 0);
    const creditsAccSem = semOfficialAccCredits > 0 ? semOfficialAccCredits : (rawAccSem > 0 ? rawAccSem : semExpectedAccCredits);
    const creditsPendingSem = Math.max(0, semExpectedAccCredits - creditsAccSem);

    const gpa10Sem = parseScore(semData.trungBinhHocKy) ?? (calcSemGpa10 !== null ? Math.round(calcSemGpa10 * 100) / 100 : null);
    const gpa4Sem = parseScore(semData.trungBinhHocKyThang4) ?? (calcSemGpa4 !== null ? Math.round(calcSemGpa4 * 100) / 100 : null);
    const gpa10Cum = parseScore(semData.trungBinhTichLuyToanKhoa);
    const gpa4Cum = parseScore(semData.trungBinhTichLuyToanKhoaThang4);

    const creditsPassedSem = semPassedCredits;
    const creditsCumOfficial = Number(semData.tongSoTinChiTichLuyToanKhoa || 0);
    const creditsRegSem = Number(semData.tongSoTinChiDangKyHocKy || semData.tongSoTinChiHocKy || 0);
    const creditsDebtSem = Number(semData.tongSoTinChiNoHocKy || 0);
    const classSem = String(semData.hocLucHocKy || semData.hocLuc || 'N/A');

    processedSemesters.push({
      semesterId,
      semesterName,
      gpa10Semester: gpa10Sem,
      gpa4Semester: gpa4Sem,
      gpa10Cumulative: gpa10Cum,
      gpa4Cumulative: gpa4Cum,
      creditsPassedSemester: creditsPassedSem,
      creditsCumulative: creditsCumOfficial,
      creditsAccumulatedSemester: creditsAccSem,
      creditsAccumulatedExpectedSemester: semExpectedAccCredits,
      creditsPendingSemester: creditsPendingSem,
      creditsAccumulatedCumulativeOfficial: creditsCumOfficial,
      creditsAccumulatedCumulativeExpected: 0, // Điền ở vòng lặp sau
      creditsRegisteredSemester: creditsRegSem,
      creditsDebtSemester: creditsDebtSem,
      classificationSemester: classSem,
      courses: processedCourses,
    });
  }

  const gpaProgression = applyCumulativeProgression(processedSemesters);

  return {
    processedSemesters,
    allCourses,
    gradeCounts,
    gpaProgression,
  };
}

function applyCumulativeProgression(
  processedSemesters: SemesterGradeSummary[]
): GpaTrendItem[] {
  // Phân tích tiến độ GPA qua từng học kỳ (sắp xếp theo thứ tự thời gian tăng dần từ cũ đến mới cho biểu đồ timeline)
  const progressionSemesters = [...processedSemesters].sort((a, b) =>
    a.semesterId.localeCompare(b.semesterId, undefined, { numeric: true })
  );

  // Tín chỉ và GPA tích lũy dự kiến lũy kế qua từng kỳ (tính tất cả các môn Đạt & isCalculatedInGpa)
  let runningCumulativeExpectedCredits = 0;
  const runningPassedCourses: StudentCourseGrade[] = [];

  for (const s of progressionSemesters) {
    const semAccExpectedCredits = s.courses
      .filter((c) => c.isPassed === true && c.isCalculatedInGpa)
      .reduce((sum, c) => sum + c.credits, 0);
    runningCumulativeExpectedCredits += semAccExpectedCredits;
    s.creditsAccumulatedCumulativeExpected = runningCumulativeExpectedCredits;

    // Nếu chưa có creditsCumulative chính thức, lấy theo runningCumulative
    if (!s.creditsCumulative || s.creditsCumulative === 0) {
      s.creditsCumulative = s.creditsAccumulatedCumulativeOfficial || runningCumulativeExpectedCredits;
    }

    const semPassed = s.courses.filter(
      (c) => c.isPassed === true && c.isCalculatedInGpa && c.credits > 0 && c.finalScore4 !== null
    );
    runningPassedCourses.push(...semPassed);

    const totalRunCreds = runningPassedCourses.reduce((sum, c) => sum + c.credits, 0);
    const runGpa4 = totalRunCreds > 0
      ? Math.round((runningPassedCourses.reduce((sum, c) => sum + (c.finalScore4 || 0) * c.credits, 0) / totalRunCreds) * 100) / 100
      : null;
    const runGpa10 = totalRunCreds > 0
      ? Math.round((runningPassedCourses.reduce((sum, c) => sum + (c.finalScore10 || 0) * c.credits, 0) / totalRunCreds) * 100) / 100
      : null;

    s.gpa4CumulativeExpected = runGpa4;
    s.gpa10CumulativeExpected = runGpa10;
  }

  return progressionSemesters.map((s) => ({
    semesterId: s.semesterId,
    semesterName: s.semesterName,
    gpa10: s.gpa10Semester,
    gpa4: s.gpa4Semester,
    gpaCumulative10: s.gpa10Cumulative,
    gpaCumulative4: s.gpa4Cumulative,
    gpaCumulativeExpected10: s.gpa10CumulativeExpected ?? s.gpa10Cumulative,
    gpaCumulativeExpected4: s.gpa4CumulativeExpected ?? s.gpa4Cumulative,
    creditsSemester: s.creditsPassedSemester,
    creditsAccumulatedSemester: s.creditsAccumulatedSemester,
    creditsPendingSemester: s.creditsPendingSemester,
    creditsCumulative: s.creditsAccumulatedCumulativeOfficial || s.creditsCumulative,
    creditsCumulativeExpected: s.creditsAccumulatedCumulativeExpected,
  }));
}
