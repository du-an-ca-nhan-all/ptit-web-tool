import type {
  CourseComponentGrade,
  GradeCountsMap,
  SemesterGradeSummary,
  StudentCourseGrade,
} from './types';

export function parseScore(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  const num = parseFloat(String(val).replace(',', '.'));
  return isNaN(num) ? null : num;
}

export function createEmptyGradeCounts(): GradeCountsMap {
  return {
    'A+': { count: 0, credits: 0 },
    A: { count: 0, credits: 0 },
    'B+': { count: 0, credits: 0 },
    B: { count: 0, credits: 0 },
    'C+': { count: 0, credits: 0 },
    C: { count: 0, credits: 0 },
    'D+': { count: 0, credits: 0 },
    D: { count: 0, credits: 0 },
    F: { count: 0, credits: 0 },
    IN_PROGRESS: { count: 0, credits: 0 },
  };
}

function parseRawCourse(
  c: any,
  semesterId: string,
  semesterName: string
): StudentCourseGrade {
  const credits = parseFloat(c.so_tin_chi) || 0;
  const examScore = parseScore(c.diem_thi);
  const midtermScore = parseScore(c.diem_giua_ky);
  const finalScore10 = parseScore(c.diem_tk);
  const finalScore4 = parseScore(c.diem_tk_so);
  const letterGrade = (c.diem_tk_chu || '').trim().toUpperCase();

  // Components
  const components: CourseComponentGrade[] = [];
  if (Array.isArray(c.ds_diem_thanh_phan)) {
    for (const tp of c.ds_diem_thanh_phan) {
      components.push({
        code: tp.ky_hieu || '',
        name: tp.ten_thanh_phan || tp.ky_hieu || 'Thành phần',
        weight: parseFloat(tp.trong_so) || 0,
        score: parseScore(tp.diem_thanh_phan),
      });
    }
  }

  // Kiểm tra xem môn học đã có kết quả điểm tổng kết hay chưa
  const hasLetterGrade = letterGrade !== '' && letterGrade !== 'N/A' && letterGrade !== '-';
  const hasFinal10 = finalScore10 !== null;
  const hasFinal4 = finalScore4 !== null;
  const hasFinalScore = hasFinal10 || hasFinal4 || hasLetterGrade;

  // Xác định trạng thái Đạt (true) / Chưa đạt (false) / Đang học - Chưa nhập điểm (null)
  let isPassed: boolean | null = null;
  if (
    c.ket_qua === 1 ||
    c.ket_qua === '1' ||
    (hasFinal4 && finalScore4 >= 1.0) ||
    (hasFinal10 && finalScore10 >= 4.0) ||
    (hasLetterGrade && !['F', 'KĐ', 'KHONG DAT', 'KHÔNG ĐẠT'].includes(letterGrade))
  ) {
    isPassed = true;
  } else if (
    hasFinalScore &&
    (
      letterGrade === 'F' ||
      ['KĐ', 'KHONG DAT', 'KHÔNG ĐẠT'].includes(letterGrade) ||
      (hasFinal4 && finalScore4 < 1.0) ||
      (hasFinal10 && finalScore10 < 4.0)
    )
  ) {
    isPassed = false;
  } else {
    // Chưa có điểm tổng kết / chưa nhập điểm -> Đang học, KHÔNG tính là rớt/chưa đạt
    isPassed = null;
  }

  const isCalculatedInGpa = !(
    c.khong_tinh_diem_tbtl === 1 ||
    c.khong_tinh_diem_tbtl === '1' ||
    c.khong_tinh_diem_tbtl === true ||
    c.tich_luy === 0 ||
    c.tich_luy === '0' ||
    c.tich_luy === false
  );
  const reasonNotCalculated =
    c.ly_do_khong_tinh_diem_tbtl ||
    (!isCalculatedInGpa ? 'Học phần không tính vào GPA & tín chỉ tích lũy' : undefined);

  return {
    id: `${semesterId}_${c.ma_mon || Math.random().toString(36).slice(2, 7)}`,
    subjectCode: (c.ma_mon || '').toUpperCase(),
    subjectName: c.ten_mon || 'Môn học',
    group: c.nhom_to || '01',
    credits,
    examScore,
    midtermScore,
    finalScore10,
    finalScore4,
    letterGrade,
    isPassed,
    isCalculatedInGpa,
    reasonNotCalculated,
    components,
    semesterId,
    semesterName,
  };
}

