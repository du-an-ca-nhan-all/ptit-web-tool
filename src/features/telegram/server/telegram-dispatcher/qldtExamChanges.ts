import { prisma } from '@/src/lib/prisma';
import { getTelegramAdminConfig } from '@/src/lib/globalConfig';
import { sendTelegramMessage, resolveEffectiveBotToken } from '../telegramServerService';
import { getVietnamTime } from './dateUtils';
import type { QldtExamChangeItem } from './types';

async function notifySubscriberExamChange(params: {
  sub: any;
  username: string;
  userMessageHtml: string;
}): Promise<boolean> {
  const { sub, username, userMessageHtml } = params;
  if (!sub || !sub.isEnabled || sub.notifyExamSchedule === false) return false;
  try {
    const { token: effectiveToken } = await resolveEffectiveBotToken(sub.botToken);
    if (!effectiveToken || !sub.chatId) return false;
    const res = await sendTelegramMessage({
      botToken: effectiveToken,
      chatId: sub.chatId,
      text: userMessageHtml,
      options: { threadId: sub.threadId ? Number(sub.threadId) : undefined },
    });
    return res.success;
  } catch (subErr) {
    console.warn(`[TelegramDispatcher] Gửi báo đổi lịch thi cho ${username} thất bại:`, subErr);
    return false;
  }
}

async function notifyAdminExamChange(adminNoticeHtml: string): Promise<void> {
  try {
    const adminConfig = await getTelegramAdminConfig();
    if (!adminConfig || !adminConfig.isEnabled || !adminConfig.chatId) return;
    const { token: adminToken } = await resolveEffectiveBotToken(adminConfig.botToken || undefined);
    if (!adminToken) return;
    await sendTelegramMessage({
      botToken: adminToken,
      chatId: adminConfig.chatId,
      text: adminNoticeHtml,
      options: { threadId: adminConfig.threadId ? Number(adminConfig.threadId) : undefined },
    });
  } catch (caughtError) {
    console.warn(`[qldtExamChanges] Non-fatal error:`, caughtError);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. EVENT: QLDTTX PERSONAL EXAM SCHEDULE CHANGED (Khi phát hiện biến động lịch thi từ QLDTTX)
// ─────────────────────────────────────────────────────────────────────────────
export async function dispatchQldtExamScheduleChanges(params: {
  username: string;
  semesterName?: string;
  changes: QldtExamChangeItem[];
}) {
  try {
    const { username, semesterName, changes } = params;
    if (!changes || changes.length === 0) return { sent: false };

    const sub = await prisma.telegramConfig.findUnique({
      where: { username },
      include: { user: { include: { student: true } } },
    });

    const studentName = sub?.user?.student?.hoTen || username;
    const maLop = sub?.user?.student?.maLop || 'Chưa cập nhật';
    const nowVN = getVietnamTime();
    const timeStr = `${nowVN.getHours().toString().padStart(2, '0')}:${nowVN.getMinutes().toString().padStart(2, '0')} ${nowVN.getDate().toString().padStart(2, '0')}/${(nowVN.getMonth() + 1).toString().padStart(2, '0')}/${nowVN.getFullYear()}`;

    let changeListHtml = '';
    changes.forEach((c, idx) => {
      if (c.type === 'NEW') {
        changeListHtml += `\n\n${idx + 1}. 🆕 <b>[${c.maMon}] ${c.tenMon}</b> <i>(Môn thi mới xếp lịch)</i>`;
      } else if (c.type === 'CANCELLED') {
        changeListHtml += `\n\n${idx + 1}. ❌ <b>[${c.maMon}] ${c.tenMon}</b> <i>(Đã huỷ / rút khỏi lịch thi)</i>`;
      } else {
        changeListHtml += `\n\n${idx + 1}. 🔄 <b>[${c.maMon}] ${c.tenMon}</b> <i>(Thay đổi thông tin ca thi)</i>`;
      }

      c.diffs.forEach((d) => {
        if (c.type === 'NEW') {
          if (d.newVal) changeListHtml += `\n   • ${d.label}: <b>${d.newVal}</b>`;
        } else if (c.type === 'CANCELLED') {
          if (d.oldVal) changeListHtml += `\n   • ${d.label} trước đó: <s>${d.oldVal}</s>`;
        } else {
          changeListHtml += `\n   • ${d.label}: <s>${d.oldVal || 'Chưa có'}</s> ➡️ <b>${d.newVal || 'Chưa xếp'}</b>`;
        }
      });
    });

    const userMessageHtml = `⚠️ <b>BIẾN ĐỘNG LỊCH THI CÁ NHÂN TỪ CỔNG QLDTTX</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${username}</code>)\n🏫 Lớp: <b>${maLop}</b>\n🏷️ Học kỳ: <b>${semesterName || 'Học kỳ hiện tại'}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🔔 <i>Hệ thống tự động quét và phát hiện <b>${changes.length} biến động</b> trong lịch thi của bạn:</i>${changeListHtml}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Tự động phát hiện lúc: ${timeStr}</i>\n👉 <i>Vui lòng vào ứng dụng hoặc Cổng QLDTTX để kiểm tra lại phòng thi & giờ thi chính xác!</i>`;
    const userSent = await notifySubscriberExamChange({ sub, username, userMessageHtml });

    const adminNoticeHtml = `🔔 <b>[BIẾN ĐỘNG LỊCH THI QLDTTX] SINH VIÊN: ${username}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> | Lớp: <b>${maLop}</b>\n📊 Số môn biến động: <b>${changes.length}</b> môn${changeListHtml}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Thời gian quét: ${timeStr}</i>`;
    await notifyAdminExamChange(adminNoticeHtml);

    return { sent: userSent, totalChanges: changes.length };
  } catch (err: any) {
    console.error('[TelegramDispatcher] dispatchQldtExamScheduleChanges error:', err);
    return { sent: false, error: err.message };
  }
}
