import { getGlobalConfig, setGlobalConfig, TelegramBotConfigValue, GLOBAL_CONFIG_KEYS } from '@/src/lib/globalConfig';
import type { SystemBotConfigData } from './types';
import { verifyTelegramBot } from './rawApi';

/**
 * Get System Telegram Bot Token & info from GlobalConfig table (key: "telegram_bot") or Environment
 */
export async function getSystemTelegramBotConfig(): Promise<SystemBotConfigData | null> {
  try {
    const botConfig = await getGlobalConfig<TelegramBotConfigValue>(GLOBAL_CONFIG_KEYS.TELEGRAM_BOT);

    if (botConfig && botConfig.botToken) {
      return {
        botToken: botConfig.botToken,
        botUsername: botConfig.botUsername || null,
        botFirstName: botConfig.botFirstName || 'PTIT EduSync Official Bot',
        botId: botConfig.botId || null,
        isActive: botConfig.isActive ?? true,
        description: botConfig.description || null,
        lastTestedAt: botConfig.lastTestedAt || null,
        lastTestStatus: botConfig.lastTestStatus || null,
        lastTestError: botConfig.lastTestError || null,
        updatedAt: new Date().toISOString(),
      };
    }

    // Fallback to process.env
    const envToken = process.env.TELEGRAM_BOT_TOKEN || process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
    if (envToken && envToken.trim()) {
      return {
        botToken: envToken.trim(),
        botUsername: process.env.TELEGRAM_BOT_USERNAME || null,
        botFirstName: 'PTIT System Bot',
        isActive: true,
        updatedAt: new Date().toISOString(),
      };
    }

    return null;
  } catch (err) {
    console.error('Error loading system telegram bot config from GlobalConfig:', err);
    return null;
  }
}

/**
 * Public Info of System Bot safe to return to all users
 */
export async function getSystemTelegramBotPublicInfo() {
  const sysConfig = await getSystemTelegramBotConfig();
  if (!sysConfig || !sysConfig.botToken) {
    return {
      isConfigured: false,
      botUsername: null,
      botFirstName: null,
      botUrl: null,
      addToGroupUrl: null,
      addToChannelUrl: null,
      description: null,
      updatedAt: null,
    };
  }

  const username = sysConfig.botUsername || '';
  return {
    isConfigured: true,
    botUsername: sysConfig.botUsername || null,
    botFirstName: sysConfig.botFirstName || 'PTIT EduSync Official Bot',
    botUrl: username ? `https://t.me/${username}` : null,
    addToGroupUrl: username ? `https://t.me/${username}?startgroup=true` : null,
    addToChannelUrl: username ? `https://t.me/${username}?startchannel=true` : null,
    description: sysConfig.description || null,
    updatedAt: sysConfig.updatedAt,
  };
}

/**
 * Save System Bot Token (Admin only) to GlobalConfig table
 */
export async function saveSystemTelegramBot(botToken: string, description?: string) {
  const token = botToken?.trim();
  if (!token) {
    throw new Error('Vui lòng nhập System Telegram Bot Token');
  }

  const verifyRes = await verifyTelegramBot(token);
  if (!verifyRes.success || !verifyRes.botInfo) {
    throw new Error(verifyRes.error || 'Token Bot hệ thống không hợp lệ');
  }

  const existingConfig = await getGlobalConfig<TelegramBotConfigValue>(GLOBAL_CONFIG_KEYS.TELEGRAM_BOT);

  const newConfigValue: TelegramBotConfigValue = {
    botToken: token,
    botUsername: verifyRes.botInfo.username || null,
    botFirstName: verifyRes.botInfo.firstName || 'PTIT EduSync Official Bot',
    botId: verifyRes.botInfo.id ? String(verifyRes.botInfo.id) : null,
    isActive: true,
    description: description || existingConfig?.description || 'Bot Telegram thông báo chính thức của hệ thống PTIT EduSync',
    lastTestedAt: new Date().toISOString(),
    lastTestStatus: 'SUCCESS',
    lastTestError: null,
  };

  const savedRecord = await setGlobalConfig(
    GLOBAL_CONFIG_KEYS.TELEGRAM_BOT,
    newConfigValue,
    newConfigValue.description || undefined
  );

  return {
    success: true,
    botInfo: verifyRes.botInfo,
    config: {
      ...newConfigValue,
      id: savedRecord.id,
      updatedAt: savedRecord.updatedAt.toISOString(),
    },
  };
}

/**
 * Resolve effective bot token: uses customToken if provided, otherwise falls back to GlobalConfig
 */
export async function resolveEffectiveBotToken(
  customToken?: string | null
): Promise<{ token: string; isCustom: boolean }> {
  if (customToken && customToken.trim()) {
    return { token: customToken.trim(), isCustom: true };
  }

  // Fallback to GLOBAL SYSTEM BOT from GlobalConfig
  const sysConfig = await getSystemTelegramBotConfig();
  if (!sysConfig || !sysConfig.botToken) {
    throw new Error(
      'Bot Hệ Thống chưa được Admin thiết lập trong bảng GlobalConfig. Vui lòng liên hệ Quản trị viên hoặc nhập Bot Token riêng.'
    );
  }

  return { token: sysConfig.botToken, isCustom: false };
}

/**
 * Toggle System Telegram Bot Active Status
 */
export async function toggleSystemTelegramBot(isActive: boolean) {
  const existing = await getGlobalConfig<TelegramBotConfigValue>(GLOBAL_CONFIG_KEYS.TELEGRAM_BOT);
  if (!existing) {
    throw new Error('Chưa có cấu hình Bot Hệ Thống để bật/tắt.');
  }
  const updatedValue: TelegramBotConfigValue = {
    ...existing,
    isActive,
  };
  return await setGlobalConfig(GLOBAL_CONFIG_KEYS.TELEGRAM_BOT, updatedValue);
}
