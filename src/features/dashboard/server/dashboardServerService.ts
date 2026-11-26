import { prisma } from '@/src/lib/prisma';
import { checkIsAdmin, checkIsMonitor, getUserRoles } from '@/src/lib/auth';
import { getStudentTimetableCalendar } from '@/src/features/external-portal/server/studentTimetableServerService';
import { getOrFetchStudentLmsOverview } from '@/src/features/external-portal/server/lmsServerService';
import { DashboardData } from '../types/dashboard.types';
import { buildAcademicSummary } from './dashboard-server-service/academicSummary';
import { buildExamSummaries } from './dashboard-server-service/examSummary';
import { buildTimetableSummary } from './dashboard-server-service/timetableSummary';
import { buildLmsSummary } from './dashboard-server-service/lmsSummary';
import {
  buildAccountStatuses,
  findExternalAccounts,
  mapActiveBatch,
} from './dashboard-server-service/accountStatusMappers';
import {
  fetchActiveAnnouncements,
  fetchAdminSystemHealth,
  fetchClassMonitorSummary,
  fetchStudentMonitorFlowSummary,
  mapActiveAnnouncements,
} from './dashboard-server-service/dashboardQueries';

export async function getDashboardData(
  username: string,
  requestedRole?: string | null
): Promise<DashboardData | null> {
  const cleanUsername = username.trim().toUpperCase();

  // 1. Fetch user profile & active batch concurrently
  const [user, activeBatch] = await Promise.all([
    prisma.user.findUnique({
      where: { username: cleanUsername },
      include: {
        student: true,
        gradeRecord: true,
        slinkGradeRecord: true,
        telegramConfig: true,
        externalAccounts: true,
      },
    }),
    prisma.examBatch.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!user) return null;

  const allRoles = getUserRoles(user.role);
  const effectiveRole =
    requestedRole && allRoles.includes(requestedRole) ? requestedRole : user.role;
  const isAdmin = checkIsAdmin(effectiveRole);
  const isMonitor = checkIsMonitor(effectiveRole);
  const roles = allRoles;
  const studentLop = user.student?.maLop || null;
  const now = new Date();

  // 2. Prepare personal exam records filter
  const whereExam: any = { maSV: cleanUsername };
  if (activeBatch) {
    whereExam.OR = [
      { batchCode: activeBatch.code },
      { maDotThi: activeBatch.code },
      { batchCode: null },
    ];
  }

  // Account checks
  const { qldttxAccount, lmsAccount, slinkAccount } = findExternalAccounts(user.externalAccounts);

  // 3. Define concurrent background tasks
  const rawExamsPromise = prisma.examRecord.findMany({
    where: whereExam,
    include: { examBatch: true },
  });

  const timetablePromise = getStudentTimetableCalendar(cleanUsername, { forceRefresh: false }).catch(
    (err) => {
      console.warn('[getDashboardData] Lỗi đọc TKB sinh viên:', err);
      return null;
    }
  );

  const lmsPromise = lmsAccount
    ? getOrFetchStudentLmsOverview(cleanUsername, { forceRefresh: false }).catch((err) => {
        console.warn('[getDashboardData] Lỗi đọc dữ liệu LMS sinh viên:', err);
        return null;
      })
    : Promise.resolve(null);

  const classMonitorPromise = fetchClassMonitorSummary(isMonitor, studentLop, activeBatch);
  const adminHealthPromise = fetchAdminSystemHealth(isAdmin, activeBatch);
  const announcementsPromise = fetchActiveAnnouncements({
    userRole: user.role,
    roles,
    studentLop,
    now,
  });

  const followerFlowConfigPromise = prisma.monitorFlowConfig.findFirst({
    where: {
      followerUsername: user.username,
    },
    orderBy: [{ isEnabled: 'desc' }, { updatedAt: 'desc' }],
  });

  // 4. Await all concurrent tasks
  const [
    rawExams,
    timetableRes,
    lmsData,
    classMonitorSummary,
    adminSystemHealth,
    announcementsList,
    followerFlowConfig,
  ] = await Promise.all([
    rawExamsPromise,
    timetablePromise,
    lmsPromise,
    classMonitorPromise,
    adminHealthPromise,
    announcementsPromise,
    followerFlowConfigPromise,
  ]);

  const { nextExam, upcomingExams } = buildExamSummaries(rawExams, now);
  const academicSummary = buildAcademicSummary({
    slinkRecord: user.slinkGradeRecord,
    gradeRecord: user.gradeRecord,
    slinkAccount,
    qldttxAccount,
  });
  const timetableSummary = buildTimetableSummary(timetableRes, now);
  const { externalAccountStatus, lmsAccountStatus, slinkAccountStatus, telegramStatus } =
    buildAccountStatuses({
      qldttxAccount,
      lmsAccount,
      slinkAccount,
      telConfig: user.telegramConfig,
    });
  const lmsSummary = buildLmsSummary(lmsAccount, lmsData);

  // Student Monitor Flow Summary (Nếu SV được cấu hình Flow theo Lớp trưởng)
  const studentMonitorFlowSummary = await fetchStudentMonitorFlowSummary({
    username: user.username,
    followerFlowConfig,
    qldttxAccount,
  });

  const activeAnnouncements = mapActiveAnnouncements(announcementsList);

  return {
    user: {
      id: user.id,
      username: user.username,
      role: effectiveRole,
      roles,
      isAdmin,
      isMonitor,
      fullName: user.student?.hoTen || user.student?.ten || user.username,
      phoneNumber: user.student?.soDienThoai || undefined,
      lop: user.student?.maLop || undefined,
    },
    nextExam,
    upcomingExams,
    academicSummary,
    timetableSummary,
    lmsSummary,
    classMonitorSummary,
    studentMonitorFlowSummary,
    adminSystemHealth,
    externalAccountStatus,
    lmsAccountStatus,
    slinkAccountStatus,
    telegramStatus,
    activeAnnouncements,
    activeBatch: mapActiveBatch(activeBatch),
  };
}
