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

export interface BackupTelegramConfigValue {
  isEnabled: boolean;
  chatId: string;
  threadId?: string | null;
  botToken?: string | null; // Nếu rỗng sẽ dùng System Bot
  sendSqlite: boolean; // Mặc định true
  sendJson: boolean; // Mặc định true
  autoBackupEnabled?: boolean;
  scheduleTime?: string; // Mặc định: '10:00' (10h sáng hàng ngày)
  lastAutoBackupDate?: string | null; // YYYY-MM-DD
  lastBackupSentAt?: string | null;
  lastBackupStatus?: 'SUCCESS' | 'FAILED' | null;
  lastBackupError?: string | null;
  lastBackupFiles?: string[];
  lastTestedAt?: string | null;
  lastTestStatus?: 'SUCCESS' | 'FAILED' | null;
  lastTestError?: string | null;
}

export const GLOBAL_CONFIG_KEYS = {
  TELEGRAM_BOT: 'telegram_bot',
  BACKUP_TELEGRAM: 'backup_telegram',
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
