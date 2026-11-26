import { getOrFetchStudentLmsOverview } from '@/src/features/external-portal/server/lmsServerService';
import { LmsDashboardSummary } from '../../types/dashboard.types';

type LmsOverviewResult = Awaited<ReturnType<typeof getOrFetchStudentLmsOverview>> | null;

export function buildLmsSummary(
  lmsAccount: any,
  lmsData: LmsOverviewResult
): LmsDashboardSummary | undefined {
  if (!(lmsAccount && lmsData && lmsData.isConfigured !== false)) {
    return undefined;
  }

  const courses = lmsData.courses || [];
  const totalCourses = lmsData.stats?.enrolledCourses ?? courses.length;
  const completedCourses =
    lmsData.stats?.completedCourses ?? courses.filter((c) => c.progressPercent === 100).length;
  const inProgressCourses = courses.filter((c) => c.progressPercent > 0 && c.progressPercent < 100).length;
  const notStartedCourses = courses.filter((c) => c.progressPercent === 0).length;
  const completedActivities =
    lmsData.stats?.completedActivities ??
    courses.reduce((sum, c) => sum + (c.completedActivities || 0), 0);
  const dueActivities = lmsData.stats?.dueActivities ?? 0;
  const totalActivities = completedActivities + dueActivities;

  let overallProgressPercent = 0;
  if (totalActivities > 0) {
    overallProgressPercent = Math.min(100, Math.round((completedActivities / totalActivities) * 100));
  } else if (courses.length > 0) {
    const avgProgress = courses.reduce((sum, c) => sum + (c.progressPercent || 0), 0) / courses.length;
    overallProgressPercent = Math.min(100, Math.round(avgProgress));
  }

  // Highlight courses: prioritize in-progress courses (lowest progress first), then not started, then completed
  const highlightCourses = [...courses]
    .sort((a, b) => {
      const aInProg = a.progressPercent > 0 && a.progressPercent < 100;
      const bInProg = b.progressPercent > 0 && b.progressPercent < 100;
      if (aInProg && !bInProg) return -1;
      if (!aInProg && bInProg) return 1;
      if (a.progressPercent === 100 && b.progressPercent < 100) return 1;
      if (b.progressPercent === 100 && a.progressPercent < 100) return -1;
      return a.progressPercent - b.progressPercent;
    })
    .slice(0, 4);

  return {
    isConfigured: true,
    hasLinkedAccount: true,
    userFullName: lmsData.userFullName || undefined,
    totalCourses,
    completedCourses,
    inProgressCourses,
    notStartedCourses,
    completedActivities,
    dueActivities,
    totalActivities,
    overallProgressPercent,
    courses: courses.map((c) => ({
      id: c.id,
      courseCode: c.courseCode,
      courseName: c.courseName,
      fullName: c.fullName,
      progressPercent: c.progressPercent,
      completedActivities: c.completedActivities,
      totalActivities: c.totalActivities,
      grade: c.grade || null,
      isCompleted: c.isCompleted || c.progressPercent === 100,
      category: c.category,
      url: c.url,
    })),
    highlightCourses: highlightCourses.map((c) => ({
      id: c.id,
      courseCode: c.courseCode,
      courseName: c.courseName,
      fullName: c.fullName,
      progressPercent: c.progressPercent,
      completedActivities: c.completedActivities,
      totalActivities: c.totalActivities,
      grade: c.grade || null,
      isCompleted: c.isCompleted || c.progressPercent === 100,
      category: c.category,
      url: c.url,
    })),
    lastSyncAt: lmsData.lastSyncAt || null,
    isCachedDb: lmsData.isCachedDb,
    isLiveSync: lmsData.isLiveSync,
    syncWarning: lmsData.syncWarning,
  };
}
