import { prisma } from '@/src/lib/prisma';
import { sendTelegramMessage, resolveEffectiveBotToken } from '../telegramServerService';
import { DOW_NAMES } from './constants';
import { getVietnamTime, normalizeDateVN } from './dateUtils';
import { getStudentAllSemesterSessions, getStudentClassSessionsForDate } from './timetableSessions';
import {
  buildMorningSummaryMessage,
  buildPreClass30Message,
  buildPreClass60Message,
} from './classScheduleFormatters';

async function dispatchMorningSummaryIfNeeded(params: {
  sub: any;
  effectiveToken: string;
  studentName: string;
  todayDowName: string;
  todayStr: string;
  sessionsToday: any[];
  nowVN: Date;
  force: boolean;
}): Promise<{ sent: boolean; error?: string }> {
  const { sub, effectiveToken, studentName, todayDowName, todayStr, sessionsToday, nowVN, force } = params;
  const key = {
    username: sub.username,
    courseCode: 'DAILY_SUMMARY',
    reminderType: 'MORNING_DAILY_SUMMARY',
    targetDate: todayStr,
  };

  const morningLog = await prisma.classScheduleReminderLog.findUnique({
    where: { username_courseCode_reminderType_targetDate: key },
  });
  if (morningLog && !force) return { sent: false };

  const { morningMessage, sessionInfo } = buildMorningSummaryMessage({
    studentName,
    username: sub.username,
    todayDowName,
    todayStr,
    sessionsToday,
    classReminderBefore: sub.classReminderBefore,
    nowVN,
  });

  const sendRes = await sendTelegramMessage({
    botToken: effectiveToken,
    chatId: sub.chatId,
    text: morningMessage,
    options: { threadId: sub.threadId ? Number(sub.threadId) : undefined },
  });

  if (!sendRes.success) {
    return { sent: false, error: sendRes.error ? `${sub.username}: ${sendRes.error}` : undefined };
  }

  await prisma.classScheduleReminderLog.upsert({
    where: { username_courseCode_reminderType_targetDate: key },
    create: { ...key, sessionInfo },
    update: { sentAt: new Date(), sessionInfo },
  });
  return { sent: true };
}

async function dispatchPreClassAlertIfNeeded(params: {
  sub: any;
  effectiveToken: string;
  studentName: string;
  ses: any;
  todayStr: string;
  reminderType: 'BEFORE_CLASS_60M' | 'BEFORE_CLASS_30M';
  forcePreClassAlert?: boolean;
}): Promise<boolean> {
  const { sub, effectiveToken, studentName, ses, todayStr, reminderType, forcePreClassAlert } = params;
  const sessionKey = `${ses.subjectCode}_${ses.startPeriod}`;
  const key = { username: sub.username, courseCode: sessionKey, reminderType, targetDate: todayStr };

  const existingLog = await prisma.classScheduleReminderLog.findUnique({
    where: { username_courseCode_reminderType_targetDate: key },
  });
  if (existingLog && !forcePreClassAlert) return false;

  const text =
    reminderType === 'BEFORE_CLASS_60M'
      ? buildPreClass60Message({ studentName, username: sub.username, ses })
      : buildPreClass30Message({ studentName, username: sub.username, ses });

  const sendRes = await sendTelegramMessage({
    botToken: effectiveToken,
    chatId: sub.chatId,
    text,
    options: { threadId: sub.threadId ? Number(sub.threadId) : undefined },
  });
  if (!sendRes.success) return false;

  await prisma.classScheduleReminderLog.upsert({
    where: { username_courseCode_reminderType_targetDate: key },
    create: { ...key, sessionInfo: `${ses.startTime} - ${ses.room}` },
    update: { sentAt: new Date() },
  });
  return true;
}

