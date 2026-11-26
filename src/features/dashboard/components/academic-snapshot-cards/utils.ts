import { AcademicSourceSummary, AcademicSummary } from '../../types/dashboard.types';
import { getRelativeTimeVN } from '@/src/lib/date-utils';

// Standard graduation credits benchmark (~130 TC)
export const STANDARD_CREDITS_TARGET = 130;

export function buildSlinkData(academic: AcademicSummary): AcademicSourceSummary {
  return (
    academic?.slink || {
      source: 'SLINK',
      sourceName: 'PTIT S-Link',
      portalUrl: 'slink.ptit.edu.vn',
      hasData: false,
      gpa4: null,
      gpa10: null,
      creditsAccumulated: 0,
      creditsPassed: 0,
      creditsRegistered: 0,
      totalSubjects: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalInProgress: 0,
      passRate: 100,
      creditPassRate: 100,
      lastSyncAt: null,
      classification: null,
      totalSemesters: 0,
      latestSemester: null,
      gradeDistribution: null,
    }
  );
}

export function buildQlhtData(academic: AcademicSummary): AcademicSourceSummary {
  return (
    academic?.qlht || {
      source: 'QLHT',
      sourceName: 'Cổng QLDTTX (QLHT)',
      portalUrl: 'qldttx.pttc1.edu.vn',
      hasData: Boolean(academic?.hasData && !academic?.slink),
      gpa4: academic?.gpa4 ?? null,
      gpa10: academic?.gpa10 ?? null,
      creditsAccumulated: academic?.creditsAccumulated ?? 0,
      creditsPassed: academic?.creditsPassed ?? 0,
      creditsRegistered: academic?.creditsRegistered ?? 0,
      totalSubjects: academic?.totalSubjects ?? 0,
      totalPassed: academic?.totalPassed ?? 0,
      totalFailed: academic?.totalFailed ?? 0,
      totalInProgress: academic?.totalInProgress ?? 0,
      passRate: academic?.passRate ?? 100,
      creditPassRate: 100,
      lastSyncAt: academic?.lastSyncAt ?? null,
      classification: academic?.classification ?? null,
      totalSemesters: 0,
      latestSemester: null,
      gradeDistribution: null,
    }
  );
}

export function formatGpaValue(value: number | null | undefined): string {
  return value !== null && value !== undefined ? Number(value).toFixed(2) : '--';
}

export function formatOptionalGpa(value: number | null | undefined): string | null {
  return value !== null && value !== undefined ? Number(value).toFixed(2) : null;
}

export function getClassificationColor(cls?: string | null): string {
  if (!cls) return 'bg-slate-100 text-slate-700 border-slate-200';
  if (cls.includes('Xuất sắc')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (cls.includes('Giỏi')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (cls.includes('Khá')) return 'bg-sky-50 text-sky-700 border-sky-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

export function getSyncLabel(syncDate?: string | null): string {
  if (!syncDate) return 'Từ hệ thống';
  const rel = getRelativeTimeVN(syncDate);
  return rel ? `Đã đồng bộ ${rel}` : 'Đã đồng bộ gần đây';
}
