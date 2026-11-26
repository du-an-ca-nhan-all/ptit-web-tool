import { prisma } from '@/src/lib/prisma';
import { sendTelegramMessage, resolveEffectiveBotToken } from '../telegramServerService';
import { fetchStudentAnnouncementsFromQLDTTX } from '@/src/features/external-portal/server/qldttxServerService';
import { cleanHtml, escapeTelegramHtml } from '@/src/features/external-portal/server/slinkServerService';
import { parseDateString } from '@/src/lib/date-utils';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isOldReadQldtAnnouncement(ann: any): boolean {
  if (!ann.publishDate || ann.isRead !== true) return false;
  const notifDate = parseDateString(ann.publishDate);
  if (!notifDate || isNaN(notifDate.getTime())) return false;
  return Date.now() - notifDate.getTime() > SEVEN_DAYS_MS;
}

function formatQldtPublishDate(publishDate?: string): string {
  if (!publishDate) return 'Gần đây';
  try {
    const d = new Date(publishDate);
    if (isNaN(d.getTime())) return publishDate;
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    return `${hh}:${mm} - ${dd}/${mo}/${d.getFullYear()}`;
  } catch {
    return publishDate;
  }
}

function buildQldtAnnouncementHtml(params: {
  studentName: string;
  username: string;
  ann: any;
  intervalHours: number;
}): string {
  const { studentName, username, ann, intervalHours } = params;
  const cleanTitle = cleanHtml(ann.title || 'Thông báo mới từ QLDTTX');
  const cleanedSummary = cleanHtml(ann.summary || ann.content || '');
  const cleanSummary = cleanedSummary
    ? cleanedSummary.length > 350
      ? cleanedSummary.slice(0, 350) + '...'
      : cleanedSummary
    : '';
  const senderDisplay = cleanHtml(ann.sender || 'Phòng Đào Tạo / Giảng Viên');
  const dateDisplay = formatQldtPublishDate(ann.publishDate);
  const unreadBadge = !ann.isRead ? ' 🔴 <i>(Chưa đọc)</i>' : '';
  const mustReadBadge = ann.isMustRead ? ' ⚠️ <b>(Bắt buộc xem)</b>' : '';

  return `📢 <b>THÔNG BÁO MỚI TỪ CỔNG QLDTTX (PTTC1)</b>${unreadBadge}${mustReadBadge}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${escapeTelegramHtml(studentName)}</b> (<code>${escapeTelegramHtml(username)}</code>)\n📌 <b>${escapeTelegramHtml(cleanTitle)}</b>\n\n${cleanSummary ? `📝 <i>${escapeTelegramHtml(cleanSummary)}</i>\n\n` : ''}🏛️ Đơn vị gửi: <b>${escapeTelegramHtml(senderDisplay)}</b>\n🗓️ Thời gian: <b>${escapeTelegramHtml(dateDisplay)}</b>\n🔗 <a href="https://qldttx.pttc1.edu.vn/#/xemthongbao">Xem chi tiết trên Cổng QLDTTX (/#/xemthongbao)</a>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Tự động quét định kỳ: ${intervalHours} tiếng/lần</i>`;
}

async function processSingleQldtAnnouncement(params: {
  sub: any;
  ann: any;
  effectiveToken: string;
  intervalHours: number;
}): Promise<boolean> {
  const { sub, ann, effectiveToken, intervalHours } = params;
  const key = { username: sub.username, announcementId: ann.id };
  const alreadyLogged = await prisma.qldtAnnouncementLog.findUnique({
    where: { username_announcementId: key },
  });
  if (alreadyLogged) return false;

  if (isOldReadQldtAnnouncement(ann)) {
    await prisma.qldtAnnouncementLog
      .upsert({
        where: { username_announcementId: key },
        create: { username: sub.username, announcementId: ann.id, title: ann.title, publishDate: ann.publishDate },
        update: {},
      })
      .catch((err) => console.warn('[qldtAnnouncements] Non-fatal async error:', err));
    return false;
  }

  const studentName = sub.user?.student?.hoTen || sub.username;
  const messageHtml = buildQldtAnnouncementHtml({ studentName, username: sub.username, ann, intervalHours });
  const sendRes = await sendTelegramMessage({
    botToken: effectiveToken,
    chatId: sub.chatId,
    text: messageHtml,
    options: { threadId: sub.threadId ? Number(sub.threadId) : undefined },
  });
  if (!sendRes.success) return false;

  await prisma.qldtAnnouncementLog.upsert({
    where: { username_announcementId: key },
    create: { username: sub.username, announcementId: ann.id, title: ann.title, publishDate: ann.publishDate },
    update: { sentAt: new Date() },
  });
  return true;
}