function accumulateGradeCount(
  gradeCounts: GradeCountsMap,
  course: StudentCourseGrade
): void {
  const { isPassed, letterGrade, credits } = course;
  if (isPassed === null && !letterGrade) {
    gradeCounts.IN_PROGRESS.count++;
    gradeCounts.IN_PROGRESS.credits += credits;
  } else if (letterGrade && gradeCounts[letterGrade]) {
    gradeCounts[letterGrade].count++;
    gradeCounts[letterGrade].credits += credits;
  } else if (letterGrade) {
    if (gradeCounts[letterGrade.charAt(0)]) {
      gradeCounts[letterGrade.charAt(0)].count++;
      gradeCounts[letterGrade.charAt(0)].credits += credits;
    }
  }
}

export function parseRawSemester(
  sem: any,
  gradeCounts: GradeCountsMap,
  allCourses: StudentCourseGrade[]
): SemesterGradeSummary {
  const semesterId = String(sem.hoc_ky || '');
  const semesterName = sem.ten_hoc_ky || `Học kỳ ${semesterId}`;
  const rawCourses = Array.isArray(sem.ds_diem_mon_hoc) ? sem.ds_diem_mon_hoc : [];

  const semesterCourses: StudentCourseGrade[] = [];
  let semCreditsRegistered = 0;
  let semCreditsPassed = 0;

  for (const c of rawCourses) {
    const courseObj = parseRawCourse(c, semesterId, semesterName);
    semCreditsRegistered += courseObj.credits;
    if (courseObj.isPassed === true) {
      semCreditsPassed += courseObj.credits;
    }

    semesterCourses.push(courseObj);
    allCourses.push(courseObj);
    accumulateGradeCount(gradeCounts, courseObj);
  }

  // Tính GPA học kỳ từ các môn có isCalculatedInGpa
  const semGpaCourses = semesterCourses.filter(
    (c) => c.isCalculatedInGpa && c.finalScore4 !== null && c.credits > 0
  );
  const semGpaCredits = semGpaCourses.reduce((sum, c) => sum + c.credits, 0);
  const calcSemGpa4 = semGpaCredits > 0
    ? semGpaCourses.reduce((sum, c) => sum + (c.finalScore4 || 0) * c.credits, 0) / semGpaCredits
    : null;
  const calcSemGpa10 = semGpaCredits > 0
    ? semGpaCourses.reduce((sum, c) => sum + (c.finalScore10 || 0) * c.credits, 0) / semGpaCredits
    : null;

  const semOfficialAccCredits = semesterCourses
    .filter((c) => c.isPassed === true && c.isAccumulatedOfficial)
    .reduce((sum, c) => sum + c.credits, 0);
  const semExpectedAccCredits = semesterCourses
    .filter((c) => c.isPassed === true && c.isCalculatedInGpa)
    .reduce((sum, c) => sum + c.credits, 0);
  const semAccCredits = semOfficialAccCredits > 0 ? semOfficialAccCredits : semExpectedAccCredits;
  const semPendingCredits = Math.max(0, semExpectedAccCredits - semAccCredits);

  return {
    semesterId,
    semesterName,
    gpa10Semester: parseScore(sem.dtb_hk_he10) ?? (calcSemGpa10 !== null ? Math.round(calcSemGpa10 * 100) / 100 : null),
    gpa4Semester: parseScore(sem.dtb_hk_he4) ?? (calcSemGpa4 !== null ? Math.round(calcSemGpa4 * 100) / 100 : null),
    gpa10Cumulative: parseScore(sem.dtb_tich_luy_he_10),
    gpa4Cumulative: parseScore(sem.dtb_tich_luy_he_4),
    creditsPassedSemester: semCreditsPassed,
    creditsCumulative: parseScore(sem.so_tin_chi_dat_tich_luy) ?? 0,
    creditsAccumulatedSemester: semAccCredits,
    creditsAccumulatedExpectedSemester: semExpectedAccCredits,
    creditsPendingSemester: semPendingCredits,
    creditsRegisteredSemester: semCreditsRegistered,
    classificationSemester: sem.xep_loai_tkb_hk || 'Chưa xếp loại',
    courses: semesterCourses,
  };
}
