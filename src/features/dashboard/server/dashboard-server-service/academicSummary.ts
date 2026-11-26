import { AcademicSummary } from '../../types/dashboard.types';
import { parseQlhtRichStats, parseSlinkRichStats } from './gradeStatsParser';

export function buildAcademicSummary(params: {
  slinkRecord: any;
  gradeRecord: any;
  slinkAccount: any;
  qldttxAccount: any;
}): AcademicSummary {
  const { slinkRecord, gradeRecord, slinkAccount, qldttxAccount } = params;

  const slinkStats = parseSlinkRichStats(slinkRecord);
  const slinkSummary = {
    source: 'SLINK' as const,
    sourceName: 'PTIT S-Link',
    portalUrl: 'slink.ptit.edu.vn',
    hasData: Boolean(slinkRecord),
    isConfigured: Boolean(slinkAccount),
    isConnected: slinkAccount?.status === 'CONNECTED',
    gpa10: slinkRecord?.gpa10 ?? null,
    gpa4: slinkRecord?.gpa4 ?? null,
    creditsAccumulated: slinkRecord?.creditsAcc ?? 0,
    creditsPassed: slinkRecord?.creditsPassed ?? 0,
    creditsRegistered: slinkRecord?.creditsReg ?? 0,
    classification: slinkRecord?.classification ?? null,
    totalSubjects: slinkRecord?.totalSubjects ?? 0,
    totalPassed: slinkRecord?.totalPassed ?? 0,
    totalFailed: slinkRecord?.totalFailed ?? 0,
    totalInProgress: slinkStats?.inProgressCount ?? slinkRecord?.totalInProgress ?? 0,
    passRate: slinkStats?.passRate ?? 100,
    creditPassRate: slinkStats?.creditPassRate ?? 100,
    totalSemesters: slinkStats?.totalSemesters ?? 0,
    latestSemester: slinkStats?.latestSemester ?? null,
    gradeDistribution: slinkStats?.gradeDistribution ?? null,
    lastSyncAt: slinkRecord?.lastPulledAt ? slinkRecord.lastPulledAt.toISOString() : null,
    tenKhoaNganh: slinkRecord?.tenKhoaNganh ?? null,
    maKhoaNganh: slinkRecord?.maKhoaNganh ?? null,
  };

  const qlhtStats = parseQlhtRichStats(gradeRecord);
  const qlhtSummary = {
    source: 'QLHT' as const,
    sourceName: 'Cổng QLDTTX (QLHT)',
    portalUrl: 'qldttx.pttc1.edu.vn',
    hasData: Boolean(gradeRecord),
    isConfigured: Boolean(qldttxAccount),
    isConnected: qldttxAccount?.status === 'CONNECTED',
    gpa10: gradeRecord?.gpa10 ?? null,
    gpa4: gradeRecord?.gpa4 ?? null,
    creditsAccumulated: gradeRecord?.creditsAcc ?? 0,
    creditsPassed: gradeRecord?.creditsPassed ?? 0,
    creditsRegistered: gradeRecord?.creditsReg ?? 0,
    classification: gradeRecord?.classification ?? null,
    totalSubjects: gradeRecord?.totalSubjects ?? 0,
    totalPassed: gradeRecord?.totalPassed ?? 0,
    totalFailed: gradeRecord?.totalFailed ?? 0,
    totalInProgress: qlhtStats?.inProgressCount ?? gradeRecord?.totalInProgress ?? 0,
    passRate: qlhtStats?.passRate ?? 100,
    creditPassRate: qlhtStats?.creditPassRate ?? 100,
    totalSemesters: qlhtStats?.totalSemesters ?? 0,
    latestSemester: qlhtStats?.latestSemester ?? null,
    gradeDistribution: qlhtStats?.gradeDistribution ?? null,
    lastSyncAt: gradeRecord?.lastPulledAt ? gradeRecord.lastPulledAt.toISOString() : null,
    tenKhoaNganh: null,
    maKhoaNganh: null,
  };

  // Primary summary: display S-Link first/by default if available, fallback to QLHT
  const primaryRecord = slinkRecord || gradeRecord;
  const primaryStats = slinkRecord ? slinkStats : qlhtStats;

  return {
    hasData: Boolean(slinkRecord || gradeRecord),
    gpa10: primaryRecord?.gpa10 ?? null,
    gpa4: primaryRecord?.gpa4 ?? null,
    creditsAccumulated: primaryRecord?.creditsAcc ?? 0,
    creditsPassed: primaryRecord?.creditsPassed ?? 0,
    creditsRegistered: primaryRecord?.creditsReg ?? 0,
    classification: primaryRecord?.classification ?? null,
    totalSubjects: primaryRecord?.totalSubjects ?? 0,
    totalPassed: primaryRecord?.totalPassed ?? 0,
    totalFailed: primaryRecord?.totalFailed ?? 0,
    totalInProgress: primaryStats?.inProgressCount ?? primaryRecord?.totalInProgress ?? 0,
    passRate: primaryStats?.passRate ?? 100,
    lastSyncAt: primaryRecord?.lastPulledAt ? primaryRecord.lastPulledAt.toISOString() : null,
    slink: slinkSummary,
    qlht: qlhtSummary,
  };
}
