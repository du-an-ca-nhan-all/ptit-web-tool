import { prisma } from '@/src/lib/prisma';
import { buildGradeResultFromRawData } from './buildGradeResult';
import type { StudentGradesResult } from './types';

export function createEmptyGradesResult(params: {
  username: string;
  isConfigured: boolean;
  hasLinkedAccount: boolean;
  lastSyncAt: string | null;
  classification: string;
  errorType?: 'NOT_CONFIGURED' | 'INVALID_CREDENTIALS' | 'SERVER_ERROR';
  error?: string;
}): StudentGradesResult {
  return {
    success: false,
    username: params.username,
    isConfigured: params.isConfigured,
    hasLinkedAccount: params.hasLinkedAccount,
    isLiveSync: false,
    lastSyncAt: params.lastSyncAt,
    summary: {
      gpa10: null,
      gpa4: null,
      totalCreditsAccumulated: 0,
      totalPassedCredits: 0,
      totalCreditsRegistered: 0,
      totalInProgressCredits: 0,
      classification: params.classification,
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
    ...(params.errorType !== undefined ? { errorType: params.errorType } : {}),
    ...(params.error !== undefined ? { error: params.error } : {}),
  };
}

export function isQldttxAuthError(errMsg: string): boolean {
  return (
    errMsg.includes('401') ||
    errMsg.includes('403') ||
    errMsg.includes('không thành công') ||
    errMsg.includes('mật khẩu') ||
    errMsg.includes('tài khoản') ||
    errMsg.includes('đăng nhập') ||
    errMsg.includes('unauthorized') ||
    errMsg.includes('forbidden')
  );
}

export async function readCachedStudentGrades(
  cleanUsername: string,
  fallbackSyncAt: Date | null | undefined,
  requireSemesters: boolean
): Promise<StudentGradesResult | null> {
  const cachedRecord = await prisma.studentGradeRecord.findUnique({
    where: { username: cleanUsername },
  });

  if (!cachedRecord || !cachedRecord.rawData) {
    return null;
  }

  const parsed = JSON.parse(cachedRecord.rawData);
  if (requireSemesters && !(parsed && (parsed.semesters || parsed.data?.ds_diem_hocky))) {
    return null;
  }

  const syncTime =
    cachedRecord.lastPulledAt ||
    cachedRecord.updatedAt ||
    cachedRecord.createdAt ||
    fallbackSyncAt;

  return buildGradeResultFromRawData(cleanUsername, parsed, {
    isConfigured: true,
    isLiveSync: false,
    isCachedDb: true,
    lastSyncAt: syncTime ? new Date(syncTime).toISOString() : null,
  });
}

export async function persistStudentGradeRecord(
  cleanUsername: string,
  fetchedResult: any,
  resultObj: StudentGradesResult
): Promise<void> {
  const recordData = {
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
  };

  await prisma.studentGradeRecord.upsert({
    where: { username: cleanUsername },
    create: {
      username: cleanUsername,
      ...recordData,
    },
    update: recordData,
  });
}
