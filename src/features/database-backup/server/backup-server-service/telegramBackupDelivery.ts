import { sendTelegramDocument, getSystemTelegramBotConfig } from '@/src/features/telegram/server/telegramServerService';
import { getGlobalConfig, setGlobalConfig, BackupTelegramConfigValue, GLOBAL_CONFIG_KEYS } from '@/src/lib/globalConfig';
import { formatBytes, generateTimestampString } from './utils';
import { getDatabaseStats } from './postgresMetadata';
import { exportDatabaseAsSqlDump } from './backupExport';
import { createLocalBackup } from './localBackupStorage';

/**
 * Thực hiện backup và gửi file trực tiếp lên Telegram
 */
export async function sendBackupToTelegram(params?: {
  format?: 'sql';
  customChatId?: string;
  customThreadId?: string | null;
  customBotToken?: string | null;
}): Promise<{
  success: boolean;
  message: string;
  filesSent: string[];
  results: any[];
  error?: string;
}> {
  const storedConfig = await getGlobalConfig<BackupTelegramConfigValue>(GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM);

  const chatId = params?.customChatId?.trim() || storedConfig?.chatId;
  const threadId = params?.customThreadId !== undefined ? params.customThreadId : storedConfig?.threadId;
  let botToken = params?.customBotToken?.trim() || storedConfig?.botToken;

  if (!chatId) {
    throw new Error('Chưa cấu hình Chat ID Telegram để gửi file backup. Vui lòng thiết lập trong phần cấu hình.');
  }

  if (!botToken) {
    const sysBot = await getSystemTelegramBotConfig();
    if (!sysBot || !sysBot.botToken) {
      throw new Error('Chưa có Bot Telegram. Vui lòng thiết lập Bot Hệ Thống hoặc cấu hình Bot Token riêng.');
    }
    botToken = sysBot.botToken;
  }

  const stats = await getDatabaseStats();
  const timestamp = generateTimestampString();
  const timeDisplay = new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN');

  const filesSent: string[] = [];
  const results: any[] = [];
  const errors: string[] = [];

  // Send PostgreSQL SQL Dump (.sql)
  try {
    const sqlDump = await exportDatabaseAsSqlDump();
    const sqlBuffer = Buffer.from(sqlDump, 'utf-8');
    const filename = `ptit-db-${timestamp}.sql`;
    const sizeFormatted = formatBytes(sqlBuffer.length);

    const caption = `🐘 <b>BẢN SAO LƯU DATABASE POSTGRESQL (.sql)</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 <b>Tổng số bản ghi:</b> ${stats.totalRecords.toLocaleString('vi-VN')}\n📋 <b>Bao gồm:</b> ${stats.tableBreakdown.length} bảng dữ liệu PostgreSQL\n💾 <b>Dung lượng file:</b> ${sizeFormatted}\n⏰ <b>Thời gian:</b> <i>${timeDisplay}</i>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🛡️ <i>File SQL Dump chuẩn PostgreSQL - Tự động nhận diện toàn bộ cấu trúc bảng & khôi phục tức thì.</i>`;

    const sendRes = await sendTelegramDocument({
      botToken,
      chatId,
      fileBuffer: sqlBuffer,
      filename,
      options: {
        threadId: threadId ? Number(threadId) : undefined,
        caption,
      },
    });

    results.push({ file: filename, format: 'sql', result: sendRes });
    if (sendRes.success) {
      filesSent.push(filename);
    } else {
      errors.push(`Lỗi gửi file SQL: ${sendRes.error}`);
    }
  } catch (sqlErr: any) {
    errors.push(`Lỗi tạo file SQL Dump: ${sqlErr.message}`);
  }

  const isSuccess = filesSent.length > 0;
  const errorMsg = errors.join('; ');

  if (storedConfig) {
    await setGlobalConfig(GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM, {
      ...storedConfig,
      lastBackupSentAt: new Date().toISOString(),
      lastBackupStatus: isSuccess ? 'SUCCESS' : 'FAILED',
      lastBackupError: errorMsg || null,
      lastBackupFiles: filesSent,
    });
  }

  return {
    success: isSuccess,
    message: isSuccess
      ? `Đã gửi thành công file sao lưu SQL (${filesSent.join(', ')}) lên Telegram!`
      : `Gửi file sao lưu lên Telegram thất bại: ${errorMsg}`,
    filesSent,
    results,
    error: errorMsg || undefined,
  };
}

