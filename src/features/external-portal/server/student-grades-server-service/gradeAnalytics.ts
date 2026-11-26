import type {
  AcademicTargetGoal,
  GpaTrendItem,
  GradeCountsMap,
  GradeDistributionBucket,
  SemesterGradeSummary,
  StudentCourseGrade,
} from './types';

export function buildGpaProgression(
  processedSemesters: SemesterGradeSummary[]
): GpaTrendItem[] {
  // Sắp xếp GPA Progression theo thứ tự học kỳ tăng dần (cho biểu đồ timeline)
  const progressionSemesters = [...processedSemesters].sort((a, b) =>
    a.semesterId.localeCompare(b.semesterId, undefined, { numeric: true })
  );

  // Tín chỉ và GPA tích lũy dự kiến qua từng kỳ: chỉ tính môn Đạt và isCalculatedInGpa
  let runningCumulativeCredits = 0;
  const runningPassedCourses: StudentCourseGrade[] = [];

  for (const s of progressionSemesters) {
    const semAccCredits = s.courses
      .filter((c) => c.isPassed === true && c.isCalculatedInGpa)
      .reduce((sum, c) => sum + c.credits, 0);
    runningCumulativeCredits += semAccCredits;
    s.creditsCumulative = runningCumulativeCredits;
    s.creditsAccumulatedCumulativeExpected = runningCumulativeCredits;

    const semPassedGpa = s.courses.filter(
      (c) => c.isPassed === true && c.isCalculatedInGpa && c.credits > 0 && c.finalScore4 !== null
    );
    runningPassedCourses.push(...semPassedGpa);

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
    creditsCumulative: s.creditsCumulative,
    creditsCumulativeExpected: s.creditsAccumulatedCumulativeExpected,
  }));
}

export function buildGradeDistribution(
  allCourses: StudentCourseGrade[],
  gradeCounts: GradeCountsMap,
  gpa4: number | null
): {
  buckets: GradeDistributionBucket[];
  highestGradeCount: number;
  averageLetter: string;
} {
  const totalGradedCourses = allCourses.filter((c) => c.isPassed !== null || c.letterGrade).length;
  const buckets: GradeDistributionBucket[] = [
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

  const highestGradeCount = Math.max(...buckets.map((b) => b.count), 1);
  const averageLetter = gpa4 !== null ? (gpa4 >= 3.6 ? 'A' : gpa4 >= 3.2 ? 'B+' : gpa4 >= 2.5 ? 'B' : 'C') : 'N/A';

  return { buckets, highestGradeCount, averageLetter };
}

export interface BuildTargetGoalsParams {
  gpa4: number | null;
  gpa10: number | null;
  totalCreditsAccumulated: number;
  curriculumTargetCredits: number;
}

export function buildTargetGoals(params: BuildTargetGoalsParams): AcademicTargetGoal[] {
  const { gpa4, gpa10, totalCreditsAccumulated, curriculumTargetCredits } = params;
  const remainingCredits = Math.max(0, curriculumTargetCredits - totalCreditsAccumulated);
  const targetGoals: AcademicTargetGoal[] = [
    { label: 'Bằng Khá (GPA ≥ 2.50 / Hệ 10 ≥ 7.0)', targetGpa4: 2.5, targetGpa10: 7.0, isAchievable: true, requiredGpaOnRemaining: null, requiredGpa10OnRemaining: null, status: 'ACHIEVED', note: '' },
    { label: 'Bằng Giỏi (GPA ≥ 3.20 / Hệ 10 ≥ 8.0)', targetGpa4: 3.2, targetGpa10: 8.0, isAchievable: true, requiredGpaOnRemaining: null, requiredGpa10OnRemaining: null, status: 'POSSIBLE', note: '' },
    { label: 'Bằng Xuất Sắc (GPA ≥ 3.60 / Hệ 10 ≥ 9.0)', targetGpa4: 3.6, targetGpa10: 9.0, isAchievable: true, requiredGpaOnRemaining: null, requiredGpa10OnRemaining: null, status: 'CHALLENGING', note: '' },
  ];

  targetGoals.forEach((goal) => {
    if (gpa4 !== null) {
      if (gpa4 >= goal.targetGpa4) {
        goal.status = 'ACHIEVED';
        goal.note = `Hiện tại bạn đã đạt mức điểm này (GPA ${gpa4.toFixed(2)} / ${goal.targetGpa4.toFixed(2)}${gpa10 !== null ? ` • Hệ 10: ${gpa10.toFixed(2)}` : ''}). Tiếp tục duy trì phong độ!`;
      } else if (remainingCredits > 0) {
        const totalTargetCredits = totalCreditsAccumulated + remainingCredits;
        const requiredGpa = (goal.targetGpa4 * totalTargetCredits - gpa4 * totalCreditsAccumulated) / remainingCredits;
        goal.requiredGpaOnRemaining = Math.round(requiredGpa * 100) / 100;

        if (goal.targetGpa10 && gpa10 !== null) {
          const requiredGpa10 = (goal.targetGpa10 * totalTargetCredits - gpa10 * totalCreditsAccumulated) / remainingCredits;
          goal.requiredGpa10OnRemaining = Math.round(requiredGpa10 * 100) / 100;
        }

        if (requiredGpa <= 4.0 && requiredGpa > 0) {
          goal.isAchievable = true;
          goal.status = requiredGpa <= 3.4 ? 'POSSIBLE' : 'CHALLENGING';
          const gpa10Str = goal.requiredGpa10OnRemaining !== null && goal.requiredGpa10OnRemaining !== undefined ? ` • Hệ 10: ${goal.requiredGpa10OnRemaining.toFixed(2)}` : '';
          goal.note = `Cần đạt trung bình GPA ${goal.requiredGpaOnRemaining.toFixed(2)}${gpa10Str} cho ${remainingCredits} tín chỉ còn lại để đạt danh hiệu này.`;
        } else {
          goal.isAchievable = false;
          goal.status = 'UNACHIEVABLE';
          goal.note = `Khó khả thi về mặt lý thuyết do cần GPA > 4.0 trên số tín chỉ còn lại. Cần học cải thiện các môn điểm C/D để nâng GPA.`;
        }
      }
    }
  });

  return targetGoals;
}
