import { prisma } from '@/src/lib/prisma';
import { StudentGradesResult } from '../studentGradesServerService';
import { SLINK_AUTH_ERROR_KEYWORDS } from './constants';
import { buildSlinkGradeResultFromRawData } from './gradeAnalytics';

export function isSlinkAuthError(errMsg: string): boolean {
  return SLINK_AUTH_ERROR_KEYWORDS.some((keyword) => errMsg.includes(keyword));
}

export function createEmptySlinkGradesErrorResult(params: {
  cleanUsername: string;
  isConfigured: boolean;
  lastSyncAt: string | null;
  classification: string;
  errorType: StudentGradesResult['errorType'];
  error: string;
}): StudentGradesResult {
  return {
    success: false,
    username: params.cleanUsername,
    isConfigured: params.isConfigured,
    hasLinkedAccount: params.isConfigured,
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
    errorType: params.errorType,
    error: params.error,
  };
}

export async function readCachedSlinkGradeResult(params: {
  cleanUsername: string;
  fallbackLastSyncAt?: Date | null;
  requireNonEmptyPayload: boolean;
}): Promise<StudentGradesResult | null> {
  const cachedRecord = await prisma.studentSlinkGradeRecord.findUnique({
    where: { username: params.cleanUsername },
  });

  if (!cachedRecord || !cachedRecord.rawData) {
    return null;
  }

  const parsed = JSON.parse(cachedRecord.rawData);
  if (
    params.requireNonEmptyPayload &&
    !(parsed && (parsed.semesters || parsed.courses || parsed.sinhVien))
  ) {
    return null;
  }

  const syncTime =
    cachedRecord.lastPulledAt ||
    cachedRecord.updatedAt ||
    cachedRecord.createdAt ||
    params.fallbackLastSyncAt;

  return buildSlinkGradeResultFromRawData(params.cleanUsername, parsed, {
    isConfigured: true,
    isLiveSync: false,
    isCachedDb: true,
    lastSyncAt: syncTime ? new Date(syncTime).toISOString() : null,
  });
}

export async function persistSlinkGradeRecord(
  cleanUsername: string,
  fetchedResult: any,
  resultObj: StudentGradesResult
): Promise<void> {
  const maKhoaNganh =
    fetchedResult.khoaNganh?.khoaNganhChinh?.ma ||
    fetchedResult.sinhVien?.maKhoaNganh ||
    null;
  const tenKhoaNganh =
    fetchedResult.khoaNganh?.khoaNganhChinh?.ten ||
    fetchedResult.sinhVien?.nganh?.ten ||
    null;

  const payload = {
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
    maKhoaNganh,
    tenKhoaNganh,
    lastPulledAt: new Date(),
  };

  await prisma.studentSlinkGradeRecord.upsert({
    where: { username: cleanUsername },
    create: {
      username: cleanUsername,
      ...payload,
    },
    update: payload,
  });
}
