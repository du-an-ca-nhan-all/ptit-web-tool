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

    const whereCond: any = {
      isEnabled: true,
      notifyClassSchedule: true,
    };
    if (options.username) {
      whereCond.username = options.username;
    }

    const subscribers = await prisma.telegramConfig.findMany({
      where: whereCond,
      include: {
        user: {
          include: {
            student: true,
          },
        },
      },
    });

    let morningSummariesSent = 0;
    let preClassAlertsSent = 0;
    const errors: string[] = [];

    // Is current time within the morning review window (7h00 -> 10h00 VN Time)?
    const isMorningWindow = (nowHourVN >= 7 && nowHourVN < 10) || options.forceMorningSummary || options.forceCheck;

    for (const sub of subscribers) {
      const studentName = sub.user?.student?.hoTen || sub.username;

      // 1. Gọi API QLDTTX để lấy TKB học kỳ
      const rawSemesterList = await getStudentAllSemesterSessions(sub.username);
      const sessionsToday = await getStudentClassSessionsForDate(sub.username, nowVN, rawSemesterList);

      let effectiveToken: string;
      try {
        const resolved = await resolveEffectiveBotToken(sub.botToken);
        effectiveToken = resolved.token;
      } catch {
        continue;
      }

      // ─────────────────────────────────────────────────────────────
      // 1. GỬI TỔNG HỢP LỊCH HỌC ĐẦU NGÀY (7h00 - 10h00 SÁNG HOẶC KIỂM TRA THỦ CÔNG)
      // Kể cả khi hôm nay không có ca học nào vẫn gửi thông báo báo không có ca học
      // ─────────────────────────────────────────────────────────────
      if (isMorningWindow) {
        const morningLog = await prisma.classScheduleReminderLog.findUnique({
          where: {
            username_courseCode_reminderType_targetDate: {
              username: sub.username,
              courseCode: 'DAILY_SUMMARY',
              reminderType: 'MORNING_DAILY_SUMMARY',
              targetDate: todayStr,
            },
          },
        });

        if (!morningLog || options.forceMorningSummary || options.forceCheck) {
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
            options: {
              threadId: sub.threadId ? Number(sub.threadId) : undefined,
            },
          });

          if (sendRes.success) {
            morningSummariesSent++;
            await prisma.classScheduleReminderLog.upsert({
              where: {
                username_courseCode_reminderType_targetDate: {
                  username: sub.username,
                  courseCode: 'DAILY_SUMMARY',
                  reminderType: 'MORNING_DAILY_SUMMARY',
                  targetDate: todayStr,
                },
              },
              create: {
                username: sub.username,
                courseCode: 'DAILY_SUMMARY',
                reminderType: 'MORNING_DAILY_SUMMARY',
                targetDate: todayStr,
                sessionInfo,
              },
              update: {
                sentAt: new Date(),
                sessionInfo,
              },
            });
          } else if (sendRes.error) {
            errors.push(`${sub.username}: ${sendRes.error}`);
          }
        }
      }

      // Nếu không có ca học nào trong hôm nay -> Bỏ qua bước nhắc trước giờ học
      if (sessionsToday.length === 0) {
        continue;
      }

      // ─────────────────────────────────────────────────────────────
      // 2. NHẮC NHỞ TRƯỚC GIỜ VÀO HỌC (30 PHÚT HOẶC 1 TIẾNG)
      // ─────────────────────────────────────────────────────────────
      const reminderConfig = sub.classReminderBefore ?? 30; // 30, 60 hoặc 0 (cả hai)

      for (const ses of sessionsToday) {
        const minutesUntilStart = ses.startMinutes - nowMinutesToday;
        const sessionKey = `${ses.subjectCode}_${ses.startPeriod}`;

        // Kiểm tra điều kiện nhắc 60 phút
        const shouldCheck60M =
          (reminderConfig === 60 || reminderConfig === 0) &&
          ((minutesUntilStart > 30 && minutesUntilStart <= 65) || options.forcePreClassAlert);

        if (shouldCheck60M) {
          const log60 = await prisma.classScheduleReminderLog.findUnique({
            where: {
              username_courseCode_reminderType_targetDate: {
                username: sub.username,
                courseCode: sessionKey,
                reminderType: 'BEFORE_CLASS_60M',
                targetDate: todayStr,
              },
            },
          });

          if (!log60 || options.forcePreClassAlert) {
            const preMessage60 = buildPreClass60Message({ studentName, username: sub.username, ses });
            const sendRes = await sendTelegramMessage({
              botToken: effectiveToken,
              chatId: sub.chatId,
              text: preMessage60,
              options: {
                threadId: sub.threadId ? Number(sub.threadId) : undefined,
              },
            });

            if (sendRes.success) {
              preClassAlertsSent++;
              await prisma.classScheduleReminderLog.upsert({
                where: {
                  username_courseCode_reminderType_targetDate: {
                    username: sub.username,
                    courseCode: sessionKey,
                    reminderType: 'BEFORE_CLASS_60M',
                    targetDate: todayStr,
                  },
                },
                create: {
                  username: sub.username,
                  courseCode: sessionKey,
                  reminderType: 'BEFORE_CLASS_60M',
                  targetDate: todayStr,
                  sessionInfo: `${ses.startTime} - ${ses.room}`,
                },
                update: {
                  sentAt: new Date(),
                },
              });
            }
          }
        }

        // Kiểm tra điều kiện nhắc 30 phút
        const shouldCheck30M =
          (reminderConfig === 30 || reminderConfig === 0) &&
          ((minutesUntilStart > 0 && minutesUntilStart <= 35) || options.forcePreClassAlert);

        if (shouldCheck30M) {
          const log30 = await prisma.classScheduleReminderLog.findUnique({
            where: {
              username_courseCode_reminderType_targetDate: {
                username: sub.username,
                courseCode: sessionKey,
                reminderType: 'BEFORE_CLASS_30M',
                targetDate: todayStr,
              },
            },
          });

          if (!log30 || options.forcePreClassAlert) {
            const preMessage30 = buildPreClass30Message({ studentName, username: sub.username, ses });
            const sendRes = await sendTelegramMessage({
              botToken: effectiveToken,
              chatId: sub.chatId,
              text: preMessage30,
              options: {
                threadId: sub.threadId ? Number(sub.threadId) : undefined,
              },
            });

            if (sendRes.success) {
              preClassAlertsSent++;
              await prisma.classScheduleReminderLog.upsert({
                where: {
                  username_courseCode_reminderType_targetDate: {
                    username: sub.username,
                    courseCode: sessionKey,
                    reminderType: 'BEFORE_CLASS_30M',
                    targetDate: todayStr,
                  },
                },
                create: {
                  username: sub.username,
                  courseCode: sessionKey,
                  reminderType: 'BEFORE_CLASS_30M',
                  targetDate: todayStr,
                  sessionInfo: `${ses.startTime} - ${ses.room}`,
                },
                update: {
                  sentAt: new Date(),
                },
              });
            }
          }
        }
      }
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
