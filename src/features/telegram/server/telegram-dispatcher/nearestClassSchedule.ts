import { prisma } from '@/src/lib/prisma';
import { sendTelegramMessage, resolveEffectiveBotToken } from '../telegramServerService';
import { DOW_NAMES } from './constants';
import { formatDateVN, getVietnamTime } from './dateUtils';
import { getStudentAllSemesterSessions, getStudentClassSessionsForDate } from './timetableSessions';
import type { NearestClassScheduleResult } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// 8. SCAN NEAREST UPCOMING CLASS IN 10 DAYS (QUÉT LỊCH HỌC GẦN NHẤT TRONG 10 NGÀY TỚI)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Quét tìm ngày học gần nhất có trong maxDays ngày tới (mặc định 10 ngày)
 * Sử dụng rawList từ API QLDTTX để quét toàn bộ ngày trong 1 lần gọi duy nhất.
 */
export async function findNearestStudentClassSchedule(
  username: string,
  maxDays: number = 10,
  options: {
    includeTodayIfEnded?: boolean;
    cachedRawList?: any[];
  } = {}
): Promise<NearestClassScheduleResult> {
  const nowVN = getVietnamTime();
  const nowMinutesToday = nowVN.getHours() * 60 + nowVN.getMinutes();

  // Lấy danh sách TKB học kỳ qua API QLDTTX (hoặc dùng cached nếu đã truyền)
  const rawList = options.cachedRawList || (await getStudentAllSemesterSessions(username));

  for (let offset = 0; offset <= maxDays; offset++) {
    const checkDate = new Date(nowVN.getFullYear(), nowVN.getMonth(), nowVN.getDate() + offset);
    const sessions = await getStudentClassSessionsForDate(username, checkDate, rawList);

    if (sessions && sessions.length > 0) {
      if (offset === 0 && !options.includeTodayIfEnded) {
        // Kiểm tra xem hôm nay còn ca học nào chưa kết thúc không
        const hasUpcomingSession = sessions.some((s) => {
          const sessionEndMinutes = s.startMinutes + ((s.endPeriod - s.startPeriod + 1) * 45 || 135);
          return sessionEndMinutes >= nowMinutesToday;
        });

        // Nếu hôm nay tất cả các ca học đều đã qua thì tiếp tục tìm các ngày kế tiếp trong 10 ngày tới
        if (!hasUpcomingSession) {
          continue;
        }
      }

      const dateStr = formatDateVN(checkDate);
      const dowName = DOW_NAMES[checkDate.getDay()];
      return {
        found: true,
        maxDays,
        date: checkDate,
        dateStr,
        dowName,
        dayOffset: offset,
        sessions,
      };
    }
  }

  return {
    found: false,
    maxDays,
  };
}

/**
 * Quét lịch học gần nhất trong 10 ngày tới và gửi thông báo Telegram
 * Tự động gọi API QLDTTX để lấy dữ liệu mới nhất.
 */
