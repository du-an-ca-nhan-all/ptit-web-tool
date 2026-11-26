import { sendTelegramMessage, getSystemTelegramBotConfig, verifyTelegramBot } from '@/src/features/telegram/server/telegramServerService';
import { getGlobalConfig, setGlobalConfig, BackupTelegramConfigValue, GLOBAL_CONFIG_KEYS } from '@/src/lib/globalConfig';

/**
 * Lấy cấu hình gửi backup lên Telegram
 */
export async function getBackupTelegramConfig(): Promise<{
  config: BackupTelegramConfigValue | null;
  systemBotInfo: { isConfigured: boolean; botUsername?: string | null; botFirstName?: string | null };
}> {
  const config = await getGlobalConfig<BackupTelegramConfigValue>(GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM);
  const sysBot = await getSystemTelegramBotConfig();

  return {
    config: config
      ? {
          ...config,
          botToken: config.botToken ? `${config.botToken.substring(0, 10)}...${config.botToken.slice(-5)}` : '',
        }
      : null,
    systemBotInfo: {
      isConfigured: !!(sysBot && sysBot.botToken),
      botUsername: sysBot?.botUsername || null,
      botFirstName: sysBot?.botFirstName || null,
    },
  };
}

/**
 * Lưu cấu hình gửi backup lên Telegram
 */
export async function saveBackupTelegramConfig(params: {
  chatId: string;
  threadId?: string | null;
  botToken?: string | null;
  isEnabled?: boolean;
  sendSql?: boolean;
  sendSqlite?: boolean;
  sendJson?: boolean;
  autoBackupEnabled?: boolean;
  scheduleTime?: string;
  notifyOnDbBackup?: boolean;
  notifyOnNewUser?: boolean;
  notifyOnDbRestore?: boolean;
}): Promise<BackupTelegramConfigValue> {
  const {
    chatId,
    threadId,
    botToken,
    isEnabled = true,
    sendSql = true,
    sendSqlite,
    autoBackupEnabled = false,
    scheduleTime = '10:00',
    notifyOnDbBackup = true,
    notifyOnNewUser = true,
    notifyOnDbRestore = true,
  } = params;

  if (!chatId || !chatId.trim()) {
    throw new Error('Vui lòng nhập Chat ID nhận file backup');
  }

  if (botToken && botToken.trim()) {
    const verify = await verifyTelegramBot(botToken.trim());
    if (!verify.success) {
      throw new Error(verify.error || 'Token Bot riêng không hợp lệ');
    }
  }

  const existing = await getGlobalConfig<BackupTelegramConfigValue>(GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM);

  const newConfig: BackupTelegramConfigValue = {
    isEnabled: Boolean(isEnabled),
    chatId: chatId.trim(),
    threadId: threadId ? String(threadId).trim() : null,
    botToken: botToken ? botToken.trim() : (existing?.botToken || null),
    sendSql: Boolean(sendSql ?? existing?.sendSql ?? true),
    sendSqlite: Boolean(sendSqlite ?? existing?.sendSqlite ?? true),
    sendJson: false,
    autoBackupEnabled: Boolean(autoBackupEnabled),
    scheduleTime: scheduleTime || '10:00',
    notifyOnDbBackup: Boolean(notifyOnDbBackup ?? existing?.notifyOnDbBackup ?? true),
    notifyOnNewUser: Boolean(notifyOnNewUser ?? existing?.notifyOnNewUser ?? true),
    notifyOnDbRestore: Boolean(notifyOnDbRestore ?? existing?.notifyOnDbRestore ?? true),
    lastAutoBackupDate: existing?.lastAutoBackupDate || null,
    lastBackupSentAt: existing?.lastBackupSentAt || null,
    lastBackupStatus: existing?.lastBackupStatus || null,
    lastBackupError: existing?.lastBackupError || null,
    lastBackupFiles: existing?.lastBackupFiles || [],
    lastTestedAt: existing?.lastTestedAt || null,
    lastTestStatus: existing?.lastTestStatus || null,
    lastTestError: existing?.lastTestError || null,
  };

  await setGlobalConfig(
    GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM,
    newConfig,
    'Cấu hình tự động gửi file backup cơ sở dữ liệu lên Telegram'
  );

  return newConfig;
}

/**
 * Kiểm tra kết nối / gửi thông điệp test đến đích Telegram
 */
export async function testBackupTelegramTarget(params?: {
  chatId?: string;
  threadId?: string | null;
  botToken?: string | null;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  let chatId = params?.chatId?.trim();
  let threadId = params?.threadId !== undefined ? (params.threadId ? String(params.threadId).trim() : null) : undefined;
  let botToken = params?.botToken?.trim();

  if (!chatId || !botToken) {
    const stored = await getGlobalConfig<BackupTelegramConfigValue>(GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM);
    if (stored) {
      if (!chatId) chatId = stored.chatId;
      if (threadId === undefined) threadId = stored.threadId || null;
      if (!botToken && stored.botToken) botToken = stored.botToken;
    }
  }

  if (!botToken) {
    const sysBot = await getSystemTelegramBotConfig();
    if (!sysBot || !sysBot.botToken) {
      return { success: false, error: 'Chưa có Bot Token (Bot hệ thống hoặc Bot riêng)' };
    }
    botToken = sysBot.botToken;
  }

  if (!chatId) {
    return { success: false, error: 'Vui lòng nhập Chat ID Telegram nhận file backup' };
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN');
  const message = `🔔 <b>KIỂM TRA KẾT NỐI SAO LƯU TELEGRAM (POSTGRESQL)</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n✅ <b>Trạng thái:</b> Kết nối thành công!\n📌 <b>Kênh/Nhóm/Chat:</b> <code>${chatId}</code>${threadId ? ` (Topic: <code>${threadId}</code>)` : ''}\n⏰ <b>Thời gian test:</b> <i>${timeStr}</i>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🐘 <i>Sẵn sàng nhận file sao lưu PostgreSQL (.sql) từ PTIT Exam Portal.</i>`;

  const sendRes = await sendTelegramMessage(botToken, chatId, message, {
    threadId: threadId ? Number(threadId) : undefined,
  });

  const existing = await getGlobalConfig<BackupTelegramConfigValue>(GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM);
  if (existing) {
    await setGlobalConfig(GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM, {
      ...existing,
      lastTestedAt: now.toISOString(),
      lastTestStatus: sendRes.success ? 'SUCCESS' : 'FAILED',
      lastTestError: sendRes.success ? null : (sendRes.error || 'Lỗi gửi tin nhắn test'),
    });
  }

  if (sendRes.success) {
    return { success: true, message: 'Đã gửi tin nhắn kiểm tra thành công lên Telegram!' };
  } else {
    return { success: false, error: sendRes.error || 'Không thể gửi tin nhắn kiểm tra đến Telegram' };
  }
}
