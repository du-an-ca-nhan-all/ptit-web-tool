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

// ─────────────────────────────────────────────────────────────────────────────
// 6.5 PTIT S-LINK ANNOUNCEMENTS: KIỂM TRA THÔNG BÁO MỚI TỪ CỔNG S-LINK (https://slink.ptit.edu.vn/)
// VÀ TỰ ĐỘNG ĐÁNH DẤU LÀ ĐÃ ĐỌC SAU KHI GỬI THÀNH CÔNG VỀ TELEGRAM
// ─────────────────────────────────────────────────────────────────────────────
export async function checkAndDispatchSlinkAnnouncements(options: {
  username?: string;
  forceCheck?: boolean;
} = {}) {
  try {
    const whereCond: any = {
      isEnabled: true,
      notifySlinkAnnouncements: true,
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

    let totalChecked = 0;
    let totalAnnouncementsDispatched = 0;
    let totalMarkedRead = 0;
    const errors: string[] = [];

    for (const sub of subscribers) {
      const intervalHours = sub.slinkCheckInterval || 2;

      // Check if enough time has elapsed
      if (!options.forceCheck && sub.lastSlinkCheckedAt) {
        const elapsedHours = (Date.now() - new Date(sub.lastSlinkCheckedAt).getTime()) / (1000 * 60 * 60);
        if (elapsedHours < intervalHours) {
          continue;
        }
      }

      // Find S-Link external account
      const extAccount = await prisma.externalAccount.findFirst({
        where: {
          username: sub.username,
          OR: [
            { systemKey: 'SLINK_PTIT' },
            { systemUrl: { contains: 'slink.ptit.edu.vn' } },
          ],
        },
      });

      if (!extAccount || (!extAccount.refreshToken && !extAccount.token)) {
        continue;
      }

      totalChecked++;

      try {
        const { token } = await refreshAndPersistSlinkAccountToken(extAccount);

        // Chỉ lấy các thông báo đang CHƯA ĐỌC trên Cổng S-Link (unreadOnly = true)
        const notifRes = await getSlinkNotifications(token, 1, 30, true);
        const rawAnnouncements = notifRes?.data?.result || [];

        // Lọc kỹ lại đảm bảo chỉ gửi thông báo đang được đánh dấu là chưa đọc trên S-Link (!item.read)
        const announcements = rawAnnouncements.filter((ann: any) => ann && !ann.read && !ann.isRead);

        if (announcements.length === 0) {
          await prisma.telegramConfig
            .update({
              where: { id: sub.id },
              data: { lastSlinkCheckedAt: new Date() },
            })
            .catch(() => {});
          continue;
        }

        let effectiveToken: string;
        try {
          const resolved = await resolveEffectiveBotToken(sub.botToken);
          effectiveToken = resolved.token;
        } catch {
          continue;
        }

        for (const ann of announcements) {
          // Bỏ qua nếu thông báo đã được đánh dấu đọc trên S-Link
          if (ann.read === true || ann.isRead === true) {
            continue;
          }

          const notifId = String(ann.id || ann._id || '');
          if (!notifId) continue;

          // Bỏ qua thông báo nếu đã có từ hơn 3 ngày trước (> 3 ngày)
          const rawDate = ann.createdAt || ann.created_at || ann.publishDate || ann.publishedAt || ann.date;
          if (rawDate) {
            const notifDate = parseDateString(rawDate);
            if (notifDate && !isNaN(notifDate.getTime())) {
              const diffMs = Date.now() - notifDate.getTime();
              const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
              if (diffMs > THREE_DAYS_MS) {
                // Bỏ qua thông báo cũ hơn 3 ngày trước
                continue;
              }
            }
          }

          // Check if already dispatched
          const alreadyLogged = await prisma.slinkAnnouncementLog.findUnique({
            where: {
              username_announcementId: {
                username: sub.username,
                announcementId: notifId,
              },
            },
          });

          if (alreadyLogged && !options.forceCheck) {
            continue;
          }

          const studentName = sub.user?.student?.hoTen || sub.username;
          const cleanTitle = cleanHtml(ann.title || 'Thông báo mới từ PTIT S-Link');
          const rawContent = ann.content || ann.description || '';
          const cleaned = cleanHtml(rawContent);
          const cleanSummary = cleaned ? (cleaned.length > 400 ? cleaned.slice(0, 400) + '...' : cleaned) : '';
          const senderDisplay = cleanHtml(ann.senderName || ann.sender || 'Cổng PTIT S-Link');
          const dateDisplay = formatSlinkDate(ann.createdAt || rawDate);

          const messageHtml = `📢 <b>THÔNG BÁO MỚI TỪ PTIT S-LINK</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${escapeTelegramHtml(studentName)}</b> (<code>${escapeTelegramHtml(sub.username)}</code>)\n📌 <b>${escapeTelegramHtml(cleanTitle)}</b>\n\n${cleanSummary ? `📝 <i>${escapeTelegramHtml(cleanSummary)}</i>\n\n` : ''}🏛️ Đơn vị gửi: <b>${escapeTelegramHtml(senderDisplay)}</b>\n🗓️ Thời gian: <b>${escapeTelegramHtml(dateDisplay)}</b>\n🔗 <a href="https://slink.ptit.edu.vn/">Mở cổng PTIT S-Link</a>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Tự động quét định kỳ: ${intervalHours} tiếng/lần</i>`;

          const sendRes = await sendTelegramMessage(effectiveToken, sub.chatId, messageHtml, {
            threadId: sub.threadId ? Number(sub.threadId) : undefined,
          });

          if (sendRes.success) {
            totalAnnouncementsDispatched++;

            // 1. Lưu log để tránh gửi lặp
            await prisma.slinkAnnouncementLog.upsert({
              where: {
                username_announcementId: {
                  username: sub.username,
                  announcementId: notifId,
                },
              },
              create: {
                username: sub.username,
                announcementId: notifId,
                title: ann.title,
                publishDate: ann.createdAt || (rawDate ? String(rawDate) : undefined),
              },
              update: {
                sentAt: new Date(),
              },
            });

            // 2. Sau khi đã gửi thành công, tiến hành đánh dấu thông báo đó là đã đọc trên S-Link
            try {
              await markSlinkNotificationAsRead(token, notifId, 'ONE');
              totalMarkedRead++;
            } catch (markErr: any) {
              console.warn(`[checkAndDispatchSlinkAnnouncements] Đánh dấu đã đọc thông báo S-Link (${notifId}) thất bại:`, markErr?.message);
            }
          }
        }

        // Update last checked time
        await prisma.telegramConfig
          .update({
            where: { id: sub.id },
            data: { lastSlinkCheckedAt: new Date() },
          })
          .catch(() => {});
      } catch (err: any) {
        errors.push(`${sub.username}: ${err.message}`);
      }
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
