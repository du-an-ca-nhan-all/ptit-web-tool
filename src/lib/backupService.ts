import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';
import { sendTelegramDocument, sendTelegramMessage, getSystemTelegramBotConfig, verifyTelegramBot } from './telegram-service';
import { getGlobalConfig, setGlobalConfig, BackupTelegramConfigValue, GLOBAL_CONFIG_KEYS } from './globalConfig';

export interface TableStat {
  name: string;
  label: string;
  count: number;
  description: string;
}

export interface DatabaseStats {
  tables: {
    users: number;
    students: number;
    examBatches: number;
    examRecords: number;
    courseRegistrations: number;
    systemMeta: number;
    externalAccounts: number;
    activityLogs: number;
    telegramConfigs: number;
    globalConfigs: number;
    examReminderLogs: number;
    qldtAnnouncementLogs: number;
    classScheduleReminderLogs: number;
    registrationRequests: number;
  };
  tableBreakdown: TableStat[];
  totalRecords: number;
  dbFileSize: number;
  dbFileSizeFormatted: string;
  dbLastModified: string | null;
}

export interface LocalBackupFile {
  name: string;
  format: 'sqlite' | 'json';
  size: number;
  sizeFormatted: string;
  createdAt: string;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getDatabaseFilePath(): string {
  return path.join(process.cwd(), 'prisma', 'dev.db');
}

export function getBackupsDirectory(): string {
  const dir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function getDatabaseStats(): Promise<DatabaseStats> {
  const [
    users,
    students,
    examBatches,
    examRecords,
    courseRegistrations,
    systemMeta,
    externalAccounts,
    activityLogs,
    telegramConfigs,
    globalConfigs,
    examReminderLogs,
    qldtAnnouncementLogs,
    classScheduleReminderLogs,
    registrationRequests,
  ] = await Promise.all([
    prisma.user.count().catch(() => 0),
    prisma.student.count().catch(() => 0),
    prisma.examBatch.count().catch(() => 0),
    prisma.examRecord.count().catch(() => 0),
    prisma.courseRegistration.count().catch(() => 0),
    prisma.systemMeta.count().catch(() => 0),
    prisma.externalAccount.count().catch(() => 0),
    prisma.activityLog.count().catch(() => 0),
    prisma.telegramConfig.count().catch(() => 0),
    prisma.globalConfig.count().catch(() => 0),
    prisma.examReminderLog.count().catch(() => 0),
    prisma.qldtAnnouncementLog.count().catch(() => 0),
    prisma.classScheduleReminderLog.count().catch(() => 0),
    prisma.registrationRequest.count().catch(() => 0),
  ]);

  const dbPath = getDatabaseFilePath();
  let dbFileSize = 0;
  let dbLastModified: string | null = null;

  if (fs.existsSync(dbPath)) {
    const stat = fs.statSync(dbPath);
    dbFileSize = stat.size;
    dbLastModified = stat.mtime.toISOString();
  }

  const tableStats = {
    users,
    students,
    examBatches,
    examRecords,
    courseRegistrations,
    systemMeta,
    externalAccounts,
    activityLogs,
    telegramConfigs,
    globalConfigs,
    examReminderLogs,
    qldtAnnouncementLogs,
    classScheduleReminderLogs,
    registrationRequests,
  };

  const totalRecords = Object.values(tableStats).reduce((sum, val) => sum + val, 0);

  const tableBreakdown: TableStat[] = [
    { name: 'Student', label: 'Sinh viên & Hồ sơ', count: students, description: 'Thông tin cá nhân, mã SV, lớp, trạng thái' },
    { name: 'ExamRecord', label: 'Lịch thi', count: examRecords, description: 'Các bản ghi ca thi, phòng thi, môn thi, đợt thi' },
    { name: 'ExamBatch', label: 'Đợt thi', count: examBatches, description: 'Danh sách các đợt thi học kỳ' },
    { name: 'User', label: 'Tài khoản người dùng', count: users, description: 'Tài khoản xác thực đăng nhập và phân quyền' },
    { name: 'CourseRegistration', label: 'Đăng ký môn học', count: courseRegistrations, description: 'Dữ liệu kết quả ĐKMH kéo từ cổng QLDTTX' },
    { name: 'ExternalAccount', label: 'Tài khoản QLDTTX', count: externalAccounts, description: 'Cấu hình đồng bộ cổng ngoài và token' },
    { name: 'TelegramConfig', label: 'Cấu hình Telegram cá nhân', count: telegramConfigs, description: 'Thiết lập nhận thông báo bot Telegram theo SV' },
    { name: 'GlobalConfig', label: 'Cấu hình toàn cục hệ thống', count: globalConfigs, description: 'Cấu hình chung hệ thống lưu dạng key-value JSON (Bot Telegram, Backup Telegram, v.v.)' },
    { name: 'RegistrationRequest', label: 'Yêu cầu đăng ký', count: registrationRequests, description: 'Hồ sơ tài khoản chờ Admin xét duyệt' },
    { name: 'ActivityLog', label: 'Nhật ký hoạt động', count: activityLogs, description: 'Lịch sử thao tác người dùng và hệ thống' },
    { name: 'ExamReminderLog', label: 'Nhật ký nhắc lịch thi', count: examReminderLogs, description: 'Lịch sử gửi thông báo nhắc thi' },
    { name: 'ClassScheduleReminderLog', label: 'Nhật ký nhắc lịch học', count: classScheduleReminderLogs, description: 'Lịch sử gửi thông báo nhắc học' },
    { name: 'QldtAnnouncementLog', label: 'Nhật ký thông báo QLDTTX', count: qldtAnnouncementLogs, description: 'Lịch sử thông báo từ cổng QLDTTX' },
    { name: 'SystemMeta', label: 'Cấu hình hệ thống', count: systemMeta, description: 'Thông số và trạng thái khởi tạo hệ thống' },
  ];

  return {
    tables: tableStats,
    tableBreakdown,
    totalRecords,
    dbFileSize,
    dbFileSizeFormatted: formatBytes(dbFileSize),
    dbLastModified,
  };
}

export async function exportDatabaseAsJson(): Promise<{
  metadata: {
    appName: string;
    version: string;
    exportedAt: string;
    database: string;
    stats: DatabaseStats;
  };
  data: {
    users: any[];
    students: any[];
    examBatches: any[];
    examRecords: any[];
    courseRegistrations: any[];
    systemMeta: any[];
    externalAccounts: any[];
    activityLogs: any[];
    telegramConfigs: any[];
    globalConfigs: any[];
    examReminderLogs: any[];
    qldtAnnouncementLogs: any[];
    classScheduleReminderLogs: any[];
    registrationRequests: any[];
  };
}> {
  const stats = await getDatabaseStats();

  const [
    users,
    students,
    examBatches,
    examRecords,
    courseRegistrations,
    systemMeta,
    externalAccounts,
    activityLogs,
    telegramConfigs,
    globalConfigs,
    examReminderLogs,
    qldtAnnouncementLogs,
    classScheduleReminderLogs,
    registrationRequests,
  ] = await Promise.all([
    prisma.user.findMany({ orderBy: { id: 'asc' } }),
    prisma.student.findMany({ orderBy: { id: 'asc' } }),
    prisma.examBatch.findMany({ orderBy: { id: 'asc' } }),
    prisma.examRecord.findMany({ orderBy: { id: 'asc' } }),
    prisma.courseRegistration.findMany({ orderBy: { id: 'asc' } }),
    prisma.systemMeta.findMany({ orderBy: { id: 'asc' } }),
    prisma.externalAccount.findMany({ orderBy: { id: 'asc' } }),
    prisma.activityLog.findMany({ orderBy: { id: 'asc' } }),
    prisma.telegramConfig.findMany({ orderBy: { id: 'asc' } }),
    prisma.globalConfig.findMany({ orderBy: { id: 'asc' } }),
    prisma.examReminderLog.findMany({ orderBy: { id: 'asc' } }),
    prisma.qldtAnnouncementLog.findMany({ orderBy: { id: 'asc' } }),
    prisma.classScheduleReminderLog.findMany({ orderBy: { id: 'asc' } }),
    prisma.registrationRequest.findMany({ orderBy: { id: 'asc' } }),
  ]);

  return {
    metadata: {
      appName: 'PTIT Web Tool - Exam & Schedule Portal',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      database: 'SQLite',
      stats,
    },
    data: {
      users,
      students,
      examBatches,
      examRecords,
      courseRegistrations,
      systemMeta,
      externalAccounts,
      activityLogs,
      telegramConfigs,
      globalConfigs,
      examReminderLogs,
      qldtAnnouncementLogs,
      classScheduleReminderLogs,
      registrationRequests,
    },
  };
}

export function generateTimestampString(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

export async function createLocalBackup(format: 'sqlite' | 'json' | 'all' = 'all'): Promise<LocalBackupFile[]> {
  const backupsDir = getBackupsDirectory();
  const timestamp = generateTimestampString();
  const createdFiles: LocalBackupFile[] = [];

  // 1. Backup SQLite
  if (format === 'sqlite' || format === 'all') {
    const dbPath = getDatabaseFilePath();
    if (fs.existsSync(dbPath)) {
      const filename = `ptit-db-backup-${timestamp}.sqlite`;
      const targetPath = path.join(backupsDir, filename);
      fs.copyFileSync(dbPath, targetPath);
      const stat = fs.statSync(targetPath);
      createdFiles.push({
        name: filename,
        format: 'sqlite',
        size: stat.size,
        sizeFormatted: formatBytes(stat.size),
        createdAt: stat.birthtime.toISOString(),
      });
    }
  }

  // 2. Backup JSON
  if (format === 'json' || format === 'all') {
    const jsonDump = await exportDatabaseAsJson();
    const filename = `ptit-db-backup-${timestamp}.json`;
    const targetPath = path.join(backupsDir, filename);
    fs.writeFileSync(targetPath, JSON.stringify(jsonDump, null, 2), 'utf8');
    const stat = fs.statSync(targetPath);
    createdFiles.push({
      name: filename,
      format: 'json',
      size: stat.size,
      sizeFormatted: formatBytes(stat.size),
      createdAt: stat.birthtime.toISOString(),
    });
  }

  return createdFiles;
}

export function listLocalBackups(): LocalBackupFile[] {
  const backupsDir = getBackupsDirectory();
  if (!fs.existsSync(backupsDir)) return [];

  const files = fs.readdirSync(backupsDir);
  const result: LocalBackupFile[] = [];

  for (const file of files) {
    if (file.startsWith('.')) continue;
    const filePath = path.join(backupsDir, file);
    try {
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;

      let format: 'sqlite' | 'json' = 'sqlite';
      if (file.endsWith('.json')) {
        format = 'json';
      } else if (file.endsWith('.sqlite') || file.endsWith('.db')) {
        format = 'sqlite';
      } else {
        continue;
      }

      result.push({
        name: file,
        format,
        size: stat.size,
        sizeFormatted: formatBytes(stat.size),
        createdAt: stat.mtime.toISOString(),
      });
    } catch {
      // Ignore file stat errors
    }
  }

  // Sort newest first
  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getSafeBackupFilePath(filename: string): string | null {
  const backupsDir = getBackupsDirectory();
  const cleanName = path.basename(filename);
  const targetPath = path.join(backupsDir, cleanName);

  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    return targetPath;
  }
  return null;
}

export function deleteLocalBackup(filename: string): boolean {
  const targetPath = getSafeBackupFilePath(filename);
  if (!targetPath) return false;

  try {
    fs.unlinkSync(targetPath);
    return true;
  } catch (err) {
    console.error(`[BackupService] Failed to delete backup file: ${filename}`, err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TELEGRAM CLOUD BACKUP CAPABILITIES
// ─────────────────────────────────────────────────────────────────────────────

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
          // Mask botToken if custom
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
  sendSqlite?: boolean;
  sendJson?: boolean;
  autoBackupEnabled?: boolean;
  scheduleTime?: string;
}): Promise<BackupTelegramConfigValue> {
  const {
    chatId,
    threadId,
    botToken,
    isEnabled = true,
    sendSqlite = true,
    sendJson = true,
    autoBackupEnabled = false,
    scheduleTime = '02:00',
  } = params;

  if (!chatId || !chatId.trim()) {
    throw new Error('Vui lòng nhập Chat ID nhận file backup');
  }

  // If custom token is provided, verify it
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
    sendSqlite: Boolean(sendSqlite),
    sendJson: Boolean(sendJson),
    autoBackupEnabled: Boolean(autoBackupEnabled),
    scheduleTime: scheduleTime || '02:00',
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
  const message = `🔔 <b>KIỂM TRA KẾT NỐI SAO LƯU TELEGRAM</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n✅ <b>Trạng thái:</b> Kết nối thành công!\n📌 <b>Kênh/Nhóm/Chat:</b> <code>${chatId}</code>${threadId ? ` (Topic: <code>${threadId}</code>)` : ''}\n⏰ <b>Thời gian test:</b> <i>${timeStr}</i>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🛡️ <i>Sẵn sàng nhận các file sao lưu cơ sở dữ liệu (.sqlite / .json) từ PTIT Exam Portal.</i>`;

  const sendRes = await sendTelegramMessage(botToken, chatId, message, {
    threadId: threadId ? Number(threadId) : undefined,
  });

  // Update test status in global config
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

/**
 * Thực hiện backup và gửi file trực tiếp lên Telegram
 */
export async function sendBackupToTelegram(params?: {
  format?: 'sqlite' | 'json' | 'all';
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

  const format =
    params?.format ||
    (storedConfig
      ? storedConfig.sendSqlite && storedConfig.sendJson
        ? 'all'
        : storedConfig.sendSqlite
        ? 'sqlite'
        : 'json'
      : 'all');

  const stats = await getDatabaseStats();
  const timestamp = generateTimestampString();
  const timeDisplay = new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN');

  const filesSent: string[] = [];
  const results: any[] = [];
  const errors: string[] = [];

  // 1. Send SQLite DB
  if (format === 'sqlite' || format === 'all') {
    const dbPath = getDatabaseFilePath();
    if (fs.existsSync(dbPath)) {
      const sqliteBuffer = fs.readFileSync(dbPath);
      const filename = `ptit-db-${timestamp}.sqlite`;
      const sizeFormatted = formatBytes(sqliteBuffer.length);

      const caption = `💾 <b>BẢN SAO LƯU DATABASE SQLITE (.sqlite)</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 <b>Tổng số bản ghi:</b> ${stats.totalRecords.toLocaleString('vi-VN')}\n👥 <b>Sinh viên:</b> ${stats.tables.students.toLocaleString('vi-VN')} | <b>Lịch thi:</b> ${stats.tables.examRecords.toLocaleString('vi-VN')}\n📁 <b>Tài khoản:</b> ${stats.tables.users.toLocaleString('vi-VN')} | <b>Đợt thi:</b> ${stats.tables.examBatches}\n💾 <b>Dung lượng file:</b> ${sizeFormatted}\n⏰ <b>Thời gian:</b> <i>${timeDisplay}</i>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🛡️ <i>File nhị phân nguyên gốc dev.db - Khôi phục tức thì hoặc phân tích bằng SQLite Browser / Studio.</i>`;

      const sendRes = await sendTelegramDocument(botToken, chatId, sqliteBuffer, filename, {
        threadId: threadId ? Number(threadId) : undefined,
        caption,
      });

      results.push({ file: filename, format: 'sqlite', result: sendRes });
      if (sendRes.success) {
        filesSent.push(filename);
      } else {
        errors.push(`Lỗi gửi file SQLite: ${sendRes.error}`);
      }
    }
  }

  // 2. Send JSON Dump
  if (format === 'json' || format === 'all') {
    const jsonDump = await exportDatabaseAsJson();
    const jsonStr = JSON.stringify(jsonDump, null, 2);
    const jsonBuffer = Buffer.from(jsonStr, 'utf-8');
    const filename = `ptit-db-${timestamp}.json`;
    const sizeFormatted = formatBytes(jsonBuffer.length);

    const caption = `📄 <b>BẢN XUẤT DỮ LIỆU JSON ĐẦY ĐỦ (.json)</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 <b>Tổng số bản ghi:</b> ${stats.totalRecords.toLocaleString('vi-VN')}\n📋 <b>Bao gồm:</b> 14 bảng dữ liệu hệ thống kèm metadata\n💾 <b>Dung lượng file:</b> ${sizeFormatted}\n⏰ <b>Thời gian:</b> <i>${timeDisplay}</i>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🌐 <i>Dữ liệu JSON có cấu trúc đầy đủ, dễ đọc & di chuyển sang mọi hệ quản trị CSDL.</i>`;

    const sendRes = await sendTelegramDocument(botToken, chatId, jsonBuffer, filename, {
      threadId: threadId ? Number(threadId) : undefined,
      caption,
    });

    results.push({ file: filename, format: 'json', result: sendRes });
    if (sendRes.success) {
      filesSent.push(filename);
    } else {
      errors.push(`Lỗi gửi file JSON: ${sendRes.error}`);
    }
  }

  const isSuccess = filesSent.length > 0;
  const errorMsg = errors.join('; ');

  // Update last sent status in GlobalConfig
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
      ? `Đã gửi thành công ${filesSent.length} file sao lưu lên Telegram!`
      : `Gửi file sao lưu lên Telegram thất bại: ${errorMsg}`,
    filesSent,
    results,
    error: errorMsg || undefined,
  };
}

/**
 * Trình quét tự động kiểm tra và thực hiện sao lưu lúc 10:00 sáng (giờ Việt Nam).
 * Được gọi định kỳ mỗi 5 phút bởi TelegramScheduler trong tiến trình máy chủ.
 */
export async function runDailyAutoBackupScheduler(): Promise<{ executed: boolean; reason?: string }> {
  try {
    // 1. Giờ Việt Nam hiện tại (UTC+7)
    const nowVN = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const currentHour = nowVN.getHours();
    const currentMinute = nowVN.getMinutes();
    const currentDateStr = `${nowVN.getFullYear()}-${String(nowVN.getMonth() + 1).padStart(2, '0')}-${String(nowVN.getDate()).padStart(2, '0')}`;

    // 2. Đọc cấu hình từ GlobalConfig
    const config = await getGlobalConfig<BackupTelegramConfigValue>(GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM);

    // Mặc định: autoBackupEnabled = true, scheduleTime = '10:00'
    const isAutoEnabled = config?.autoBackupEnabled !== false;
    const scheduleTime = config?.scheduleTime || '10:00';
    const [targetHourStr, targetMinuteStr] = scheduleTime.split(':');
    const targetHour = parseInt(targetHourStr || '10', 10);
    const targetMinute = parseInt(targetMinuteStr || '0', 10);

    if (!isAutoEnabled) {
      return { executed: false, reason: 'Tự động sao lưu đang tắt' };
    }

    // Đã sao lưu trong ngày hôm nay rồi thì không chạy lại
    if (config?.lastAutoBackupDate === currentDateStr) {
      return { executed: false, reason: `Đã sao lưu tự động trong ngày hôm nay (${currentDateStr})` };
    }

    // Kiểm tra xem đã đến hoặc vượt qua mốc giờ hẹn trong ngày chưa (ví dụ >= 10:00)
    const isTimeToBackup = currentHour > targetHour || (currentHour === targetHour && currentMinute >= targetMinute);

    if (!isTimeToBackup) {
      return {
        executed: false,
        reason: `Chưa đến giờ sao lưu (Hiện tại: ${currentHour}:${String(currentMinute).padStart(2, '0')} VN, Lịch hẹn: ${scheduleTime} VN)`,
      };
    }

    console.log(`⏰ [Auto Backup 10:00 AM VN] Bắt đầu tự động tạo bản sao lưu dữ liệu hệ thống lúc ${scheduleTime} sáng...`);

    // 1. Tạo snapshot lưu cục bộ trên máy chủ
    const createdFiles = await createLocalBackup('all');
    console.log(`⏰ [Auto Backup 10:00 AM VN] Đã tạo ${createdFiles.length} file snapshot trên máy chủ.`);

    // 2. Nếu có cấu hình Telegram, tự động gửi file lên Telegram
    let telegramResult: any = null;
    if (config?.chatId && config.isEnabled !== false) {
      try {
        telegramResult = await sendBackupToTelegram();
        console.log(`⏰ [Auto Backup 10:00 AM VN] Đã gửi ${telegramResult.filesSent?.length || 0} file lên Telegram.`);
      } catch (telErr: any) {
        console.error(`⏰ [Auto Backup 10:00 AM VN] Lỗi khi gửi file lên Telegram:`, telErr.message);
      }
    }

    // 3. Cập nhật ngày sao lưu tự động gần nhất vào GlobalConfig
    const updatedConfig: BackupTelegramConfigValue = {
      ...(config || {
        isEnabled: true,
        chatId: '',
        sendSqlite: true,
        sendJson: true,
      }),
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
