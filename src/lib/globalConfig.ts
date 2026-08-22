import { prisma } from './prisma';

export interface TelegramBotConfigValue {
  botToken: string;
  botUsername?: string | null;
  botFirstName?: string | null;
  botId?: string | null;
  isActive: boolean;
  description?: string | null;
  lastTestedAt?: string | null;
  lastTestStatus?: 'SUCCESS' | 'FAILED' | null;
  lastTestError?: string | null;
}

export interface TelegramAdminConfigValue {
  isEnabled: boolean;
  chatId: string; // Chat ID / Group ID / Channel ID nhận thông báo của Admin
  threadId?: string | null; // Topic ID (nếu là Forum topic)
  botToken?: string | null; // Bot token riêng (nếu rỗng sẽ dùng System Bot)
  // Các cấu hình riêng cho từng loại notice:
  notifyOnNewUser: boolean; // Thông báo khi có thành viên / người đăng ký mới (Mặc định: true)
  notifyOnDbBackup: boolean; // Thông báo khi có Sao Lưu & Xuất Dữ Liệu DB (Mặc định: true)
  notifyOnDbRestore: boolean; // Thông báo khi Phục Hồi Dữ Liệu DB (Mặc định: true)
  notifyOnExamBatchImport?: boolean; // Thông báo khi Import đợt thi mới (Mặc định: true)
  lastTestedAt?: string | null;
  lastTestStatus?: 'SUCCESS' | 'FAILED' | null;
  lastTestError?: string | null;
}

export interface BackupTelegramConfigValue {
  isEnabled: boolean;
  chatId: string;
  threadId?: string | null;
  botToken?: string | null; // Nếu rỗng sẽ dùng System Bot
  sendSql?: boolean; // Gửi file SQL Dump PostgreSQL (.sql)
  sendSqlite?: boolean; // Legacy fallback
  sendJson: boolean; // Gửi file JSON đầy đủ (.json)
  autoBackupEnabled?: boolean;
  scheduleTime?: string; // Mặc định: '10:00' (10h sáng hàng ngày)
  notifyOnDbBackup?: boolean; // Thông báo khi Sao Lưu & Xuất Dữ Liệu DB (Mặc định: true)
  notifyOnNewUser?: boolean; // Thông báo khi có Người Đăng Ký Mới (Mặc định: true)
  notifyOnDbRestore?: boolean; // Thông báo khi Phục Hồi Dữ Liệu DB (Mặc định: true)
  lastAutoBackupDate?: string | null; // YYYY-MM-DD
  lastBackupSentAt?: string | null;
  lastBackupStatus?: 'SUCCESS' | 'FAILED' | null;
  lastBackupError?: string | null;
  lastBackupFiles?: string[] | null;
  lastTestedAt?: string | null;
  lastTestStatus?: 'SUCCESS' | 'FAILED' | null;
  lastTestError?: string | null;
}

export interface SingleJobScheduleConfig {
  isEnabled: boolean; // Bật/Tắt tự động chạy cho riêng job này
  scheduleTime: string; // Giờ chạy (Ví dụ: '22:00' cho 22h đêm)
  lastSyncDate?: string | null; // Ngày chạy gần nhất YYYY-MM-DD
  lastSyncAt?: string | null; // Thời điểm ISO chạy gần nhất
  lastStatus?: 'SUCCESS' | 'PARTIAL' | 'FAILED' | null;
}

export interface GlobalNightlySyncConfigValue {
  isEnabled: boolean; // Công tắc tổng toàn hệ thống
  concurrency?: number; // Số luồng xử lý đồng thời (Mặc định: 2)
  delayBetweenItemsMs?: number; // Delay giữa các request (ms) (Mặc định: 600)
  notifyAdminTelegram?: boolean; // Gửi thông báo tóm tắt qua Telegram sau khi hoàn tất

  // Cấu hình giờ chạy và trạng thái riêng biệt cho từng Job:
  timetableJob?: SingleJobScheduleConfig; // Job 1: Đồng bộ Lịch học & TKB (QLHT)
  gradesJob?: SingleJobScheduleConfig; // Job 2: Đồng bộ Điểm & GPA (QLHT)
  lmsJob?: SingleJobScheduleConfig; // Job 3: Đồng bộ Khóa học & Tiến độ (LMS)

  // Trường mở rộng cho các Job tiếp theo trong tương lai:
  customJobs?: Record<string, SingleJobScheduleConfig>;

  // Legacy fallback fields
  scheduleTime?: string;
  syncTimetable?: boolean;
  syncGrades?: boolean;
  syncLms?: boolean;
  lastSyncDate?: string | null;
}

export const GLOBAL_CONFIG_KEYS = {
  TELEGRAM_BOT: 'telegram_bot',
  TELEGRAM_ADMIN: 'telegram_admin',
  BACKUP_TELEGRAM: 'backup_telegram',
  GLOBAL_NIGHTLY_SYNC: 'global_nightly_sync',
} as const;

/**
 * Lấy cấu hình toàn cục theo key và tự động parse JSON
 */
