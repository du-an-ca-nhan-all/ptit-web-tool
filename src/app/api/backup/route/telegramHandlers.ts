import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { saveTelegramAdminConfig } from '@/src/lib/globalConfig';
import {
  getBackupTelegramConfig,
  saveBackupTelegramConfig,
  testBackupTelegramTarget,
  sendBackupToTelegram,
} from '@/src/features/database-backup/server/backupServerService';
import type { BackupAuthUser } from './auth';

export async function handleSaveTelegramConfig(
  req: NextRequest,
  authUser: BackupAuthUser,
  body: Record<string, any>
): Promise<NextResponse> {
  const {
    chatId,
    threadId,
    botToken,
    isEnabled,
    sendSql,
    sendSqlite,
    autoBackupEnabled,
    scheduleTime,
    notifyOnDbBackup,
    notifyOnNewUser,
    notifyOnDbRestore,
  } = body;

  const saved = await saveBackupTelegramConfig({
    chatId,
    threadId,
    botToken,
    isEnabled,
    sendSql: sendSql ?? sendSqlite ?? true,
    sendSqlite: sendSqlite ?? sendSql ?? true,
    autoBackupEnabled,
    scheduleTime,
    notifyOnDbBackup,
    notifyOnNewUser,
    notifyOnDbRestore,
  });

  // Synchronize to telegram_admin global config as well
  await saveTelegramAdminConfig({
    chatId,
    threadId,
    botToken,
    isEnabled,
    notifyOnNewUser,
    notifyOnDbBackup,
    notifyOnDbRestore,
  }).catch((err) => console.error('[BackupAPI] Error syncing to telegram_admin:', err));

  await logActivity({
    req,
    userId: authUser.id,
    username: authUser.username,
    userRole: authUser.role,
    action: 'SAVE_BACKUP_TELEGRAM_CONFIG',
    targetType: 'GLOBAL_CONFIG',
    targetId: 'backup_telegram',
    description: `Cập nhật cấu hình gửi backup & thông báo admin lên Telegram: Chat ID ${chatId}${threadId ? ` (Topic ${threadId})` : ''}`,
    metadata: {
      chatId,
      threadId,
      isEnabled,
      sendSql: saved.sendSql,
      autoBackupEnabled,
      scheduleTime,
      notifyOnDbBackup: saved.notifyOnDbBackup,
      notifyOnNewUser: saved.notifyOnNewUser,
      notifyOnDbRestore: saved.notifyOnDbRestore,
    },
  });

  const telegramBackup = await getBackupTelegramConfig();
  return NextResponse.json({
    success: true,
    message: 'Đã lưu cấu hình gửi sao lưu lên Telegram thành công!',
    telegramConfig: telegramBackup.config,
    serverTime: new Date().toISOString(),
  });
}

export async function handleTestTelegramTarget(
  req: NextRequest,
  authUser: BackupAuthUser,
  body: Record<string, any>
): Promise<NextResponse> {
  const { chatId, threadId, botToken } = body;
  const testRes = await testBackupTelegramTarget({ chatId, threadId, botToken });

  await logActivity({
    req,
    userId: authUser.id,
    username: authUser.username,
    userRole: authUser.role,
    action: 'TEST_BACKUP_TELEGRAM',
    targetType: 'TELEGRAM',
    targetId: chatId || 'saved_target',
    description: `Kiểm tra gửi test Telegram sao lưu: ${testRes.success ? 'Thành công' : 'Thất bại'}`,
    metadata: { success: testRes.success, error: testRes.error },
  });

  if (testRes.success) {
    return NextResponse.json({ success: true, message: testRes.message, serverTime: new Date().toISOString() });
  }
  return NextResponse.json({ error: testRes.error, serverTime: new Date().toISOString() }, { status: 400 });
}

export async function handleSendTelegramBackup(
  req: NextRequest,
  authUser: BackupAuthUser,
  body: Record<string, any>
): Promise<NextResponse> {
  const { customChatId, customThreadId, customBotToken } = body;

  const sendRes = await sendBackupToTelegram({
    format: 'sql',
    customChatId,
    customThreadId,
    customBotToken,
  });

  await logActivity({
    req,
    userId: authUser.id,
    username: authUser.username,
    userRole: authUser.role,
    action: 'SEND_BACKUP_TELEGRAM',
    targetType: 'DATABASE',
    targetId: sendRes.filesSent.join(', '),
    description: `Gửi bản sao lưu lên Telegram: ${sendRes.filesSent.join(', ')} (${sendRes.success ? 'Thành công' : 'Thất bại'})`,
    metadata: { filesSent: sendRes.filesSent, success: sendRes.success, error: sendRes.error },
  });

  const telegramBackup = await getBackupTelegramConfig();
  if (sendRes.success) {
    return NextResponse.json({
      success: true,
      message: sendRes.message,
      filesSent: sendRes.filesSent,
      telegramConfig: telegramBackup.config,
      serverTime: new Date().toISOString(),
    });
  }
  return NextResponse.json(
    {
      error: sendRes.error || 'Gửi file sao lưu lên Telegram thất bại',
      telegramConfig: telegramBackup.config,
      serverTime: new Date().toISOString(),
    },
    { status: 400 }
  );
}