export async function dispatchNearestClassScheduleNotification(options: {
  username?: string;
  maxDays?: number;
  forceSend?: boolean;
} = {}) {
  try {
    const maxDays = options.maxDays || 10;
    const nowVN = getVietnamTime();

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

    if (subscribers.length === 0) {
      return {
        success: true,
        totalSubscribers: 0,
        totalSent: 0,
        message: 'Không tìm thấy tài khoản nào bật nhận thông báo lịch học Telegram.',
      };
    }

    let sentCount = 0;
    let notFoundCount = 0;
    const results: any[] = [];
    const errors: string[] = [];

    for (const sub of subscribers) {
      const studentName = sub.user?.student?.hoTen || sub.username;
      const classCode = sub.user?.student?.maLop || 'Chưa cập nhật';

      // 1. Gọi API QLDTTX lấy TKB học kỳ
      const rawSemesterList = await getStudentAllSemesterSessions(sub.username);

      // 2. Tìm ngày học gần nhất
      const nearest = await findNearestStudentClassSchedule(sub.username, maxDays, {
        cachedRawList: rawSemesterList,
      });

      let effectiveToken: string;
      try {
        const resolved = await resolveEffectiveBotToken(sub.botToken);
        effectiveToken = resolved.token;
      } catch (e: any) {
        errors.push(`${sub.username}: ${e.message}`);
        continue;
      }

      // 3. Nếu không có lịch học trong 10 ngày tới
      if (!nearest.found || !nearest.sessions || nearest.sessions.length === 0) {
        notFoundCount++;
        if (options.forceSend) {
          const empty10DaysMsg = `📚 <b>[LỊCH HỌC 10 NGÀY TỚI] THỜI KHÓA BIỂU PTIT</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${sub.username}</code>)\n🏫 Lớp: <b>${classCode}</b>\n\n📌 <i>Đã quét thời khóa biểu cổng trường: Trong ${maxDays} ngày tới bạn không có ca học nào trên hệ thống.</i>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Quét lúc: ${nowVN.toLocaleTimeString('vi-VN')} - ${nowVN.toLocaleDateString('vi-VN')}</i>`;

          const sendRes = await sendTelegramMessage({
            botToken: effectiveToken,
            chatId: sub.chatId,
            text: empty10DaysMsg,
            options: {
              threadId: sub.threadId ? Number(sub.threadId) : undefined,
            },
          });

          if (sendRes.success) {
            sentCount++;
          } else if (sendRes.error) {
            errors.push(`${sub.username}: ${sendRes.error}`);
          }
        }

        results.push({
          username: sub.username,
          found: false,
          message: `Không có ca học nào trong ${maxDays} ngày tới`,
        });
        continue;
      }

      // 4. Nếu có lịch học gần nhất -> Gửi thông báo chi tiết
      const offsetText =
        nearest.dayOffset === 0
          ? 'HÔM NAY'
          : nearest.dayOffset === 1
          ? 'NGÀY MAI'
          : `sau ${nearest.dayOffset} ngày nữa`;

      let sessionListHtml = '';
      nearest.sessions.forEach((ses, idx) => {
        sessionListHtml += `\n<b>${idx + 1}️⃣ ${ses.subjectName}</b> (<code>${ses.subjectCode}</code>)\n   ⏰ Thời gian: <b>${ses.startTime} - ${ses.endTime}</b> (<i>${ses.periodStr}</i>)\n   🚪 Phòng học: <b>${ses.room || 'Phòng học môn'}</b> ${ses.group ? `(Tổ: ${ses.group})` : ''}${ses.onlineLink ? `\n   🔗 Link học: <a href="${ses.onlineLink}">Tham gia trực tuyến</a>` : ''}\n`;
      });

      const messageHtml = `📚 <b>[LỊCH HỌC GẦN NHẤT] THỜI KHÓA BIỂU PTIT</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${sub.username}</code>)\n🏫 Lớp: <b>${classCode}</b>\n🗓️ Ngày học gần nhất: <b>${nearest.dowName}, ngày ${nearest.dateStr}</b> (<i>${offsetText}</i>)\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📋 <b>DANH SÁCH CA HỌC (${nearest.sessions.length} ca):</b>${sessionListHtml}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🔔 <i>Hệ thống tự động quét lịch học trong ${maxDays} ngày tới. Chúc bạn học tập tốt!</i>\n⏰ <i>Quét lúc: ${nowVN.toLocaleTimeString('vi-VN')} - ${nowVN.toLocaleDateString('vi-VN')}</i>`;

      const sendRes = await sendTelegramMessage({
        botToken: effectiveToken,
        chatId: sub.chatId,
        text: messageHtml,
        options: {
          threadId: sub.threadId ? Number(sub.threadId) : undefined,
        },
      });

      if (sendRes.success) {
        sentCount++;
        results.push({
          username: sub.username,
          found: true,
          dateStr: nearest.dateStr,
          dowName: nearest.dowName,
          dayOffset: nearest.dayOffset,
          sessionsCount: nearest.sessions.length,
          sessions: nearest.sessions,
        });
      } else {
        errors.push(`${sub.username}: ${sendRes.error}`);
      }
    }

    return {
      success: true,
      maxDays,
      totalSubscribers: subscribers.length,
      totalSent: sentCount,
      notFoundCount,
      results,
      errors: errors.slice(0, 10),
    };
  } catch (err: any) {
    console.error('dispatchNearestClassScheduleNotification error:', err);
    return {
      success: false,
      error: err.message || 'Lỗi khi quét lịch học gần nhất',
    };
  }
}
