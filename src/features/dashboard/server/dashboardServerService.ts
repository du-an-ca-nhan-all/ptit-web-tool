import { prisma } from '@/src/lib/prisma';
import { parseDateString } from '@/src/lib/date-utils';
import { checkIsAdmin, checkIsMonitor, getUserRoles } from '@/src/lib/auth';
import { getGlobalConfig, GLOBAL_CONFIG_KEYS, TelegramBotConfigValue } from '@/src/lib/globalConfig';
import { getStudentTimetableCalendar } from '@/src/features/external-portal/server/studentTimetableServerService';
import { getOrFetchStudentLmsOverview } from '@/src/features/external-portal/server/lmsServerService';
import { AnnouncementItem } from '@/src/features/announcements';
import { DashboardData, LmsDashboardSummary, StudentMonitorFlowSummary } from '../types/dashboard.types';

/**
 * Calculates time difference and exam status relative to now
 */
function parseExamDateTime(ngayThi?: string | null, gioThi?: string | null): Date | null {
  if (!ngayThi) return null;
  const baseDate = parseDateString(ngayThi);
  if (!baseDate) return null;

  if (gioThi) {
    const match = gioThi.trim().match(/^(\d{1,2})[gGhH:](\d{1,2})/);
    if (match) {
      const h = Number(match[1]);
      const m = Number(match[2]);
      if (!isNaN(h) && !isNaN(m)) {
        baseDate.setHours(h, m, 0, 0);
        return baseDate;
      }
    }
  }

  baseDate.setHours(7, 30, 0, 0); // Default morning exam slot
  return baseDate;
}

function parseSlinkRichStats(record: any) {
  if (!record) return null;
  let latestSemester: any = null;
  let totalSemesters = 0;
  const gradeDist = { aCount: 0, bCount: 0, cCount: 0, dCount: 0, fCount: 0 };
  let inProgressCount = record.totalInProgress || 0;

  if (record.rawData) {
    try {
      const raw = typeof record.rawData === 'string' ? JSON.parse(record.rawData) : record.rawData;
      const courses: any[] = Array.isArray(raw.courses) ? raw.courses : [];
      const semesters: any[] = Array.isArray(raw.semesters) ? raw.semesters : [];
      totalSemesters = semesters.length;

      // Find latest semester with grades
      if (semesters.length > 0) {
        const sorted = [...semesters].sort((a, b) => {
          const aKey = String(a.maHocKy || a.hocKy?.ma || '');
          const bKey = String(b.maHocKy || b.hocKy?.ma || '');
          return bKey.localeCompare(aKey, undefined, { numeric: true });
        });
        const sem = sorted[0];
        const semName = sem.hocKy?.ten || sem.tenHocKy || (sem.maHocKy ? `Học kỳ ${sem.maHocKy}` : undefined);
        const semGpa4 =
          sem.trungBinhHocKyThang4 !== undefined && sem.trungBinhHocKyThang4 !== null
            ? parseFloat(sem.trungBinhHocKyThang4)
            : undefined;
        const semGpa10 =
          sem.trungBinhHocKy !== undefined && sem.trungBinhHocKy !== null
            ? parseFloat(sem.trungBinhHocKy)
            : undefined;
        const semCredits =
          sem.tongSoTinChiHocKy || sem.tongSoTinChiDangKyHocKy || sem.tongSoTinChiTichLuyHocKy || 0;
        if (semName) {
          latestSemester = {
            name: semName,
            gpa4: semGpa4 !== undefined && !isNaN(semGpa4) ? semGpa4 : null,
            gpa10: semGpa10 !== undefined && !isNaN(semGpa10) ? semGpa10 : null,
            credits: Number(semCredits) || 0,
          };
        }
      }

      // Count grade distribution from courses
      for (const c of courses) {
        const letter = String(c.diemChuLan1 || c.diemChu || '').trim().toUpperCase();
        if (letter === 'A+' || letter === 'A') gradeDist.aCount++;
        else if (letter === 'B+' || letter === 'B') gradeDist.bCount++;
        else if (letter === 'C+' || letter === 'C') gradeDist.cCount++;
        else if (letter === 'D+' || letter === 'D') gradeDist.dCount++;
        else if (letter === 'F' || letter === 'KĐ' || letter === 'KHÔNG ĐẠT') gradeDist.fCount++;
        else if (!letter || letter === 'X' || letter === 'IN_PROGRESS' || letter === 'CHUA_CO')
          inProgressCount++;
      }
    } catch (e) {
      // Ignore parse error
    }
  }

  const passed = record.totalPassed || 0;
  const failed = record.totalFailed || 0;
  const total = record.totalSubjects || 0;
  const gradedTotal = passed + failed;
  const passRate = gradedTotal > 0 ? Math.round((passed / gradedTotal) * 100) : total > 0 ? 100 : 0;
  const regCredits = record.creditsReg || 0;
  const passedCredits = record.creditsPassed || record.creditsAcc || 0;
  const creditPassRate =
    regCredits > 0 ? Math.min(100, Math.round((passedCredits / regCredits) * 100)) : 100;

  return {
    latestSemester,
    totalSemesters,
    gradeDistribution:
      gradeDist.aCount + gradeDist.bCount + gradeDist.cCount + gradeDist.dCount + gradeDist.fCount > 0
        ? gradeDist
        : null,
    passRate,
    creditPassRate,
    inProgressCount,
  };
}

