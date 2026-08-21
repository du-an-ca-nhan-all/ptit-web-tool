import { prisma } from '@/src/lib/prisma';
import { parseDateString } from '@/src/lib/date-utils';
import { checkIsAdmin, checkIsMonitor, getUserRoles } from '@/src/lib/auth';
import { getGlobalConfig, GLOBAL_CONFIG_KEYS, TelegramBotConfigValue } from '@/src/lib/globalConfig';
import { getStudentTimetableCalendar } from '@/src/features/external-portal/server/studentTimetableServerService';
import { AnnouncementItem } from '@/src/features/announcements';
import { DashboardData } from '../types/dashboard.types';

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

export async function getDashboardData(username: string): Promise<DashboardData | null> {
  const cleanUsername = username.trim().toUpperCase();

  // 1. Fetch user & student profile
  const user = await prisma.user.findUnique({
    where: { username: cleanUsername },
    include: {
      student: true,
      gradeRecord: true,
      telegramConfig: true,
      externalAccounts: {
        where: { systemKey: 'QLDTTX_PTTC1' },
      },
    },
  });

  if (!user) return null;

  const isAdmin = checkIsAdmin(user.role);
  const isMonitor = checkIsMonitor(user.role);
  const roles = getUserRoles(user.role);
  const studentLop = user.student?.maLop || null;

  // 2. Fetch active exam batch
  const activeBatch = await prisma.examBatch.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  // 3. Fetch personal exam records
  const whereExam: any = { maSV: cleanUsername };
  if (activeBatch) {
    whereExam.OR = [
      { batchCode: activeBatch.code },
      { maDotThi: activeBatch.code },
      { batchCode: null },
    ];
  }

  const rawExams = await prisma.examRecord.findMany({
    where: whereExam,
    include: { examBatch: true },
  });

  // Parse & sort upcoming exams
  const now = new Date();
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

  // 4. Academic Summary
  const gradeRecord = user.gradeRecord;
  const academicSummary = {
    hasData: Boolean(gradeRecord),
    gpa10: gradeRecord?.gpa10 ?? null,
    gpa4: gradeRecord?.gpa4 ?? null,
    creditsAccumulated: gradeRecord?.creditsAcc ?? 0,
    creditsPassed: gradeRecord?.creditsPassed ?? 0,
    creditsRegistered: gradeRecord?.creditsReg ?? 0,
    classification: gradeRecord?.classification ?? null,
    totalSubjects: gradeRecord?.totalSubjects ?? 0,
    totalPassed: gradeRecord?.totalPassed ?? 0,
    totalFailed: gradeRecord?.totalFailed ?? 0,
    lastSyncAt: gradeRecord?.lastPulledAt ? gradeRecord.lastPulledAt.toISOString() : null,
  };

  // 5. Timetable & Schedule Summary
  let timetableSummary = {
    hasData: false,
    semesterName: undefined as string | undefined,
    totalSubjects: 0,
    totalEvents: 0,
    todayEvents: [] as any[],
    upcomingEvents: [] as any[],
    lastSyncAt: null as string | null,
  };

  try {
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;

    const timetableRes = await getStudentTimetableCalendar(cleanUsername, { forceRefresh: false });
    if (timetableRes && timetableRes.success && Array.isArray(timetableRes.events) && timetableRes.events.length > 0) {
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
  } catch (err) {
    console.warn('[getDashboardData] Lỗi đọc TKB sinh viên:', err);
  }

  // 6. External Account Status
  const extAccount = user.externalAccounts?.[0];
  const externalAccountStatus = {
    isConfigured: Boolean(extAccount),
    isConnected: extAccount?.status === 'CONNECTED',
    lastSyncAt: extAccount?.lastSyncAt ? extAccount.lastSyncAt.toISOString() : null,
    systemName: extAccount?.systemName || 'Cổng QLDTTX (PTTC1)',
  };

  // 6. Telegram Sync Status
  const telConfig = user.telegramConfig;
  const telegramStatus = {
    isConfigured: Boolean(telConfig && telConfig.chatId),
    isEnabled: Boolean(telConfig?.isEnabled),
    chatId: telConfig?.chatId,
    botUsername: telConfig?.botUsername || null,
  };

  // 7. Class Monitor Summary (STRICTLY only for users with lop_truong role)
  let classMonitorSummary = undefined;
  if (isMonitor && studentLop) {
    const [totalClassStudents, activeAccountsCount, studentsWithExams, envelopesAssigned] =
      await Promise.all([
        prisma.student.count({ where: { maLop: studentLop } }),
        prisma.user.count({
          where: {
            student: { maLop: studentLop },
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
      ]);

    classMonitorSummary = {
      isMonitor,
      classCode: studentLop,
      totalClassStudents,
      activeAccountsCount,
      studentsWithExamsCount: studentsWithExams.length,
      envelopesAssignedCount: envelopesAssigned,
      totalClassRoomsCount: envelopesAssigned,
    };
  }

  // 8. Admin System Health (if Admin)
  let adminSystemHealth = undefined;
  if (isAdmin) {
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
      prisma.user.count(),
      prisma.examBatch.count({ where: { isActive: true } }),
      prisma.registrationRequest.count({ where: { status: 'PENDING' } }),
      getGlobalConfig<TelegramBotConfigValue>(GLOBAL_CONFIG_KEYS.TELEGRAM_BOT),
      prisma.activityLog.count({ where: { createdAt: { gte: oneDayAgo } } }),
    ]);

    adminSystemHealth = {
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
  }

  // 9. Active Announcements
  const announcementsList = await prisma.announcement.findMany({
    where: {
      isActive: true,
      OR: [
        { targetRole: 'ALL' },
        { targetRole: user.role },
        ...(roles.map((r) => ({ targetRole: r }))),
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
      role: user.role,
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
    classMonitorSummary,
    adminSystemHealth,
    externalAccountStatus,
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
