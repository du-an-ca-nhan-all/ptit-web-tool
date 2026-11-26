import { prisma } from '@/src/lib/prisma';
import { sendTelegramMessage, resolveEffectiveBotToken } from '../telegramServerService';
import { fetchStudentAnnouncementsFromQLDTTX } from '@/src/features/external-portal/server/qldttxServerService';
import { cleanHtml, escapeTelegramHtml } from '@/src/features/external-portal/server/slinkServerService';
import { parseDateString } from '@/src/lib/date-utils';

// ─────────────────────────────────────────────────────────────────────────────
// 6. QLDTTX ANNOUNCEMENTS: KIỂM TRA THÔNG BÁO MỚI TỪ CỔNG QLDTTX (/#/xemthongbao)
// ─────────────────────────────────────────────────────────────────────────────
export async function checkAndDispatchQldtAnnouncements(options: {
  username?: string;
  forceCheck?: boolean;
} = {}) {
  try {
    const whereCond: any = {
      isEnabled: true,
      notifyQldtAnnouncements: true,
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
    const errors: string[] = [];

    for (const sub of subscribers) {
      const intervalHours = sub.qldtCheckInterval || 2;

      // Check if enough time has elapsed
      if (!options.forceCheck && sub.lastQldtCheckedAt) {
        const elapsedHours = (Date.now() - new Date(sub.lastQldtCheckedAt).getTime()) / (1000 * 60 * 60);
        if (elapsedHours < intervalHours) {
          continue;
        }
      }

      // Find external account for QLDTTX
      const extAccount =
        (await prisma.externalAccount.findFirst({
          where: {
            username: sub.username.toUpperCase(),
            systemKey: 'QLDTTX_PTTC1',
          },
        })) ||
        (await prisma.externalAccount.findFirst({
          where: { username: sub.username },
        }));

      if (!extAccount || (!extAccount.extPassword && !extAccount.token)) {
        continue;
      }

      totalChecked++;

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
            .catch(() => {});
        }

        if (!announcements || announcements.length === 0) {
          // Update last check time
          await prisma.telegramConfig
            .update({
              where: { id: sub.id },
              data: { lastQldtCheckedAt: new Date() },
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
          // Check if already dispatched
          const alreadyLogged = await prisma.qldtAnnouncementLog.findUnique({
            where: {
              username_announcementId: {
                username: sub.username,
                announcementId: ann.id,
              },
            },
          });

          if (alreadyLogged) {
            continue;
          }

          // Bỏ qua các thông báo cũ đã đọc từ hơn 7 ngày trước để tránh gửi dồn dập lịch sử cũ
          const rawDate = ann.publishDate;
          if (rawDate && ann.isRead === true) {
            const notifDate = parseDateString(rawDate);
            if (notifDate && !isNaN(notifDate.getTime())) {
              const diffMs = Date.now() - notifDate.getTime();
              const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
              if (diffMs > SEVEN_DAYS_MS) {
                // Đánh dấu log để không xử lý lại
                await prisma.qldtAnnouncementLog
                  .upsert({
                    where: {
                      username_announcementId: {
                        username: sub.username,
                        announcementId: ann.id,
                      },
                    },
                    create: {
                      username: sub.username,
                      announcementId: ann.id,
                      title: ann.title,
                      publishDate: ann.publishDate,
                    },
                    update: {},
                  })
                  .catch(() => {});
                continue;
              }
            }
          }

          const studentName = sub.user?.student?.hoTen || sub.username;
          const cleanTitle = cleanHtml(ann.title || 'Thông báo mới từ QLDTTX');
          const rawSummary = ann.summary || ann.content || '';
          const cleanedSummary = cleanHtml(rawSummary);
          const cleanSummary = cleanedSummary
            ? cleanedSummary.length > 350
              ? cleanedSummary.slice(0, 350) + '...'
              : cleanedSummary
            : '';
          const senderDisplay = cleanHtml(ann.sender || 'Phòng Đào Tạo / Giảng Viên');

          // Định dạng ngày hiển thị
          let dateDisplay = 'Gần đây';
          if (ann.publishDate) {
            try {
              const d = new Date(ann.publishDate);
              if (!isNaN(d.getTime())) {
                const hh = String(d.getHours()).padStart(2, '0');
                const mm = String(d.getMinutes()).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const mo = String(d.getMonth() + 1).padStart(2, '0');
                const yy = d.getFullYear();
                dateDisplay = `${hh}:${mm} - ${dd}/${mo}/${yy}`;
              } else {
                dateDisplay = ann.publishDate;
              }
            } catch {
              dateDisplay = ann.publishDate;
            }
          }

          const unreadBadge = !ann.isRead ? ' 🔴 <i>(Chưa đọc)</i>' : '';
          const mustReadBadge = ann.isMustRead ? ' ⚠️ <b>(Bắt buộc xem)</b>' : '';

          const messageHtml = `📢 <b>THÔNG BÁO MỚI TỪ CỔNG QLDTTX (PTTC1)</b>${unreadBadge}${mustReadBadge}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${escapeTelegramHtml(studentName)}</b> (<code>${escapeTelegramHtml(sub.username)}</code>)\n📌 <b>${escapeTelegramHtml(cleanTitle)}</b>\n\n${cleanSummary ? `📝 <i>${escapeTelegramHtml(cleanSummary)}</i>\n\n` : ''}🏛️ Đơn vị gửi: <b>${escapeTelegramHtml(senderDisplay)}</b>\n🗓️ Thời gian: <b>${escapeTelegramHtml(dateDisplay)}</b>\n🔗 <a href="https://qldttx.pttc1.edu.vn/#/xemthongbao">Xem chi tiết trên Cổng QLDTTX (/#/xemthongbao)</a>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Tự động quét định kỳ: ${intervalHours} tiếng/lần</i>`;

          const sendRes = await sendTelegramMessage({
            botToken: effectiveToken,
            chatId: sub.chatId,
            text: messageHtml,
            options: {
              threadId: sub.threadId ? Number(sub.threadId) : undefined,
            },
          });

          if (sendRes.success) {
            totalAnnouncementsDispatched++;
            await prisma.qldtAnnouncementLog.upsert({
              where: {
                username_announcementId: {
                  username: sub.username,
                  announcementId: ann.id,
                },
              },
              create: {
                username: sub.username,
                announcementId: ann.id,
                title: ann.title,
                publishDate: ann.publishDate,
              },
              update: {
                sentAt: new Date(),
              },
            });
          }
        }

        // Update last checked at
        await prisma.telegramConfig
          .update({
            where: { id: sub.id },
            data: { lastQldtCheckedAt: new Date() },
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
