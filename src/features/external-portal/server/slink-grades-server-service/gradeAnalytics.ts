import { StudentGradesResult } from '../studentGradesServerService';
import { BuildSlinkGradeOptions } from './types';
import { parseScore } from './courseParser';
import { buildProcessedSemesters } from './semesterBuilder';
import {
  buildAcademicTargetGoals,
  buildGradeDistributionBuckets,
  resolveClassification,
} from './gradeHelpers';

/**
 * Xây dựng đối tượng kết quả phân tích học tập từ cấu trúc JSON của S-Link
 */
export function buildSlinkGradeResultFromRawData(
  cleanUsername: string,
  fetchedResult: any,
  options: BuildSlinkGradeOptions
): StudentGradesResult {
  const sinhVien = fetchedResult?.sinhVien || {};
  const accumulated = sinhVien?.kqhtTichLuyNganh1 || {};
  const rawSemesters: any[] = fetchedResult?.semesters || [];
  const rawCourses: any[] = fetchedResult?.courses || [];
  const ctdt = fetchedResult?.chuongTrinhDaoTao || fetchedResult?.ctdtKeHoach || {};
  const khoaNganh = fetchedResult?.khoaNganh || {};

  const {
    processedSemesters,
    allCourses,
    gradeCounts,
    gpaProgression,
  } = buildProcessedSemesters(rawSemesters, rawCourses);

  const buckets = buildGradeDistributionBuckets(gradeCounts);

  // Lấy học kỳ mới nhất có điểm tích lũy để fallback nếu thông tin tổng hợp chưa có
  const latestSemesterWithGpa =
    processedSemesters.find((s) => s.gpa4Cumulative !== null || s.gpa10Cumulative !== null) ||
    (processedSemesters.length > 0 ? processedSemesters[0] : null);

  // 1. Tổng số tín chỉ đạt (bao gồm cả môn KNM/điều kiện nếu pass)
  const totalPassedCredits = allCourses
    .filter((c) => c.isPassed === true)
    .reduce((sum, c) => sum + c.credits, 0);

  // 2. Số tín chỉ tích lũy dự kiến (toàn bộ môn đã đạt VÀ tính vào GPA, ví dụ: 29 TC)
  const passedAccumulatedCourses = allCourses.filter((c) => c.isPassed === true && c.isCalculatedInGpa);
  const totalCreditsAccumulatedExpected = passedAccumulatedCourses.reduce((sum, c) => sum + c.credits, 0);

  // 3. Số tín chỉ tích lũy chính thức (đã chốt theo đợt xét S-Link, ví dụ: 18 TC)
  const officialAccCredits =
    Number(accumulated.tongSoTinChi ?? 0) ||
    Number(latestSemesterWithGpa?.creditsAccumulatedCumulativeOfficial ?? 0) ||
    allCourses.filter((c) => c.isPassed === true && c.isAccumulatedOfficial).reduce((sum, c) => sum + c.credits, 0);

  const totalCreditsAccumulated = officialAccCredits > 0 ? officialAccCredits : totalCreditsAccumulatedExpected;

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

  // Tính tổng hợp toàn khóa
  const gpa10 =
    parseScore(accumulated.trungBinh) ??
    (latestSemesterWithGpa ? latestSemesterWithGpa.gpa10Cumulative : null) ??
    fallbackCumGpa10;
  const gpa4 =
    parseScore(accumulated.trungBinhThang4) ??
    (latestSemesterWithGpa ? latestSemesterWithGpa.gpa4Cumulative : null) ??
    fallbackCumGpa4;

  const totalCreditsRegistered = Number(accumulated.tongSoTinChiDangKy || totalPassedCredits);
  const totalCreditsDebt = Number(accumulated.tongSoTinChiNo || 0);
  const totalInProgressCredits = gradeCounts.IN_PROGRESS.credits;
  const classification = resolveClassification(accumulated.hocLuc, gpa4);

  const totalPassedSubjects = allCourses.filter((c) => c.isPassed === true).length;
  const totalFailedSubjects = allCourses.filter((c) => c.isPassed === false).length;
  const totalInProgressSubjects = allCourses.filter((c) => c.isPassed === null).length;
  const totalSubjects = allCourses.length;

  const finishedSubjects = totalPassedSubjects + totalFailedSubjects;
  const passRate = finishedSubjects > 0 ? Math.round((totalPassedSubjects / finishedSubjects) * 100) : 100;

  // Tổng số tín chỉ CTĐT chuẩn (lấy động từ CTĐT S-Link: 150 TC cho CNTT, hoặc fallback 130)
  const targetCredits = Number(
    ctdt?.tongSoTinChi ||
    ctdt?.ctdtKeHoach?.tongSoTinChi ||
    (khoaNganh?.khoaNganhChinh?.ma?.includes('748') ? 150 : 130)
  );

  const curriculumName = String(
    ctdt?.ten ||
    khoaNganh?.khoaNganhChinh?.ten ||
    sinhVien?.nganh?.ten ||
    'Công nghệ thông tin'
  ).trim();

  const academicYearLevel = String(accumulated.trinhDo || sinhVien?.trinhDo || 'Năm nhất').trim();

  const graduationProgressRate = targetCredits > 0 ? Math.min(100, Math.round((totalCreditsAccumulated / targetCredits) * 100)) : 0;
  const graduationProgressRateExpected = targetCredits > 0 ? Math.min(100, Math.round((totalCreditsAccumulatedExpected / targetCredits) * 100)) : 0;

  // Top môn học điểm cao
  const topCourses = allCourses
    .filter((c) => c.finalScore10 !== null && c.finalScore10 >= 8.0)
    .sort((a, b) => (b.finalScore10 || 0) - (a.finalScore10 || 0))
    .slice(0, 8);

  // Môn học cần cải thiện (C, D, F) - Chỉ xét các môn có isCalculatedInGpa
  const improvementCourses = allCourses
    .filter(
      (c) =>
        c.isCalculatedInGpa &&
        (c.isPassed === false || (c.finalScore10 !== null && c.finalScore10 < 6.5))
    )
    .sort((a, b) => (a.finalScore10 || 0) - (b.finalScore10 || 0));

  // Môn đang học
  const inProgressCourses = allCourses.filter((c) => c.isPassed === null);

  // Mục tiêu học tập (Academic Target Goals)
  const targetGoals = buildAcademicTargetGoals({
    gpa4,
    gpa10,
    targetCredits,
    totalCreditsAccumulated,
    totalCreditsAccumulatedExpected,
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
      gpa10Expected: fallbackCumGpa10,
      gpa4Expected: fallbackCumGpa4,
      totalCreditsAccumulated,
      totalCreditsAccumulatedExpected,
      totalPassedCredits,
      totalCreditsRegistered,
      totalInProgressCredits,
      totalCreditsDebt,
      classification,
      totalPassedSubjects,
      totalFailedSubjects,
      totalInProgressSubjects,
      totalSubjects,
      passRate,
      curriculumTargetCredits: targetCredits,
      graduationProgressRate,
      graduationProgressRateExpected,
      academicYearLevel,
      curriculumName,
    },
    gradeDistribution: {
      buckets,
      highestGradeCount: Math.max(...buckets.map((b) => b.count)),
      averageLetter: buckets.find((b) => b.count > 0)?.grade || 'N/A',
    },
    gpaProgression,
    semesters: processedSemesters,
    topCourses,
    improvementCourses,
    inProgressCourses,
    targetGoals,
  };
}
