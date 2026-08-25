import { prisma } from '@/src/lib/prisma';
import { fetchStudentGradesFromQLDTTX } from './qldttxServerService';

export interface CourseComponentGrade {
  code: string; // e.g. "T1", "K1", "B1", "K2", "K3"
  name: string; // e.g. "Điểm thi", "Trung bình kiểm tra", "Bài tập lớn", "Chuyên cần"
  weight: number; // e.g. 70, 30, 10 (%)
  score: number | null; // e.g. 8.5
}

export interface StudentCourseGrade {
  id: string;
  subjectCode: string;
  subjectName: string;
  group: string;
  credits: number;
  examScore: number | null; // Điểm thi (T1)
  midtermScore: number | null; // Điểm giữa kỳ (K1)
  finalScore10: number | null; // Điểm tổng kết hệ 10
  finalScore4: number | null; // Điểm tổng kết hệ 4
  letterGrade: string; // A+, A, B+, B, C+, C, D+, D, F
  isPassed: boolean | null; // true: Đạt (ket_qua = 1), false: Rớt (ket_qua = 0), null: Chưa có điểm (-1)
  isCalculatedInGpa: boolean; // false nếu là môn điều kiện, môn cải thiện hoặc chưa nhập điểm
  reasonNotCalculated?: string;
  components: CourseComponentGrade[];
  semesterId: string;
  semesterName: string;
}

export interface SemesterGradeSummary {
  semesterId: string;
  semesterName: string;
  gpa10Semester: number | null;
  gpa4Semester: number | null;
  gpa10Cumulative: number | null;
  gpa4Cumulative: number | null;
  creditsPassedSemester: number;
  creditsCumulative: number;
  creditsRegisteredSemester: number;
  classificationSemester: string;
  courses: StudentCourseGrade[];
}

export interface GpaTrendItem {
  semesterId: string;
  semesterName: string;
  gpa10: number | null;
  gpa4: number | null;
  gpaCumulative10: number | null;
  gpaCumulative4: number | null;
  creditsSemester: number;
  creditsCumulative: number;
}

export interface GradeDistributionBucket {
  grade: string;
  count: number;
  credits: number;
  percentage: number;
  description: string;
  colorClass: string;
}

export interface AcademicTargetGoal {
  label: string; // "Bằng Khá", "Bằng Giỏi", "Bằng Xuất sắc"
  targetGpa4: number; // 2.5, 3.2, 3.6
  isAchievable: boolean;
  requiredGpaOnRemaining: number | null;
  status: 'ACHIEVED' | 'POSSIBLE' | 'CHALLENGING' | 'UNACHIEVABLE';
  note: string;
}

export interface StudentGradesResult {
  success: boolean;
  username: string;
  isConfigured: boolean;
  hasLinkedAccount: boolean;
  isLiveSync: boolean;
  isCachedDb?: boolean;
  lastSyncAt: string | null;
  summary: {
    gpa10: number | null;
    gpa4: number | null;
    totalCreditsAccumulated: number;
    totalPassedCredits: number;
    totalCreditsRegistered: number;
    totalInProgressCredits: number;
    classification: string;
    totalPassedSubjects: number;
    totalFailedSubjects: number;
    totalInProgressSubjects: number;
    totalSubjects: number;
    passRate: number; // 0..100
    curriculumTargetCredits: number; // default ~130
    graduationProgressRate: number; // 0..100
  };
  gradeDistribution: {
    buckets: GradeDistributionBucket[];
    highestGradeCount: number;
    averageLetter: string;
  };
  gpaProgression: GpaTrendItem[];
  semesters: SemesterGradeSummary[];
  topCourses: StudentCourseGrade[];
  improvementCourses: StudentCourseGrade[];
  inProgressCourses: StudentCourseGrade[];
  targetGoals: AcademicTargetGoal[];
  errorType?: 'NOT_CONFIGURED' | 'INVALID_CREDENTIALS' | 'SERVER_ERROR';
  error?: string;
}

function parseScore(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  const num = parseFloat(String(val).replace(',', '.'));
  return isNaN(num) ? null : num;
}

/**
 * Xây dựng đối tượng kết quả phân tích học tập từ cấu trúc JSON của QLDTTX
 */