/**
 * Trình quét tự động kiểm tra và thực hiện sao lưu lúc 10:00 sáng (giờ Việt Nam).
 */
export async function runDailyAutoBackupScheduler(): Promise<{ executed: boolean; reason?: string }> {
  try {
    const nowVN = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const currentHour = nowVN.getHours();
    const currentMinute = nowVN.getMinutes();
    const currentDateStr = `${nowVN.getFullYear()}-${String(nowVN.getMonth() + 1).padStart(2, '0')}-${String(nowVN.getDate()).padStart(2, '0')}`;

    const config = await getGlobalConfig<BackupTelegramConfigValue>(GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM);

    const isAutoEnabled = config?.autoBackupEnabled !== false;
    const scheduleTime = config?.scheduleTime || '10:00';
    const [targetHourStr, targetMinuteStr] = scheduleTime.split(':');
    const targetHour = parseInt(targetHourStr || '10', 10);
    const targetMinute = parseInt(targetMinuteStr || '0', 10);

    if (!isAutoEnabled) {
      return { executed: false, reason: 'Tự động sao lưu đang tắt' };
    }

    if (config?.lastAutoBackupDate === currentDateStr) {
      return { executed: false, reason: `Đã sao lưu tự động trong ngày hôm nay (${currentDateStr})` };
    }

    const isTimeToBackup = currentHour > targetHour || (currentHour === targetHour && currentMinute >= targetMinute);

    if (!isTimeToBackup) {
      return {
        executed: false,
        reason: `Chưa đến giờ sao lưu (Hiện tại: ${currentHour}:${String(currentMinute).padStart(2, '0')} VN, Lịch hẹn: ${scheduleTime} VN)`,
      };
    }

    console.log(`⏰ [Auto Backup] Bắt đầu tự động tạo bản sao lưu dữ liệu PostgreSQL (.sql) lúc ${scheduleTime} sáng...`);

    // 1. Tạo snapshot SQL lưu cục bộ trên máy chủ
    const createdFiles = await createLocalBackup('sql');
    console.log(`⏰ [Auto Backup] Đã tạo file snapshot SQL trên máy chủ: ${createdFiles.map((f) => f.name).join(', ')}`);

    // 2. Gửi Telegram nếu có cấu hình
    let telegramResult: any = null;
    if (config?.chatId && config.isEnabled !== false) {
      try {
        telegramResult = await sendBackupToTelegram();
        console.log(`⏰ [Auto Backup] Đã gửi ${telegramResult.filesSent?.length || 0} file lên Telegram.`);
      } catch (telErr: any) {
        console.error(`⏰ [Auto Backup] Lỗi khi gửi file lên Telegram:`, telErr.message);
      }
    }

    // 3. Cập nhật ngày sao lưu tự động gần nhất
    const updatedConfig: BackupTelegramConfigValue = {
      ...(config || {
        isEnabled: true,
        chatId: '',
        sendSql: true,
        sendJson: false,
      }),
      sendSql: true,
      sendJson: false,
      autoBackupEnabled: isAutoEnabled,
      scheduleTime,
      lastAutoBackupDate: currentDateStr,
      lastBackupSentAt: telegramResult?.success ? new Date().toISOString() : config?.lastBackupSentAt || new Date().toISOString(),
      lastBackupStatus: telegramResult ? (telegramResult.success ? 'SUCCESS' : 'FAILED') : config?.lastBackupStatus || 'SUCCESS',
      lastBackupError: telegramResult?.error || config?.lastBackupError || null,
      lastBackupFiles: telegramResult?.filesSent || createdFiles.map((f) => f.name),
    };

    await setGlobalConfig(
      GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM,
      updatedConfig,
      'Cấu hình tự động gửi file backup cơ sở dữ liệu lên Telegram'
    );

    return { executed: true };
  } catch (err: any) {
    console.error('[Auto Backup Error]:', err);
    return { executed: false, reason: err.message };
  }
}
