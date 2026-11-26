import { prisma } from '@/src/lib/prisma';
import { getGlobalConfig, GLOBAL_CONFIG_KEYS, TelegramBotConfigValue } from '@/src/lib/globalConfig';
import { AnnouncementItem } from '@/src/features/announcements';
import {
  AdminSystemHealth,
  ClassMonitorSummary,
  StudentMonitorFlowSummary,
} from '../../types/dashboard.types';

export async function fetchClassMonitorSummary(
  isMonitor: boolean,
  studentLop: string | null,
  activeBatch: { code: string } | null
): Promise<ClassMonitorSummary | undefined> {
  if (!(isMonitor && studentLop)) {
    return undefined;
  }

  const [totalClassStudents, activeAccountsCount, studentsWithExams, envelopesAssigned] =
    await Promise.all([
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
    ]);

  return {
    isMonitor,
    classCode: studentLop,
    totalClassStudents,
    activeAccountsCount,
    studentsWithExamsCount: studentsWithExams.length,
    envelopesAssignedCount: envelopesAssigned,
    totalClassRoomsCount: envelopesAssigned,
  };
}

export async function fetchAdminSystemHealth(
  isAdmin: boolean,
  activeBatch: { name: string } | null
): Promise<AdminSystemHealth | undefined> {
  if (!isAdmin) {
    return undefined;
  }

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
}

export function fetchActiveAnnouncements(params: {
  userRole: string;
  roles: string[];
  studentLop: string | null;
  now: Date;
}) {
  const { userRole, roles, studentLop, now } = params;
  return prisma.announcement.findMany({
    where: {
      isActive: true,
      OR: [
        { targetRole: 'ALL' },
        { targetRole: userRole },
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
}

export async function fetchStudentMonitorFlowSummary(params: {
  username: string;
  followerFlowConfig: any;
  qldttxAccount: any;
}): Promise<StudentMonitorFlowSummary | undefined> {
  const { username, followerFlowConfig, qldttxAccount } = params;
  if (!followerFlowConfig) {
    return undefined;
  }

  const [monitorStudent, recentQueueItem] = await Promise.all([
    prisma.student.findUnique({
      where: { maSV: followerFlowConfig.monitorUsername },
      select: { maSV: true, hoTen: true, ten: true, maLop: true, soDienThoai: true },
    }),
    prisma.monitorFlowQueueItem.findFirst({
      where: {
        followerUsername: username,
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

  return {
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

export function mapActiveAnnouncements(announcementsList: any[]): AnnouncementItem[] {
  return announcementsList.map((a) => ({
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
}
