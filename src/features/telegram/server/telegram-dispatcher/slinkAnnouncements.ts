import { prisma } from '@/src/lib/prisma';
import { sendTelegramMessage, resolveEffectiveBotToken } from '../telegramServerService';
import {
  getSlinkNotifications,
  refreshAndPersistSlinkAccountToken,
  markSlinkNotificationAsRead,
  cleanHtml,
  formatSlinkDate,
  escapeTelegramHtml,
} from '@/src/features/external-portal/server/slinkServerService';
import { parseDateString } from '@/src/lib/date-utils';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function isOlderThanThreeDays(rawDate: any): boolean {
  if (!rawDate) return false;
  const notifDate = parseDateString(rawDate);
  if (!notifDate || isNaN(notifDate.getTime())) return false;
  return Date.now() - notifDate.getTime() > THREE_DAYS_MS;
}

async function markSlinkReadSafely(token: string, notifId: string): Promise<boolean> {
  try {
    await markSlinkNotificationAsRead(token, notifId, 'ONE');
    return true;
  } catch (markErr: any) {
    console.warn(`[checkAndDispatchSlinkAnnouncements] Đánh dấu đã đọc thông báo S-Link (${notifId}) thất bại:`, markErr?.message);
    return false;
  }
}

async function processSingleSlinkAnnouncement(params: {
  sub: any;
  ann: any;
  token: string;
  effectiveToken: string;
  intervalHours: number;
  forceCheck?: boolean;
}): Promise<{ dispatched: boolean; markedRead: boolean }> {
  const { sub, ann, token, effectiveToken, intervalHours, forceCheck } = params;
  if (ann.read === true || ann.isRead === true) return { dispatched: false, markedRead: false };

  const notifId = String(ann.id || ann._id || '');
  if (!notifId) return { dispatched: false, markedRead: false };

  const rawDate = ann.createdAt || ann.created_at || ann.publishDate || ann.publishedAt || ann.date;
  if (isOlderThanThreeDays(rawDate)) return { dispatched: false, markedRead: false };

  const key = { username: sub.username, announcementId: notifId };
  const alreadyLogged = await prisma.slinkAnnouncementLog.findUnique({
    where: { username_announcementId: key },
  });
  if (alreadyLogged && !forceCheck) return { dispatched: false, markedRead: false };

  const studentName = sub.user?.student?.hoTen || sub.username;
  const cleanTitle = cleanHtml(ann.title || 'Thông báo mới từ PTIT S-Link');
  const cleaned = cleanHtml(ann.content || ann.description || '');
  const cleanSummary = cleaned ? (cleaned.length > 400 ? cleaned.slice(0, 400) + '...' : cleaned) : '';
  const senderDisplay = cleanHtml(ann.senderName || ann.sender || 'Cổng PTIT S-Link');
  const dateDisplay = formatSlinkDate(ann.createdAt || rawDate);

  const messageHtml = `📢 <b>THÔNG BÁO MỚI TỪ PTIT S-LINK</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${escapeTelegramHtml(studentName)}</b> (<code>${escapeTelegramHtml(sub.username)}</code>)\n📌 <b>${escapeTelegramHtml(cleanTitle)}</b>\n\n${cleanSummary ? `📝 <i>${escapeTelegramHtml(cleanSummary)}</i>\n\n` : ''}🏛️ Đơn vị gửi: <b>${escapeTelegramHtml(senderDisplay)}</b>\n🗓️ Thời gian: <b>${escapeTelegramHtml(dateDisplay)}</b>\n🔗 <a href="https://slink.ptit.edu.vn/">Mở cổng PTIT S-Link</a>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Tự động quét định kỳ: ${intervalHours} tiếng/lần</i>`;

  const sendRes = await sendTelegramMessage({
    botToken: effectiveToken,
    chatId: sub.chatId,
    text: messageHtml,
    options: { threadId: sub.threadId ? Number(sub.threadId) : undefined },
  });
  if (!sendRes.success) return { dispatched: false, markedRead: false };

  await prisma.slinkAnnouncementLog.upsert({
    where: { username_announcementId: key },
    create: {
      username: sub.username,
      announcementId: notifId,
      title: ann.title,
      publishDate: ann.createdAt || (rawDate ? String(rawDate) : undefined),
    },
    update: { sentAt: new Date() },
  });

  const markedRead = await markSlinkReadSafely(token, notifId);
  return { dispatched: true, markedRead };
}