function parseQlhtRichStats(record: any) {
  if (!record) return null;
  let latestSemester: any = null;
  let totalSemesters = 0;
  const gradeDist = { aCount: 0, bCount: 0, cCount: 0, dCount: 0, fCount: 0 };
  let inProgressCount = record.totalInProgress || 0;

  if (record.rawData) {
    try {
      const raw = typeof record.rawData === 'string' ? JSON.parse(record.rawData) : record.rawData;
      const semesters: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw.semesters)
        ? raw.semesters
        : Array.isArray(raw.ds_diem_hoc_ky)
        ? raw.ds_diem_hoc_ky
        : [];
      totalSemesters = semesters.length;

      if (semesters.length > 0) {
        const sem = semesters[semesters.length - 1] || semesters[0];
        const semName = sem.ten_hoc_ky || (sem.hoc_ky ? `Học kỳ ${sem.hoc_ky}` : undefined);
        const semGpa4 =
          sem.diem_tb_hk_he_4 !== undefined && sem.diem_tb_hk_he_4 !== null
            ? parseFloat(sem.diem_tb_hk_he_4)
            : undefined;
        const semGpa10 =
          sem.diem_tb_hk_he_10 !== undefined && sem.diem_tb_hk_he_10 !== null
            ? parseFloat(sem.diem_tb_hk_he_10)
            : undefined;
        const semCredits = sem.so_tin_chi_hk || sem.so_tin_chi_dat_hk || 0;
        if (semName) {
          latestSemester = {
            name: semName,
            gpa4: semGpa4 !== undefined && !isNaN(semGpa4) ? semGpa4 : null,
            gpa10: semGpa10 !== undefined && !isNaN(semGpa10) ? semGpa10 : null,
            credits: Number(semCredits) || 0,
          };
        }

        // Loop over all courses in all semesters
        for (const s of semesters) {
          const courses: any[] = Array.isArray(s.ds_diem_mon_hoc)
            ? s.ds_diem_mon_hoc
            : Array.isArray(s.courses)
            ? s.courses
            : [];
          for (const c of courses) {
            const letter = String(c.diem_tk_chu || c.letterGrade || '').trim().toUpperCase();
            if (letter === 'A+' || letter === 'A') gradeDist.aCount++;
            else if (letter === 'B+' || letter === 'B') gradeDist.bCount++;
            else if (letter === 'C+' || letter === 'C') gradeDist.cCount++;
            else if (letter === 'D+' || letter === 'D') gradeDist.dCount++;
            else if (letter === 'F' || letter === 'KĐ' || letter === 'KHÔNG ĐẠT') gradeDist.fCount++;
            else if (!letter || letter === 'N/A' || letter === '-') inProgressCount++;
          }
        }
      }
    } catch (e) {
      // Ignore JSON parse error
    }
  }

  const passed = record.totalPassed || 0;
  const failed = record.totalFailed || 0;
  const total = record.totalSubjects || 0;
  const gradedTotal = passed + failed;
  const passRate = gradedTotal > 0 ? Math.round((passed / gradedTotal) * 100) : total > 0 ? 100 : 0;
  const regCredits = record.creditsReg || 0;
  const passedCredits = record.creditsPassed || record.creditsAcc || 0;
  const creditPassRate =
    regCredits > 0 ? Math.min(100, Math.round((passedCredits / regCredits) * 100)) : 100;

  return {
    latestSemester,
    totalSemesters,
    gradeDistribution:
      gradeDist.aCount + gradeDist.bCount + gradeDist.cCount + gradeDist.dCount + gradeDist.fCount > 0
        ? gradeDist
        : null,
    passRate,
    creditPassRate,
    inProgressCount,
  };
}

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
  const qldttxAccount = user.externalAccounts?.find(
    (a) => a.systemKey === 'QLDTTX_PTTC1' || (a.systemUrl && a.systemUrl.includes('qldttx'))
  );
  const lmsAccount = user.externalAccounts?.find(
    (a) => a.systemKey === 'LMS_PTTC1' || (a.systemUrl && a.systemUrl.includes('lms.pttc1.edu.vn'))
  );
  const slinkAccount = user.externalAccounts?.find(
    (a) => a.systemKey === 'SLINK_PTIT' || (a.systemUrl && a.systemUrl.includes('slink.ptit.edu.vn'))
  );

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

  const classMonitorPromise =
    isMonitor && studentLop
      ? Promise.all([
          prisma.student.count({ where: { maLop: studentLop } }),
          prisma.user.count({
            where: {
              student: { maLop: studentLop },
              passwordHash: { notIn: ['', 'NONE', 'null', 'undefined'] },
            },
          }),
          prisma.examRecord.findMany({
            where: {
              student: { maLop: studentLop },
              ...(activeBatch ? { batchCode: activeBatch.code } : {}),
            },
            distinct: ['maSV'],
            select: { maSV: true },
          }),
          prisma.roomEnvelopeConfirmation.count({
            where: { assignedClass: studentLop },
          }),
        ]).then(([totalClassStudents, activeAccountsCount, studentsWithExams, envelopesAssigned]) => ({
          isMonitor,
          classCode: studentLop,
          totalClassStudents,
          activeAccountsCount,
          studentsWithExamsCount: studentsWithExams.length,
          envelopesAssignedCount: envelopesAssigned,
          totalClassRoomsCount: envelopesAssigned,
        }))
      : Promise.resolve(undefined);

  const adminHealthPromise = isAdmin
    ? (async () => {
        const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000);
        const [
          totalStudents,
          totalUsers,
          totalActiveBatches,
          pendingRegistrationsCount,
          telegramBotConfig,
          recentActivityLogsCount,
        ] = await Promise.all([
          prisma.student.count(),
          prisma.user.count({
            where: {
              passwordHash: { notIn: ['', 'NONE', 'null', 'undefined'] },
            },
          }),
          prisma.examBatch.count({ where: { isActive: true } }),
          prisma.registrationRequest.count({ where: { status: 'PENDING' } }),
          getGlobalConfig<TelegramBotConfigValue>(GLOBAL_CONFIG_KEYS.TELEGRAM_BOT),
          prisma.activityLog.count({ where: { createdAt: { gte: oneDayAgo } } }),
        ]);

        return {
          isAdmin: true,
          totalStudents,
          totalUsers,
          totalActiveBatches,
          pendingRegistrationsCount,
          isTelegramBotConfigured: Boolean(telegramBotConfig && telegramBotConfig.botToken),
          telegramBotUsername: telegramBotConfig?.botUsername || null,
          recentActivityLogsCount,
          activeBatchName: activeBatch?.name || null,
        };
      })()
    : Promise.resolve(undefined);

  const announcementsPromise = prisma.announcement.findMany({
    where: {
      isActive: true,
      OR: [
        { targetRole: 'ALL' },
        { targetRole: user.role },
        ...roles.map((r) => ({ targetRole: r })),
      ],
      AND: [
        {
          OR: [{ targetClass: null }, { targetClass: '' }, ...(studentLop ? [{ targetClass: studentLop }] : [])],
        },
        {
          OR: [{ startDate: null }, { startDate: { lte: now } }],
        },
        {
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
      ],
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    take: 5,
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

  // Parse & sort upcoming exams
  const parsedExamsList = rawExams.map((ex) => {
    const examDt = parseExamDateTime(ex.ngayThi, ex.gioThi);
    const diffMs = examDt ? examDt.getTime() - now.getTime() : -1;
    const isPassed = diffMs < 0;
    const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const daysLeft = Math.floor(diffSeconds / (24 * 3600));
    const hoursLeft = Math.floor((diffSeconds % (24 * 3600)) / 3600);
    const minutesLeft = Math.floor((diffSeconds % 3600) / 60);

    const isToday =
      examDt !== null &&
      examDt.getDate() === now.getDate() &&
      examDt.getMonth() === now.getMonth() &&
      examDt.getFullYear() === now.getFullYear();

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      examDt !== null &&
      examDt.getDate() === tomorrow.getDate() &&
      examDt.getMonth() === tomorrow.getMonth() &&
      examDt.getFullYear() === tomorrow.getFullYear();

    return {
      id: ex.id,
      subjectCode: ex.maMH || '',
      subjectName: ex.tenMH || 'Môn thi chưa rõ',
      examDate: ex.ngayThi || '',
      examTime: ex.gioThi || '',
      room: ex.mapThi || 'Chưa xếp phòng',
      examGroup: ex.nhomHoc || ex.toThi || '',
      examFormat: ex.maHTThi || '',
      studentGroup: ex.nhomThi || '',
      isPostponed: Boolean(ex.isPostponed),
      batchName: ex.examBatch?.name || ex.tenDotThi || '',
      examDateTime: examDt,
      diffMs,
      daysLeft,
      hoursLeft,
      minutesLeft,
      isToday,
      isTomorrow,
      isPassed,
      isoDateTime: examDt ? examDt.toISOString() : undefined,
    };
  });

  // Filter future non-passed exams, prioritize non-postponed
  const futureExams = parsedExamsList
    .filter((e) => !e.isPassed)
    .sort((a, b) => {
      if (a.isPostponed !== b.isPostponed) {
        return a.isPostponed ? 1 : -1;
      }
      return (a.examDateTime?.getTime() || 0) - (b.examDateTime?.getTime() || 0);
    });

  const nextExamItem = futureExams[0];

  const nextExam = {
    hasExam: Boolean(nextExamItem),
    exam: nextExamItem,
    totalUpcomingExams: futureExams.length,
  };

  const upcomingExams = futureExams.map((e) => ({
    id: e.id,
    subjectCode: e.subjectCode,
    subjectName: e.subjectName,
    examDate: e.examDate,
    examTime: e.examTime,
    room: e.room,
    examGroup: e.examGroup,
    examFormat: e.examFormat,
    studentGroup: e.studentGroup,
    isPostponed: e.isPostponed,
  }));

  // Academic Summary (supporting both PTIT S-Link & Cổng QLDTTX / QLHT)
  const slinkRecord = user.slinkGradeRecord;
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

  const gradeRecord = user.gradeRecord;
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
  const academicSummary = {
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

  // Timetable & Schedule Summary
  let timetableSummary = {
    hasData: false,
    semesterName: undefined as string | undefined,
    totalSubjects: 0,
    totalEvents: 0,
    todayEvents: [] as any[],
    upcomingEvents: [] as any[],
    lastSyncAt: null as string | null,
  };

  if (timetableRes && timetableRes.success && Array.isArray(timetableRes.events) && timetableRes.events.length > 0) {
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;

    const todayEvts = timetableRes.events
      .filter((e) => e.date === todayIso)
      .map((e) => ({
        id: e.id,
        date: e.date,
        dayOfWeekStr: e.dayOfWeekStr,
        subjectName: e.subjectName,
        subjectCode: e.subjectCode,
        group: e.group,
        classCode: e.classCode,
        periodStr: e.periodStr,
        startTime: e.startTime,
        endTime: e.endTime,
        room: e.room,
        onlineLink: e.onlineLink,
        lecturer: e.lecturer,
        shift: e.shift,
        isToday: true,
      }));

    const upcomingEvts = timetableRes.events
      .filter((e) => e.date > todayIso)
      .slice(0, 5)
      .map((e) => ({
        id: e.id,
        date: e.date,
        dayOfWeekStr: e.dayOfWeekStr,
        subjectName: e.subjectName,
        subjectCode: e.subjectCode,
        group: e.group,
        classCode: e.classCode,
        periodStr: e.periodStr,
        startTime: e.startTime,
        endTime: e.endTime,
        room: e.room,
        onlineLink: e.onlineLink,
        lecturer: e.lecturer,
        shift: e.shift,
        isToday: false,
      }));

    timetableSummary = {
      hasData: true,
      semesterName: timetableRes.semesterName,
      totalSubjects: timetableRes.uniqueSubjectsCount,
      totalEvents: timetableRes.totalEvents,
      todayEvents: todayEvts,
      upcomingEvents: upcomingEvts,
      lastSyncAt: timetableRes.lastSyncAt,
    };
  }

  // External Account Status (QLDTTX)
  const externalAccountStatus = {
    isConfigured: Boolean(qldttxAccount),
    isConnected: qldttxAccount?.status === 'CONNECTED',
    lastSyncAt: qldttxAccount?.lastSyncAt ? qldttxAccount.lastSyncAt.toISOString() : null,
    systemName: qldttxAccount?.systemName || 'Cổng QLDTTX (PTTC1)',
  };

  // LMS Account Status & Learning Progress Summary
  const lmsAccountStatus = {
    isConfigured: Boolean(lmsAccount),
    isConnected: lmsAccount?.status === 'CONNECTED',
    lastSyncAt: lmsAccount?.lastSyncAt ? lmsAccount.lastSyncAt.toISOString() : null,
    systemName: lmsAccount?.systemName || 'Hệ thống học tập trực tuyến (LMS PTTC1)',
  };

  // S-Link Account Status
  const slinkAccountStatus = {
    isConfigured: Boolean(slinkAccount),
    isConnected: slinkAccount?.status === 'CONNECTED',
    lastSyncAt: slinkAccount?.lastSyncAt ? slinkAccount.lastSyncAt.toISOString() : null,
    systemName: slinkAccount?.systemName || 'Cổng Thông Tin PTIT S-Link',
  };

  let lmsSummary: LmsDashboardSummary | undefined = undefined;
  if (lmsAccount && lmsData && lmsData.isConfigured !== false) {
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

    lmsSummary = {
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

  // Telegram Sync Status
  const telConfig = user.telegramConfig;
  const telegramStatus = {
    isConfigured: Boolean(telConfig && telConfig.chatId),
    isEnabled: Boolean(telConfig?.isEnabled),
    chatId: telConfig?.chatId,
    botUsername: telConfig?.botUsername || null,
  };

  // Student Monitor Flow Summary (Nếu SV được cấu hình Flow theo Lớp trưởng)
  let studentMonitorFlowSummary: StudentMonitorFlowSummary | undefined = undefined;
  if (followerFlowConfig) {
    const [monitorStudent, recentQueueItem] = await Promise.all([
      prisma.student.findUnique({
        where: { maSV: followerFlowConfig.monitorUsername },
        select: { maSV: true, hoTen: true, ten: true, maLop: true, soDienThoai: true },
      }),
      prisma.monitorFlowQueueItem.findFirst({
        where: {
          followerUsername: user.username,
          monitorUsername: followerFlowConfig.monitorUsername,
        },
        orderBy: { createdAt: 'desc' },
        select: {
          flowAction: true,
          ma_mon: true,
          ten_mon: true,
          nhom_to: true,
          status: true,
          resultMessage: true,
          createdAt: true,
          finishedAt: true,
        },
      }),
    ]);

    studentMonitorFlowSummary = {
      isConfigured: true,
      isEnabled: followerFlowConfig.isEnabled,
      classCode: followerFlowConfig.classCode,
      monitorUsername: followerFlowConfig.monitorUsername,
      monitorFullName:
        monitorStudent?.hoTen || monitorStudent?.ten || followerFlowConfig.monitorUsername,
      monitorPhone: monitorStudent?.soDienThoai || undefined,
      allowRegisterCourse: followerFlowConfig.allowRegisterCourse,
      allowCancelCourse: followerFlowConfig.allowCancelCourse,
      autoSyncOnAction: followerFlowConfig.autoSyncOnAction,
      note: followerFlowConfig.note,
      lastActionAt: followerFlowConfig.lastActionAt
        ? followerFlowConfig.lastActionAt.toISOString()
        : null,
      lastActionType: followerFlowConfig.lastActionType,
      lastActionResult: followerFlowConfig.lastActionResult,
      lastActionMessage: followerFlowConfig.lastActionMessage,
      isExternalAccountReady: qldttxAccount?.status === 'CONNECTED',
      recentQueueItem: recentQueueItem
        ? {
            flowAction: recentQueueItem.flowAction,
            ma_mon: recentQueueItem.ma_mon,
            ten_mon: recentQueueItem.ten_mon,
            nhom_to: recentQueueItem.nhom_to,
            status: recentQueueItem.status,
            resultMessage: recentQueueItem.resultMessage,
            createdAt: recentQueueItem.createdAt.toISOString(),
            finishedAt: recentQueueItem.finishedAt ? recentQueueItem.finishedAt.toISOString() : null,
          }
        : null,
    };
  }

  // Map Active Announcements
  const activeAnnouncements: AnnouncementItem[] = announcementsList.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    type: a.type as any,
    displayMode: a.displayMode as any,
    targetRole: a.targetRole as any,
    targetClass: a.targetClass,
    linkUrl: a.linkUrl,
    linkText: a.linkText,
    isPinned: a.isPinned,
    isActive: a.isActive,
    startDate: a.startDate ? a.startDate.toISOString() : null,
    endDate: a.endDate ? a.endDate.toISOString() : null,
    author: a.author,
    viewCount: a.viewCount,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

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
    activeBatch: activeBatch
      ? {
          id: activeBatch.id,
          code: activeBatch.code,
          name: activeBatch.name,
          semester: activeBatch.semester,
          academicYear: activeBatch.academicYear,
          startDate: activeBatch.startDate,
          endDate: activeBatch.endDate,
          isActive: activeBatch.isActive,
          description: activeBatch.description,
          createdAt: activeBatch.createdAt.toISOString(),
          updatedAt: activeBatch.updatedAt.toISOString(),
        }
      : null,
  };
}