export function buildGradeResultFromRawData(
  cleanUsername: string,
  fetchedResult: any,
  options: {
    isConfigured: boolean;
    isLiveSync: boolean;
    isCachedDb: boolean;
    lastSyncAt: string | null;
  }
): StudentGradesResult {
  const rawSemesters: any[] = fetchedResult?.semesters || fetchedResult?.data?.ds_diem_hocky || [];
  const processedSemesters: SemesterGradeSummary[] = [];
  const allCourses: StudentCourseGrade[] = [];

  const gradeCounts: Record<string, { count: number; credits: number }> = {
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

  for (const sem of rawSemesters) {
    const semesterId = String(sem.hoc_ky || '');
    const semesterName = sem.ten_hoc_ky || `Học kỳ ${semesterId}`;
    const rawCourses = Array.isArray(sem.ds_diem_mon_hoc) ? sem.ds_diem_mon_hoc : [];

    const semesterCourses: StudentCourseGrade[] = [];
    let semCreditsRegistered = 0;
    let semCreditsPassed = 0;

    for (const c of rawCourses) {
      const credits = parseFloat(c.so_tin_chi) || 0;
      semCreditsRegistered += credits;

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

      if (isPassed === true) {
        semCreditsPassed += credits;
      }

      const courseObj: StudentCourseGrade = {
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

      semesterCourses.push(courseObj);
      allCourses.push(courseObj);

      // Aggregate grade distribution
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

    processedSemesters.push({
      semesterId,
      semesterName,
      gpa10Semester: parseScore(sem.dtb_hk_he10) ?? (calcSemGpa10 !== null ? Math.round(calcSemGpa10 * 100) / 100 : null),
      gpa4Semester: parseScore(sem.dtb_hk_he4) ?? (calcSemGpa4 !== null ? Math.round(calcSemGpa4 * 100) / 100 : null),
      gpa10Cumulative: parseScore(sem.dtb_tich_luy_he_10),
      gpa4Cumulative: parseScore(sem.dtb_tich_luy_he_4),
      creditsPassedSemester: semCreditsPassed,
      creditsCumulative: parseScore(sem.so_tin_chi_dat_tich_luy) ?? 0,
      creditsRegisteredSemester: semCreditsRegistered,
      classificationSemester: sem.xep_loai_tkb_hk || 'Chưa xếp loại',
      courses: semesterCourses,
    });
  }

  // Sắp xếp các học kỳ theo thứ tự gần nhất đến cũ nhất (descending) để đồng nhất với UI
  processedSemesters.sort((a, b) => b.semesterId.localeCompare(a.semesterId, undefined, { numeric: true }));

  // Sắp xếp GPA Progression theo thứ tự học kỳ tăng dần (cho biểu đồ timeline)
  const progressionSemesters = [...processedSemesters].sort((a, b) =>
    a.semesterId.localeCompare(b.semesterId, undefined, { numeric: true })
  );

  // Tín chỉ tích lũy qua từng kỳ: chỉ tính môn Đạt và isCalculatedInGpa
  let runningCumulativeCredits = 0;
  for (const s of progressionSemesters) {
    const semAccCredits = s.courses
      .filter((c) => c.isPassed === true && c.isCalculatedInGpa)
      .reduce((sum, c) => sum + c.credits, 0);
    runningCumulativeCredits += semAccCredits;
    s.creditsCumulative = runningCumulativeCredits;
  }

  const gpaProgression: GpaTrendItem[] = progressionSemesters.map((s) => ({
    semesterId: s.semesterId,
    semesterName: s.semesterName,
    gpa10: s.gpa10Semester,
    gpa4: s.gpa4Semester,
    gpaCumulative10: s.gpa10Cumulative,
    gpaCumulative4: s.gpa4Cumulative,
    creditsSemester: s.creditsPassedSemester,
    creditsCumulative: s.creditsCumulative,
  }));

  // Xây dựng Phân bố Điểm chữ
  const totalGradedCourses = allCourses.filter((c) => c.isPassed !== null || c.letterGrade).length;
  const gradeBuckets: GradeDistributionBucket[] = [
    { grade: 'A+', count: gradeCounts['A+'].count, credits: gradeCounts['A+'].credits, percentage: totalGradedCourses > 0 ? (gradeCounts['A+'].count / totalGradedCourses) * 100 : 0, description: 'Xuất sắc (9.0 - 10.0)', colorClass: 'bg-emerald-500 text-white' },
    { grade: 'A', count: gradeCounts['A'].count, credits: gradeCounts['A'].credits, percentage: totalGradedCourses > 0 ? (gradeCounts['A'].count / totalGradedCourses) * 100 : 0, description: 'Giỏi (8.5 - 8.9)', colorClass: 'bg-teal-500 text-white' },
    { grade: 'B+', count: gradeCounts['B+'].count, credits: gradeCounts['B+'].credits, percentage: totalGradedCourses > 0 ? (gradeCounts['B+'].count / totalGradedCourses) * 100 : 0, description: 'Khá giỏi (8.0 - 8.4)', colorClass: 'bg-blue-500 text-white' },
    { grade: 'B', count: gradeCounts['B'].count, credits: gradeCounts['B'].credits, percentage: totalGradedCourses > 0 ? (gradeCounts['B'].count / totalGradedCourses) * 100 : 0, description: 'Khá (7.0 - 7.9)', colorClass: 'bg-sky-500 text-white' },
    { grade: 'C+', count: gradeCounts['C+'].count, credits: gradeCounts['C+'].credits, percentage: totalGradedCourses > 0 ? (gradeCounts['C+'].count / totalGradedCourses) * 100 : 0, description: 'Trung bình khá (6.5 - 6.9)', colorClass: 'bg-amber-500 text-white' },
    { grade: 'C', count: gradeCounts['C'].count, credits: gradeCounts['C'].credits, percentage: totalGradedCourses > 0 ? (gradeCounts['C'].count / totalGradedCourses) * 100 : 0, description: 'Trung bình (5.5 - 6.4)', colorClass: 'bg-orange-500 text-white' },
    { grade: 'D+', count: gradeCounts['D+'].count, credits: gradeCounts['D+'].credits, percentage: totalGradedCourses > 0 ? (gradeCounts['D+'].count / totalGradedCourses) * 100 : 0, description: 'Trung bình yếu (5.0 - 5.4)', colorClass: 'bg-rose-400 text-white' },
    { grade: 'D', count: gradeCounts['D'].count, credits: gradeCounts['D'].credits, percentage: totalGradedCourses > 0 ? (gradeCounts['D'].count / totalGradedCourses) * 100 : 0, description: 'Yếu (4.0 - 4.9)', colorClass: 'bg-rose-500 text-white' },
    { grade: 'F', count: gradeCounts['F'].count, credits: gradeCounts['F'].credits, percentage: totalGradedCourses > 0 ? (gradeCounts['F'].count / totalGradedCourses) * 100 : 0, description: 'Kém / Học lại (< 4.0)', colorClass: 'bg-red-700 text-white' },
  ];

  const highestGradeCount = Math.max(...gradeBuckets.map((b) => b.count), 1);

  // Phân nhóm môn học
  const topCourses = allCourses.filter((c) => c.letterGrade === 'A+' || c.letterGrade === 'A' || (c.finalScore10 !== null && c.finalScore10 >= 8.5));
  const improvementCourses = allCourses.filter(
    (c) =>
      c.isCalculatedInGpa &&
      (c.isPassed === false ||
        (c.isPassed === true &&
          (c.letterGrade === 'D' ||
            c.letterGrade === 'D+' ||
            c.letterGrade === 'C' ||
            (c.finalScore10 !== null && c.finalScore10 < 6.5))))
  );
  const inProgressCourses = allCourses.filter((c) => c.isPassed === null);

  const totalPassedSubjects = allCourses.filter((c) => c.isPassed === true).length;
  const totalFailedSubjects = allCourses.filter((c) => c.isPassed === false).length;
  const totalInProgressSubjects = inProgressCourses.length;
  const totalSubjects = allCourses.length;

  // Tính số tín chỉ đạt toàn khóa (chỉ cần pass là tính)
  const totalPassedCredits = allCourses
    .filter((c) => c.isPassed === true)
    .reduce((sum, c) => sum + c.credits, 0);

  // Tính số tín chỉ tích lũy chỉ cho các môn Đạt VÀ isCalculatedInGpa
  const passedAccumulatedCourses = allCourses.filter((c) => c.isPassed === true && c.isCalculatedInGpa);
  const totalCreditsAccumulated = passedAccumulatedCourses.reduce((sum, c) => sum + c.credits, 0);
  const totalCreditsRegistered = allCourses.reduce((sum, c) => sum + c.credits, 0);
  const totalInProgressCredits = inProgressCourses.reduce((sum, c) => sum + c.credits, 0);

  // Tính GPA tích lũy toàn khóa từ các môn có isCalculatedInGpa
  const allGradedGpaCourses = allCourses.filter(
    (c) => c.isCalculatedInGpa && c.finalScore4 !== null && c.credits > 0
  );
  const totalGpaCredits = allGradedGpaCourses.reduce((sum, c) => sum + c.credits, 0);
  const fallbackCumGpa4 =
    totalGpaCredits > 0
      ? Math.round((allGradedGpaCourses.reduce((sum, c) => sum + (c.finalScore4 || 0) * c.credits, 0) / totalGpaCredits) * 100) / 100
      : null;
  const fallbackCumGpa10 =
    totalGpaCredits > 0
      ? Math.round((allGradedGpaCourses.reduce((sum, c) => sum + (c.finalScore10 || 0) * c.credits, 0) / totalGpaCredits) * 100) / 100
      : null;

  const gpa4 = fetchedResult?.summary?.gpa4 ?? fallbackCumGpa4;
  const gpa10 = fetchedResult?.summary?.gpa10 ?? fallbackCumGpa10;
  const classification = fetchedResult?.summary?.classification || 'Chưa xếp loại';

  const gradedSubjectsCount = totalPassedSubjects + totalFailedSubjects;
  const passRate = gradedSubjectsCount > 0 ? Math.round((totalPassedSubjects / gradedSubjectsCount) * 100) : 0;
  const curriculumTargetCredits = 130;
  const graduationProgressRate = Math.min(100, Math.round((totalCreditsAccumulated / curriculumTargetCredits) * 100));

  // Tính toán Dự Báo Mục Tiêu Học Tập
  const remainingCredits = Math.max(0, curriculumTargetCredits - totalCreditsAccumulated);
  const targetGoals: AcademicTargetGoal[] = [
    { label: 'Bằng Khá (GPA ≥ 2.50)', targetGpa4: 2.5, isAchievable: true, requiredGpaOnRemaining: null, status: 'ACHIEVED', note: '' },
    { label: 'Bằng Giỏi (GPA ≥ 3.20)', targetGpa4: 3.2, isAchievable: true, requiredGpaOnRemaining: null, status: 'POSSIBLE', note: '' },
    { label: 'Bằng Xuất Sắc (GPA ≥ 3.60)', targetGpa4: 3.6, isAchievable: true, requiredGpaOnRemaining: null, status: 'CHALLENGING', note: '' },
  ];

  targetGoals.forEach((goal) => {
    if (gpa4 !== null) {
      if (gpa4 >= goal.targetGpa4) {
        goal.status = 'ACHIEVED';
        goal.note = `Hiện tại bạn đã đạt mức điểm này (${gpa4.toFixed(2)} / ${goal.targetGpa4.toFixed(2)}). Tiếp tục duy trì phong độ!`;
      } else if (remainingCredits > 0) {
        const totalTargetCredits = totalCreditsAccumulated + remainingCredits;
        const requiredGpa = (goal.targetGpa4 * totalTargetCredits - gpa4 * totalCreditsAccumulated) / remainingCredits;
        goal.requiredGpaOnRemaining = Math.round(requiredGpa * 100) / 100;

        if (requiredGpa <= 4.0 && requiredGpa > 0) {
          goal.isAchievable = true;
          goal.status = requiredGpa <= 3.4 ? 'POSSIBLE' : 'CHALLENGING';
          goal.note = `Cần đạt trung bình GPA ${goal.requiredGpaOnRemaining.toFixed(2)} cho ${remainingCredits} tín chỉ còn lại để đạt danh hiệu này.`;
        } else {
          goal.isAchievable = false;
          goal.status = 'UNACHIEVABLE';
          goal.note = `Khó khả thi về mặt lý thuyết do cần GPA > 4.0 trên số tín chỉ còn lại. Cần học cải thiện các môn điểm C/D để nâng GPA.`;
        }
      }
    }
  });

  return {
    success: true,
    username: cleanUsername,
    isConfigured: options.isConfigured,
    hasLinkedAccount: options.isConfigured,
    isLiveSync: options.isLiveSync,
    isCachedDb: options.isCachedDb,
    lastSyncAt: options.lastSyncAt,
    summary: {
      gpa10,
      gpa4,
      totalCreditsAccumulated,
      totalPassedCredits,
      totalCreditsRegistered,
      totalInProgressCredits,
      classification,
      totalPassedSubjects,
      totalFailedSubjects,
      totalInProgressSubjects,
      totalSubjects,
      passRate,
      curriculumTargetCredits,
      graduationProgressRate,
    },
    gradeDistribution: {
      buckets: gradeBuckets,
      highestGradeCount,
      averageLetter: gpa4 !== null ? (gpa4 >= 3.6 ? 'A' : gpa4 >= 3.2 ? 'B+' : gpa4 >= 2.5 ? 'B' : 'C') : 'N/A',
    },
    gpaProgression,
    semesters: processedSemesters,
    topCourses,
    improvementCourses,
    inProgressCourses,
    targetGoals,
  };
}

/**
 * Lấy kết quả học tập của sinh viên (ưu tiên đọc từ DB StudentGradeRecord nếu chưa yêu cầu refresh)
 */
export async function getStudentGrades(
  username: string,
  options?: { forceRefresh?: boolean }
): Promise<StudentGradesResult> {
  const cleanUsername = username.trim().toUpperCase();

  // 1. Kiểm tra tài khoản ExternalAccount QLDTTX
  const extAccount = await prisma.externalAccount.findFirst({
    where: {
      username: cleanUsername,
      systemKey: 'QLDTTX_PTTC1',
    },
  });

  const isConfigured = !!(extAccount && (extAccount.token || extAccount.extPassword));

  if (!isConfigured) {
    return {
      success: false,
      username: cleanUsername,
      isConfigured: false,
      hasLinkedAccount: false,
      isLiveSync: false,
      lastSyncAt: null,
      summary: {
        gpa10: null,
        gpa4: null,
        totalCreditsAccumulated: 0,
        totalPassedCredits: 0,
        totalCreditsRegistered: 0,
        totalInProgressCredits: 0,
        classification: 'Chưa liên kết',
        totalPassedSubjects: 0,
        totalFailedSubjects: 0,
        totalInProgressSubjects: 0,
        totalSubjects: 0,
        passRate: 0,
        curriculumTargetCredits: 130,
        graduationProgressRate: 0,
      },
      gradeDistribution: { buckets: [], highestGradeCount: 0, averageLetter: 'N/A' },
      gpaProgression: [],
      semesters: [],
      topCourses: [],
      improvementCourses: [],
      inProgressCourses: [],
      targetGoals: [],
      errorType: 'NOT_CONFIGURED',
      error: 'Chưa cấu hình tài khoản Cổng Quản Lý Đào Tạo Từ Xa (QLDTTX PTTC1). Vui lòng cấu hình tài khoản để xem Bảng Điểm & Kết Quả Học Tập.',
    };
  }

  // 2. Nếu KHÔNG yêu cầu forceRefresh -> Kiểm tra cache bảng StudentGradeRecord trong DB trước
  if (!options?.forceRefresh) {
    try {
      const cachedRecord = await prisma.studentGradeRecord.findUnique({
        where: { username: cleanUsername },
      });

      if (cachedRecord && cachedRecord.rawData) {
        const parsed = JSON.parse(cachedRecord.rawData);
        if (parsed && (parsed.semesters || parsed.data?.ds_diem_hocky)) {
          const syncTime = cachedRecord.lastPulledAt || cachedRecord.updatedAt || cachedRecord.createdAt || extAccount?.lastSyncAt;
          return buildGradeResultFromRawData(cleanUsername, parsed, {
            isConfigured: true,
            isLiveSync: false,
            isCachedDb: true,
            lastSyncAt: syncTime ? new Date(syncTime).toISOString() : null,
          });
        }
      }
    } catch (cacheErr) {
      console.warn('[getStudentGrades] Đọc cache StudentGradeRecord thất bại, chuyển sang gọi QLDTTX:', cacheErr);
    }
  }

  // 3. Gọi trực tiếp tới QLDTTX khi forceRefresh hoặc chưa có cache trong DB
  let lastSyncAt = extAccount?.lastSyncAt ? extAccount.lastSyncAt.toISOString() : null;
  let authErrorDetected = false;
  let authErrorMessage = '';
  let fetchedResult: any = null;

  try {
    fetchedResult = await fetchStudentGradesFromQLDTTX({
      username: extAccount!.extUsername || cleanUsername,
      password: extAccount!.extPassword || undefined,
      token: extAccount!.token,
    });

    // Cập nhật trạng thái CONNECTED vào Database
    await prisma.externalAccount
      .update({
        where: { id: extAccount!.id },
        data: {
          ...(fetchedResult.newToken ? { token: fetchedResult.newToken } : {}),
          lastSyncAt: new Date(),
          status: 'CONNECTED',
          syncMessage: 'Đồng bộ điểm thành công từ QLDTTX.',
        },
      })
      .catch(() => {});

    // Xây dựng dữ liệu hoàn chỉnh
    const resultObj = buildGradeResultFromRawData(cleanUsername, fetchedResult, {
      isConfigured: true,
      isLiveSync: true,
      isCachedDb: false,
      lastSyncAt: new Date().toISOString(),
    });

    // 4. Lưu / Persist vào bảng StudentGradeRecord theo User trong Database
    try {
      await prisma.studentGradeRecord.upsert({
        where: { username: cleanUsername },
        create: {
          username: cleanUsername,
          rawData: JSON.stringify(fetchedResult),
          gpa10: resultObj.summary.gpa10,
          gpa4: resultObj.summary.gpa4,
          creditsAcc: resultObj.summary.totalCreditsAccumulated,
          creditsPassed: resultObj.summary.totalPassedCredits,
          creditsReg: resultObj.summary.totalCreditsRegistered,
          classification: resultObj.summary.classification,
          totalSubjects: resultObj.summary.totalSubjects,
          totalPassed: resultObj.summary.totalPassedSubjects,
          totalFailed: resultObj.summary.totalFailedSubjects,
          totalInProgress: resultObj.summary.totalInProgressSubjects,
          lastPulledAt: new Date(),
        },
        update: {
          rawData: JSON.stringify(fetchedResult),
          gpa10: resultObj.summary.gpa10,
          gpa4: resultObj.summary.gpa4,
          creditsAcc: resultObj.summary.totalCreditsAccumulated,
          creditsPassed: resultObj.summary.totalPassedCredits,
          creditsReg: resultObj.summary.totalCreditsRegistered,
          classification: resultObj.summary.classification,
          totalSubjects: resultObj.summary.totalSubjects,
          totalPassed: resultObj.summary.totalPassedSubjects,
          totalFailed: resultObj.summary.totalFailedSubjects,
          totalInProgress: resultObj.summary.totalInProgressSubjects,
          lastPulledAt: new Date(),
        },
      });
    } catch (saveErr) {
      console.warn('[getStudentGrades] Lưu StudentGradeRecord thất bại:', saveErr);
    }

    return resultObj;
  } catch (err: any) {
    const errMsg = (err?.message || '').toLowerCase();
    console.warn(`[getStudentGrades] Lỗi kết nối QLDTTX cho ${cleanUsername}:`, err?.message);

    if (
      errMsg.includes('401') ||
      errMsg.includes('403') ||
      errMsg.includes('không thành công') ||
      errMsg.includes('mật khẩu') ||
      errMsg.includes('tài khoản') ||
      errMsg.includes('đăng nhập') ||
      errMsg.includes('unauthorized') ||
      errMsg.includes('forbidden')
    ) {
      authErrorDetected = true;
      authErrorMessage = err.message || 'Tài khoản hoặc mật khẩu QLDTTX không chính xác.';

      await prisma.externalAccount
        .update({
          where: { id: extAccount!.id },
          data: {
            status: 'ERROR',
            syncMessage: 'Đăng nhập thất bại: Tài khoản hoặc mật khẩu không chính xác.',
          },
        })
        .catch(() => {});
    } else {
      // Nếu lỗi mạng / timeout trường, thử fallback sang StudentGradeRecord trong DB
      try {
        const fallbackDb = await prisma.studentGradeRecord.findUnique({
          where: { username: cleanUsername },
        });
        if (fallbackDb && fallbackDb.rawData) {
          const parsed = JSON.parse(fallbackDb.rawData);
          const syncTime = fallbackDb.lastPulledAt || fallbackDb.updatedAt || fallbackDb.createdAt || extAccount?.lastSyncAt;
          return buildGradeResultFromRawData(cleanUsername, parsed, {
            isConfigured: true,
            isLiveSync: false,
            isCachedDb: true,
            lastSyncAt: syncTime ? new Date(syncTime).toISOString() : null,
          });
        }
      } catch (fbErr) {
        // Continue to error return
      }

      return {
        success: false,
        username: cleanUsername,
        isConfigured: true,
        hasLinkedAccount: true,
        isLiveSync: false,
        lastSyncAt,
        summary: {
          gpa10: null,
          gpa4: null,
          totalCreditsAccumulated: 0,
          totalPassedCredits: 0,
          totalCreditsRegistered: 0,
          totalInProgressCredits: 0,
          classification: 'Lỗi kết nối',
          totalPassedSubjects: 0,
          totalFailedSubjects: 0,
          totalInProgressSubjects: 0,
          totalSubjects: 0,
          passRate: 0,
          curriculumTargetCredits: 130,
          graduationProgressRate: 0,
        },
        gradeDistribution: { buckets: [], highestGradeCount: 0, averageLetter: 'N/A' },
        gpaProgression: [],
        semesters: [],
        topCourses: [],
        improvementCourses: [],
        inProgressCourses: [],
        targetGoals: [],
        errorType: 'SERVER_ERROR',
        error: `Không thể kết nối đến cổng điểm QLDTTX: ${err.message}`,
      };
    }
  }

  if (authErrorDetected || extAccount?.status === 'ERROR') {
    return {
      success: false,
      username: cleanUsername,
      isConfigured: true,
      hasLinkedAccount: true,
      isLiveSync: false,
      lastSyncAt,
      summary: {
        gpa10: null,
        gpa4: null,
        totalCreditsAccumulated: 0,
        totalPassedCredits: 0,
        totalCreditsRegistered: 0,
        totalInProgressCredits: 0,
        classification: 'Sai thông tin',
        totalPassedSubjects: 0,
        totalFailedSubjects: 0,
        totalInProgressSubjects: 0,
        totalSubjects: 0,
        passRate: 0,
        curriculumTargetCredits: 130,
        graduationProgressRate: 0,
      },
      gradeDistribution: { buckets: [], highestGradeCount: 0, averageLetter: 'N/A' },
      gpaProgression: [],
      semesters: [],
      topCourses: [],
      improvementCourses: [],
      inProgressCourses: [],
      targetGoals: [],
      errorType: 'INVALID_CREDENTIALS',
      error: authErrorMessage || 'Tài khoản hoặc mật khẩu Cổng Quản Lý Đào Tạo Từ Xa không chính xác.',
    };
  }

  return {
    success: false,
    username: cleanUsername,
    isConfigured: true,
    hasLinkedAccount: true,
    isLiveSync: false,
    lastSyncAt,
    summary: {
      gpa10: null,
      gpa4: null,
      totalCreditsAccumulated: 0,
      totalPassedCredits: 0,
      totalCreditsRegistered: 0,
      totalInProgressCredits: 0,
      classification: 'Không có dữ liệu',
      totalPassedSubjects: 0,
      totalFailedSubjects: 0,
      totalInProgressSubjects: 0,
      totalSubjects: 0,
      passRate: 0,
      curriculumTargetCredits: 130,
      graduationProgressRate: 0,
    },
    gradeDistribution: { buckets: [], highestGradeCount: 0, averageLetter: 'N/A' },
    gpaProgression: [],
    semesters: [],
    topCourses: [],
    improvementCourses: [],
    inProgressCourses: [],
    targetGoals: [],
  };
}