async function processSlinkSubscriber(params: {
  sub: any;
  forceCheck?: boolean;
}): Promise<{ checked: boolean; dispatched: number; markedRead: number; error?: string }> {
  const { sub, forceCheck } = params;
  const intervalHours = sub.slinkCheckInterval || 2;
  if (!forceCheck && sub.lastSlinkCheckedAt) {
    const elapsedHours = (Date.now() - new Date(sub.lastSlinkCheckedAt).getTime()) / (1000 * 60 * 60);
    if (elapsedHours < intervalHours) return { checked: false, dispatched: 0, markedRead: 0 };
  }

  const extAccount = await prisma.externalAccount.findFirst({
    where: {
      username: sub.username,
      OR: [{ systemKey: 'SLINK_PTIT' }, { systemUrl: { contains: 'slink.ptit.edu.vn' } }],
    },
  });
  if (!extAccount || (!extAccount.refreshToken && !extAccount.token)) {
    return { checked: false, dispatched: 0, markedRead: 0 };
  }

  try {
    const { token } = await refreshAndPersistSlinkAccountToken(extAccount);
    const notifRes = await getSlinkNotifications({ accessToken: token, page: 1, limit: 30, unreadOnly: true });
    const rawAnnouncements = notifRes?.data?.result || [];
    const announcements = rawAnnouncements.filter((ann: any) => ann && !ann.read && !ann.isRead);

    if (announcements.length === 0) {
      await prisma.telegramConfig
        .update({ where: { id: sub.id }, data: { lastSlinkCheckedAt: new Date() } })
        .catch((err) => console.warn('[slinkAnnouncements] Non-fatal async error:', err));
      return { checked: true, dispatched: 0, markedRead: 0 };
    }

    const effectiveToken = await resolveEffectiveBotToken(sub.botToken)
      .then((res) => res.token)
      .catch(() => null);
    if (!effectiveToken) return { checked: true, dispatched: 0, markedRead: 0 };

    let dispatched = 0;
    let markedRead = 0;
    for (const ann of announcements) {
      const res = await processSingleSlinkAnnouncement({ sub, ann, token, effectiveToken, intervalHours, forceCheck });
      if (res.dispatched) dispatched++;
      if (res.markedRead) markedRead++;
    }

    await prisma.telegramConfig
      .update({ where: { id: sub.id }, data: { lastSlinkCheckedAt: new Date() } })
      .catch((err) => console.warn('[slinkAnnouncements] Non-fatal async error:', err));

    return { checked: true, dispatched, markedRead };
  } catch (err: any) {
    return { checked: true, dispatched: 0, markedRead: 0, error: `${sub.username}: ${err.message}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.5 PTIT S-LINK ANNOUNCEMENTS: KIỂM TRA THÔNG BÁO MỚI TỪ CỔNG S-LINK (https://slink.ptit.edu.vn/)
// VÀ TỰ ĐỘNG ĐÁNH DẤU LÀ ĐÃ ĐỌC SAU KHI GỬI THÀNH CÔNG VỀ TELEGRAM
// ─────────────────────────────────────────────────────────────────────────────
export async function checkAndDispatchSlinkAnnouncements(options: {
  username?: string;
  forceCheck?: boolean;
} = {}) {
  try {
    const whereCond: any = { isEnabled: true, notifySlinkAnnouncements: true };
    if (options.username) whereCond.username = options.username;

    const subscribers = await prisma.telegramConfig.findMany({
      where: whereCond,
      include: { user: { include: { student: true } } },
    });

    let totalChecked = 0;
    let totalAnnouncementsDispatched = 0;
    let totalMarkedRead = 0;
    const errors: string[] = [];

    for (const sub of subscribers) {
      const result = await processSlinkSubscriber({ sub, forceCheck: options.forceCheck });
      if (result.checked) totalChecked++;
      totalAnnouncementsDispatched += result.dispatched;
      totalMarkedRead += result.markedRead;
      if (result.error) errors.push(result.error);
    }

    return {
      success: true,
      totalSubscribers: subscribers.length,
      totalChecked,
      totalAnnouncementsDispatched,
      totalMarkedRead,
      errors: errors.slice(0, 5),
    };
  } catch (err: any) {
    console.error('checkAndDispatchSlinkAnnouncements error:', err);
    return {
      success: false,
      error: err.message || 'Lỗi khi kiểm tra thông báo PTIT S-Link',
    };
  }
}