export async function getGlobalConfig<T = any>(key: string, defaultValue?: T): Promise<T | null> {
  try {
    const record = await prisma.globalConfig.findUnique({
      where: { key },
    });
    if (!record || !record.value) {
      return defaultValue ?? null;
    }
    try {
      return JSON.parse(record.value) as T;
    } catch {
      return record.value as unknown as T;
    }
  } catch (err) {
    console.error(`[GlobalConfig] Lỗi khi đọc key "${key}":`, err);
    return defaultValue ?? null;
  }
}

/**
 * Lưu hoặc cập nhật cấu hình toàn cục dưới dạng JSON
 */
export async function setGlobalConfig<T = any>(
  key: string,
  value: T,
  description?: string
): Promise<{ id: number; key: string; value: string; description: string | null; updatedAt: Date }> {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);

  const existing = await prisma.globalConfig.findUnique({
    where: { key },
  });

  if (existing) {
    return await prisma.globalConfig.update({
      where: { key },
      data: {
        value: serialized,
        description: description !== undefined ? description : existing.description,
      },
    });
  }

  return await prisma.globalConfig.create({
    data: {
      key,
      value: serialized,
      description: description || null,
    },
  });
}

/**
 * Xoá một cấu hình toàn cục theo key
 */
export async function deleteGlobalConfig(key: string): Promise<boolean> {
  try {
    await prisma.globalConfig.delete({
      where: { key },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Lấy toàn bộ danh sách cấu hình toàn cục (hỗ trợ hiển thị và mở rộng cấu hình)
 */
export async function getAllGlobalConfigs(): Promise<
  Array<{
    id: number;
    key: string;
    value: any;
    rawValue: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
  }>
> {
  const list = await prisma.globalConfig.findMany({
    orderBy: { key: 'asc' },
  });

  return list.map((item) => {
    let parsed: any = item.value;
    try {
      parsed = JSON.parse(item.value);
    } catch {}

    return {
      id: item.id,
      key: item.key,
      value: parsed,
      rawValue: item.value,
      description: item.description,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  });
}

/**
 * Lấy cấu hình kênh thông báo quản trị (telegram_admin), fallback về backup_telegram nếu chưa tạo
 */
export async function getTelegramAdminConfig(): Promise<TelegramAdminConfigValue | null> {
  const config = await getGlobalConfig<TelegramAdminConfigValue>(GLOBAL_CONFIG_KEYS.TELEGRAM_ADMIN);
  if (config) {
    return config;
  }

  // Fallback: nếu chưa có telegram_admin, lấy từ backup_telegram để tương thích ngược
  const backup = await getGlobalConfig<BackupTelegramConfigValue>(GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM);
  if (backup && backup.chatId) {
    return {
      isEnabled: backup.isEnabled ?? true,
      chatId: backup.chatId,
      threadId: backup.threadId || null,
      botToken: backup.botToken || null,
      notifyOnNewUser: backup.notifyOnNewUser !== false,
      notifyOnDbBackup: backup.notifyOnDbBackup !== false,
      notifyOnDbRestore: backup.notifyOnDbRestore !== false,
      notifyOnExamBatchImport: true,
    };
  }

  return null;
}

/**
 * Lưu cấu hình kênh thông báo quản trị (telegram_admin)
 */
export async function saveTelegramAdminConfig(params: {
  chatId: string;
  threadId?: string | null;
  botToken?: string | null;
  isEnabled?: boolean;
  notifyOnNewUser?: boolean;
  notifyOnDbBackup?: boolean;
  notifyOnDbRestore?: boolean;
  notifyOnExamBatchImport?: boolean;
}): Promise<TelegramAdminConfigValue> {
  const {
    chatId,
    threadId,
    botToken,
    isEnabled = true,
    notifyOnNewUser = true,
    notifyOnDbBackup = true,
    notifyOnDbRestore = true,
    notifyOnExamBatchImport = true,
  } = params;

  if (!chatId || !chatId.trim()) {
    throw new Error('Vui lòng nhập Chat ID hoặc Group/Channel ID của Admin');
  }

  const existing = await getGlobalConfig<TelegramAdminConfigValue>(GLOBAL_CONFIG_KEYS.TELEGRAM_ADMIN);

  const newConfig: TelegramAdminConfigValue = {
    isEnabled: Boolean(isEnabled),
    chatId: chatId.trim(),
    threadId: threadId ? String(threadId).trim() : null,
    botToken: botToken ? botToken.trim() : (existing?.botToken || null),
    notifyOnNewUser: Boolean(notifyOnNewUser),
    notifyOnDbBackup: Boolean(notifyOnDbBackup),
    notifyOnDbRestore: Boolean(notifyOnDbRestore),
    notifyOnExamBatchImport: Boolean(notifyOnExamBatchImport),
    lastTestedAt: existing?.lastTestedAt || null,
    lastTestStatus: existing?.lastTestStatus || null,
    lastTestError: existing?.lastTestError || null,
  };

  await setGlobalConfig(
    GLOBAL_CONFIG_KEYS.TELEGRAM_ADMIN,
    newConfig,
    'Cấu hình kênh nhận thông báo quản trị viên toàn hệ thống (telegram_admin)'
  );

  return newConfig;
}