async function processPreClassSessions(params: {
  sub: any;
  effectiveToken: string;
  studentName: string;
  sessionsToday: any[];
  nowMinutesToday: number;
  todayStr: string;
  forcePreClassAlert?: boolean;
}): Promise<number> {
  const { sub, effectiveToken, studentName, sessionsToday, nowMinutesToday, todayStr, forcePreClassAlert } = params;
  const reminderConfig = sub.classReminderBefore ?? 30;
  let sentCount = 0;

  for (const ses of sessionsToday) {
    const minutesUntilStart = ses.startMinutes - nowMinutesToday;

    const shouldCheck60M =
      (reminderConfig === 60 || reminderConfig === 0) &&
      ((minutesUntilStart > 30 && minutesUntilStart <= 65) || !!forcePreClassAlert);
    if (shouldCheck60M) {
      const sent = await dispatchPreClassAlertIfNeeded({
        sub,
        effectiveToken,
        studentName,
        ses,
        todayStr,
        reminderType: 'BEFORE_CLASS_60M',
        forcePreClassAlert,
      });
      if (sent) sentCount++;
    }

    const shouldCheck30M =
      (reminderConfig === 30 || reminderConfig === 0) &&
      ((minutesUntilStart > 0 && minutesUntilStart <= 35) || !!forcePreClassAlert);
    if (shouldCheck30M) {
      const sent = await dispatchPreClassAlertIfNeeded({
        sub,
        effectiveToken,
        studentName,
        ses,
        todayStr,
        reminderType: 'BEFORE_CLASS_30M',
        forcePreClassAlert,
      });
      if (sent) sentCount++;
    }
  }

  return sentCount;
}

/**
 * Quét và gửi thông báo lịch học (Sáng 7h-10h gửi tổng hợp & trước giờ học 30p/1h gửi nhắc nhở)
 * Hỗ trợ forceCheck để kiểm tra và gửi trực tiếp kết quả (dù có hay không có ca học) đến Telegram.
 */
export async function runClassScheduleReminders(options: {
  forceCheck?: boolean;
  username?: string;
  forceMorningSummary?: boolean;
  forcePreClassAlert?: boolean;
} = {}) {
  try {
    const nowVN = getVietnamTime();
    const todayStr = normalizeDateVN(
      `${String(nowVN.getDate()).padStart(2, '0')}/${String(nowVN.getMonth() + 1).padStart(2, '0')}/${nowVN.getFullYear()}`
    );
    const nowHourVN = nowVN.getHours();
    const nowMinutesToday = nowHourVN * 60 + nowVN.getMinutes();
    const todayDowName = DOW_NAMES[nowVN.getDay()];

    const whereCond: any = { isEnabled: true, notifyClassSchedule: true };
    if (options.username) whereCond.username = options.username;

    const subscribers = await prisma.telegramConfig.findMany({
      where: whereCond,
      include: { user: { include: { student: true } } },
    });

    let morningSummariesSent = 0;
    let preClassAlertsSent = 0;
    const errors: string[] = [];
    const isMorningWindow = (nowHourVN >= 7 && nowHourVN < 10) || options.forceMorningSummary || options.forceCheck;

    for (const sub of subscribers) {
      const studentName = sub.user?.student?.hoTen || sub.username;
      const rawSemesterList = await getStudentAllSemesterSessions(sub.username);
      const sessionsToday = await getStudentClassSessionsForDate(sub.username, nowVN, rawSemesterList);

      const effectiveToken = await resolveEffectiveBotToken(sub.botToken)
        .then((res) => res.token)
        .catch(() => null);
      if (!effectiveToken) continue;

      const morningRes = isMorningWindow
        ? await dispatchMorningSummaryIfNeeded({
            sub,
            effectiveToken,
            studentName,
            todayDowName,
            todayStr,
            sessionsToday,
            nowVN,
            force: !!(options.forceMorningSummary || options.forceCheck),
          })
        : { sent: false };
      morningSummariesSent += morningRes.sent ? 1 : 0;
      if (morningRes.error) errors.push(morningRes.error);

      if (sessionsToday.length === 0) continue;

      preClassAlertsSent += await processPreClassSessions({
        sub,
        effectiveToken,
        studentName,
        sessionsToday,
        nowMinutesToday,
        todayStr,
        forcePreClassAlert: options.forcePreClassAlert,
      });
    }

    return {
      success: true,
      timestampVN: nowVN.toLocaleString('vi-VN'),
      todayStr,
      todayDowName,
      morningSummariesSent,
      preClassAlertsSent,
      totalSubscribers: subscribers.length,
      errors: errors.slice(0, 10),
    };
  } catch (err: any) {
    console.error('runClassScheduleReminders error:', err);
    return {
      success: false,
      error: err.message || 'Lỗi khi quét nhắc lịch học',
    };
  }
}