async function processQldtSubscriber(params: {
  sub: any;
  forceCheck?: boolean;
}): Promise<{ checked: boolean; dispatched: number; error?: string }> {
  const { sub, forceCheck } = params;
  const intervalHours = sub.qldtCheckInterval || 2;
  if (!forceCheck && sub.lastQldtCheckedAt) {
    const elapsedHours = (Date.now() - new Date(sub.lastQldtCheckedAt).getTime()) / (1000 * 60 * 60);
    if (elapsedHours < intervalHours) return { checked: false, dispatched: 0 };
  }

  const extAccount =
    (await prisma.externalAccount.findFirst({
      where: { username: sub.username.toUpperCase(), systemKey: 'QLDTTX_PTTC1' },
    })) || (await prisma.externalAccount.findFirst({ where: { username: sub.username } }));

  if (!extAccount || (!extAccount.extPassword && !extAccount.token)) {
    return { checked: false, dispatched: 0 };
  }

  try {
    const { announcements, newToken } = await fetchStudentAnnouncementsFromQLDTTX({
      username: extAccount.extUsername,
      password: extAccount.extPassword,
      token: extAccount.token,
    });

    if (newToken && newToken !== extAccount.token) {
      await prisma.externalAccount
        .update({
          where: { id: extAccount.id },
          data: {
            token: newToken,
            status: 'CONNECTED',
            lastSyncAt: new Date(),
            syncMessage: `Đã tự động làm mới Token QLDTTX lúc ${new Date().toLocaleTimeString('vi-VN')}`,
          },
        })
        .catch((err) => console.warn('[qldtAnnouncements] Non-fatal async error:', err));
    }

    if (!announcements || announcements.length === 0) {
      await prisma.telegramConfig
        .update({ where: { id: sub.id }, data: { lastQldtCheckedAt: new Date() } })
        .catch((err) => console.warn('[qldtAnnouncements] Non-fatal async error:', err));
      return { checked: true, dispatched: 0 };
    }

    const effectiveToken = await resolveEffectiveBotToken(sub.botToken)
      .then((res) => res.token)
      .catch(() => null);
    if (!effectiveToken) return { checked: true, dispatched: 0 };

    let dispatched = 0;
    for (const ann of announcements) {
      const sent = await processSingleQldtAnnouncement({ sub, ann, effectiveToken, intervalHours });
      if (sent) dispatched++;
    }

    await prisma.telegramConfig
      .update({ where: { id: sub.id }, data: { lastQldtCheckedAt: new Date() } })
      .catch((err) => console.warn('[qldtAnnouncements] Non-fatal async error:', err));

    return { checked: true, dispatched };
  } catch (err: any) {
    return { checked: true, dispatched: 0, error: `${sub.username}: ${err.message}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. QLDTTX ANNOUNCEMENTS: KIỂM TRA THÔNG BÁO MỚI TỪ CỔNG QLDTTX (/#/xemthongbao)
// ─────────────────────────────────────────────────────────────────────────────
export async function checkAndDispatchQldtAnnouncements(options: {
  username?: string;
  forceCheck?: boolean;
} = {}) {
  try {
    const whereCond: any = { isEnabled: true, notifyQldtAnnouncements: true };
    if (options.username) whereCond.username = options.username;

    const subscribers = await prisma.telegramConfig.findMany({
      where: whereCond,
      include: { user: { include: { student: true } } },
    });

    let totalChecked = 0;
    let totalAnnouncementsDispatched = 0;
    const errors: string[] = [];

    for (const sub of subscribers) {
      const result = await processQldtSubscriber({ sub, forceCheck: options.forceCheck });
      if (result.checked) totalChecked++;
      totalAnnouncementsDispatched += result.dispatched;
      if (result.error) errors.push(result.error);
    }

    return {
      success: true,
      totalSubscribers: subscribers.length,
      totalChecked,
      totalAnnouncementsDispatched,
      errors: errors.slice(0, 5),
    };
  } catch (err: any) {
    console.error('checkAndDispatchQldtAnnouncements error:', err);
    return {
      success: false,
      error: err.message || 'Lỗi khi kiểm tra thông báo QLDTTX',
    };
  }
}
