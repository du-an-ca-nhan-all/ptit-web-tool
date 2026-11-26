import { createEmptyGradeCounts, parseRawSemester } from './courseParser';
import {
  buildGpaProgression,
  buildGradeDistribution,
  buildTargetGoals,
} from './gradeAnalytics';
import type {
  GradeBuildOptions,
  SemesterGradeSummary,
  StudentCourseGrade,
  StudentGradesResult,
} from './types';

/**
 * Xây dựng đối tượng kết quả phân tích học tập từ cấu trúc JSON của QLDTTX
 */
export function buildGradeResultFromRawData(
  cleanUsername: string,
  fetchedResult: any,
  options: GradeBuildOptions
): StudentGradesResult {
  const rawSemesters: any[] = fetchedResult?.semesters || fetchedResult?.data?.ds_diem_hocky || [];
  const processedSemesters: SemesterGradeSummary[] = [];
  const allCourses: StudentCourseGrade[] = [];
  const gradeCounts = createEmptyGradeCounts();

  for (const sem of rawSemesters) {
    const semesterSummary = parseRawSemester(sem, gradeCounts);
    processedSemesters.push(semesterSummary);
    allCourses.push(...semesterSummary.courses);
  }

  // Sắp xếp các học kỳ theo thứ tự gần nhất đến cũ nhất (descending) để đồng nhất với UI
  processedSemesters.sort((a, b) => b.semesterId.localeCompare(a.semesterId, undefined, { numeric: true }));

  const gpaProgression = buildGpaProgression(processedSemesters);

  // Phân nhóm môn học
  const topCourses = allCourses.filter(
    (c) => c.letterGrade === 'A+' || c.letterGrade === 'A' || (c.finalScore10 !== null && c.finalScore10 >= 8.5)
  );
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

  const gradeDistribution = buildGradeDistribution(allCourses, gradeCounts, gpa4);
  const targetGoals = buildTargetGoals({ gpa4, gpa10, totalCreditsAccumulated, curriculumTargetCredits });

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
      gpa10Expected: fallbackCumGpa10,
      gpa4Expected: fallbackCumGpa4,
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
    gradeDistribution,
    gpaProgression,
    semesters: processedSemesters,
    topCourses,
    improvementCourses,
    inProgressCourses,
    targetGoals,
  };
}
