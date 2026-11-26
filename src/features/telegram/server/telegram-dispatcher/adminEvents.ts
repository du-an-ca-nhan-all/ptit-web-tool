import { getTelegramAdminConfig } from '@/src/lib/globalConfig';
import { sendTelegramMessage, resolveEffectiveBotToken } from '../telegramServerService';
import { getVietnamTime } from './dateUtils';

// ─────────────────────────────────────────────────────────────────────────────
// 8. EVENT: NEW USER REGISTRATION NOTIFICATION TO ADMIN (Dùng telegram_admin)
// ─────────────────────────────────────────────────────────────────────────────
export async function dispatchNewUserRegistered(params: {
  username: string;
  fullName: string;
  lop?: string | null;
  phoneNumber?: string | null;
  note?: string | null;
  status?: string;
  ip?: string | null;
}) {
  try {
    const adminConfig = await getTelegramAdminConfig();
    if (!adminConfig || !adminConfig.isEnabled || adminConfig.notifyOnNewUser === false || !adminConfig.chatId) {
      return { sent: false, reason: 'Admin telegram notification is disabled or not configured' };
    }

    const { token: effectiveToken } = await resolveEffectiveBotToken(adminConfig.botToken || undefined);
    if (!effectiveToken) {
      return { sent: false, reason: 'No effective telegram bot token found' };
    }

    const nowVN = getVietnamTime();
    const isAutoApproved = params.status === 'APPROVED' || (params.note && params.note.includes('Tự động duyệt'));
    const statusBadge = isAutoApproved
      ? '⚡ <b>TỰ ĐỘNG KÍCH HOẠT & LIÊN KẾT QLHT (Mật khẩu khớp Cổng QLDTTX)</b>'
      : params.status === 'APPROVED'
      ? '✅ <b>Đã được phê duyệt</b>'
      : '⏳ <b>Đang chờ Admin xét duyệt thủ công</b>';

    const messageHtml = `✨ <b>[THÔNG BÁO] ${isAutoApproved ? 'TỰ ĐỘNG KÍCH HOẠT TÀI KHOẢN MỚI' : 'CÓ NGƯỜI ĐĂNG KÝ TÀI KHOẢN MỚI'}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Họ và tên: <b>${params.fullName}</b>\n🎓 Mã sinh viên: <code>${params.username}</code>\n🏫 Lớp học: <b>${params.lop || 'Chưa phân lớp'}</b>\n📱 Số điện thoại: <code>${params.phoneNumber || 'Chưa cập nhật'}</code>\n📝 Trạng thái: ${statusBadge}\n${params.note ? `💬 Ghi chú: <i>${params.note}</i>\n` : ''}${params.ip ? `🌐 Địa chỉ IP: <code>${params.ip}</code>\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Thời gian: ${nowVN.toLocaleTimeString('vi-VN')} - ${nowVN.toLocaleDateString('vi-VN')}</i>\n🛡️ <i>Cổng quản trị PTIT EduSync</i>`;

    const sendRes = await sendTelegramMessage({
      botToken: effectiveToken,
      chatId: adminConfig.chatId,
      text: messageHtml,
      options: {
        threadId: adminConfig.threadId ? Number(adminConfig.threadId) : undefined,
      },
    });

    return { sent: sendRes.success, error: sendRes.error };
  } catch (err: any) {
    console.error('[TelegramDispatcher] dispatchNewUserRegistered error:', err);
    return { sent: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. EVENT: DATABASE BACKUP / EXPORT NOTIFICATION TO ADMIN (Dùng telegram_admin)
// ─────────────────────────────────────────────────────────────────────────────
export async function dispatchDatabaseExportOrBackup(params: {
  action: 'AUTO_BACKUP' | 'MANUAL_SNAPSHOT' | 'EXPORT_SQL' | 'EXPORT_JSON' | 'DOWNLOAD_BACKUP';
  filename?: string;
  fileSize?: number;
  adminUsername?: string;
  description?: string;
  tableStats?: Record<string, number>;
}) {
  try {
    const adminConfig = await getTelegramAdminConfig();
    if (!adminConfig || !adminConfig.isEnabled || adminConfig.notifyOnDbBackup === false || !adminConfig.chatId) {
      return { sent: false, reason: 'Backup notification is disabled' };
    }

    const { token: effectiveToken } = await resolveEffectiveBotToken(adminConfig.botToken || undefined);
    if (!effectiveToken) {
      return { sent: false, reason: 'No effective bot token' };
    }

    const nowVN = getVietnamTime();
    const actionTitles = {
      AUTO_BACKUP: '⏰ TỰ ĐỘNG SAO LƯU DATABASE ĐỊNH KỲ (10H SÁNG)',
      MANUAL_SNAPSHOT: '💾 TẠO BẢN SNAPSHOT SAO LƯU THỦ CÔNG',
      EXPORT_SQL: '📤 XUẤT TOÀN BỘ CƠ SỞ DỮ LIỆU SANG SQL DUMP (.sql)',
      EXPORT_JSON: '📤 XUẤT TOÀN BỘ CƠ SỞ DỮ LIỆU SANG JSON (.json)',
      DOWNLOAD_BACKUP: '📥 TẢI VỀ BẢN SAO LƯU CƠ SỞ DỮ LIỆU',
    };

    const actionTitle = actionTitles[params.action] || '💾 SAO LƯU & XUẤT DỮ LIỆU DATABASE';
    const sizeStr = params.fileSize ? `${(params.fileSize / 1024).toFixed(1)} KB` : '';

    let statsHtml = '';
    if (params.tableStats && Object.keys(params.tableStats).length > 0) {
      const topTables = Object.entries(params.tableStats).slice(0, 6);
      statsHtml =
        `\n📊 <b>Dung lượng dữ liệu chính:</b>\n` +
        topTables.map(([tbl, cnt]) => `   • ${tbl}: <b>${cnt.toLocaleString('vi-VN')}</b> bản ghi`).join('\n');
    }

    const messageHtml = `💾 <b>[HỆ THỐNG] ${actionTitle}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n${params.filename ? `📁 Tên file: <code>${params.filename}</code>\n` : ''}${sizeStr ? `📦 Kích thước: <b>${sizeStr}</b>\n` : ''}${params.adminUsername ? `👤 Người thực hiện: <b>${params.adminUsername}</b> (Admin)\n` : ''}${params.description ? `📝 Chi tiết: <i>${params.description}</i>\n` : ''}${statsHtml}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Thời gian: ${nowVN.toLocaleTimeString('vi-VN')} - ${nowVN.toLocaleDateString('vi-VN')}</i>\n🛡️ <i>Cơ sở dữ liệu PostgreSQL - PTIT EduSync</i>`;

    const sendRes = await sendTelegramMessage({
      botToken: effectiveToken,
      chatId: adminConfig.chatId,
      text: messageHtml,
      options: {
        threadId: adminConfig.threadId ? Number(adminConfig.threadId) : undefined,
      },
    });

    return { sent: sendRes.success, error: sendRes.error };
  } catch (err: any) {
    console.error('[TelegramDispatcher] dispatchDatabaseExportOrBackup error:', err);
    return { sent: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. EVENT: DATABASE RESTORE NOTIFICATION TO ADMIN (Dùng telegram_admin)
// ─────────────────────────────────────────────────────────────────────────────
export async function dispatchDatabaseRestore(params: {
  filename: string;
  adminUsername: string;
  format?: string;
  success: boolean;
  error?: string;
}) {
  try {
    const adminConfig = await getTelegramAdminConfig();
    if (!adminConfig || !adminConfig.isEnabled || adminConfig.notifyOnDbRestore === false || !adminConfig.chatId) {
      return { sent: false, reason: 'Restore notification is disabled' };
    }

    const { token: effectiveToken } = await resolveEffectiveBotToken(adminConfig.botToken || undefined);
    if (!effectiveToken) {
      return { sent: false, reason: 'No effective bot token' };
    }

    const nowVN = getVietnamTime();
    const statusStr = params.success ? '✅ PHỤC HỒI THÀNH CÔNG' : '❌ PHỤC HỒI THẤT BẠI';

    const messageHtml = `🔄 <b>[CẢNH BÁO] PHỤC HỒI CƠ SỞ DỮ LIỆU (DATABASE RESTORE)</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📁 File nguồn: <code>${params.filename}</code>\n👤 Quản trị viên: <b>${params.adminUsername}</b>\n🏷️ Định dạng: <b>${params.format || 'PostgreSQL'}</b>\n📊 Kết quả: <b>${statusStr}</b>\n${params.error ? `⚠️ Chi tiết lỗi: <code>${params.error}</code>\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Thời gian: ${nowVN.toLocaleTimeString('vi-VN')} - ${nowVN.toLocaleDateString('vi-VN')}</i>\n🛡️ <i>PTIT EduSync Security Monitor</i>`;

    const sendRes = await sendTelegramMessage({
      botToken: effectiveToken,
      chatId: adminConfig.chatId,
      text: messageHtml,
      options: {
        threadId: adminConfig.threadId ? Number(adminConfig.threadId) : undefined,
      },
    });

    return { sent: sendRes.success, error: sendRes.error };
  } catch (err: any) {
    console.error('[TelegramDispatcher] dispatchDatabaseRestore error:', err);
    return { sent: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. EVENT: EXAM BATCH IMPORT NOTIFICATION TO ADMIN (Dùng telegram_admin)
// ─────────────────────────────────────────────────────────────────────────────
export async function dispatchExamBatchImportedToAdmin(params: {
  batchCode: string;
  batchName: string;
  adminUsername: string;
  totalRecords: number;
  totalStudents: number;
}) {
  try {
    const adminConfig = await getTelegramAdminConfig();
    if (!adminConfig || !adminConfig.isEnabled || adminConfig.notifyOnExamBatchImport === false || !adminConfig.chatId) {
      return { sent: false, reason: 'Exam batch import notification is disabled' };
    }

    const { token: effectiveToken } = await resolveEffectiveBotToken(adminConfig.botToken || undefined);
    if (!effectiveToken) {
      return { sent: false, reason: 'No effective bot token' };
    }

    const nowVN = getVietnamTime();
    const messageHtml = `📥 <b>[THÔNG BÁO] IMPORT ĐỢT THI MỚI THÀNH CÔNG</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🏷️ Đợt thi: <b>${params.batchName}</b> (<code>${params.batchCode}</code>)\n👤 Người import: <b>${params.adminUsername}</b> (Admin)\n📊 Tổng số bản ghi thi: <b>${params.totalRecords.toLocaleString('vi-VN')}</b>\n👥 Tổng số sinh viên liên quan: <b>${params.totalStudents.toLocaleString('vi-VN')}</b> sinh viên\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Thời gian: ${nowVN.toLocaleTimeString('vi-VN')} - ${nowVN.toLocaleDateString('vi-VN')}</i>\n🛡️ <i>PTIT EduSync System Notice</i>`;

    const sendRes = await sendTelegramMessage({
      botToken: effectiveToken,
      chatId: adminConfig.chatId,
      text: messageHtml,
      options: {
        threadId: adminConfig.threadId ? Number(adminConfig.threadId) : undefined,
      },
    });

    return { sent: sendRes.success, error: sendRes.error };
  } catch (err: any) {
    console.error('[TelegramDispatcher] dispatchExamBatchImportedToAdmin error:', err);
    return { sent: false, error: err.message };
  }
}
