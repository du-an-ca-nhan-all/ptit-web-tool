import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { dispatchDatabaseRestore } from '@/src/features/telegram/server/telegramDispatcher';
import {
  listLocalBackups,
  restoreFromLocalBackup,
  restoreFromSqlDump,
  restoreFromSqliteFile,
  restoreFromJsonDump,
} from '@/src/features/database-backup/server/backupServerService';
import type { BackupAuthUser } from './auth';

export async function handleRestoreUploadedFile(
  req: NextRequest,
  authUser: BackupAuthUser
): Promise<NextResponse> {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json(
      { error: 'Vui lòng chọn file sao lưu (.sql, .json, hoặc .sqlite) để phục hồi' },
      { status: 400 }
    );
  }

  const filename = file.name.toLowerCase();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length === 0) {
    return NextResponse.json({ error: 'File tải lên rỗng' }, { status: 400 });
  }

  let restoreRes: any;
  if (filename.endsWith('.json')) {
    const text = buffer.toString('utf-8');
    restoreRes = await restoreFromJsonDump(text);
  } else if (filename.endsWith('.sql')) {
    const text = buffer.toString('utf-8');
    restoreRes = await restoreFromSqlDump(text);
  } else if (filename.endsWith('.sqlite') || filename.endsWith('.db')) {
    restoreRes = await restoreFromSqliteFile(buffer);
  } else {
    return NextResponse.json(
      { error: 'Định dạng file không được hỗ trợ. Vui lòng tải lên file .sql, .json, hoặc .sqlite / .db' },
      { status: 400 }
    );
  }

  await logActivity({
    req,
    userId: authUser.id,
    username: authUser.username,
    userRole: authUser.role,
    action: 'RESTORE_DATABASE',
    targetType: 'DATABASE',
    targetId: file.name,
    description: `Phục hồi cơ sở dữ liệu PostgreSQL từ file tải lên: ${file.name} (${restoreRes.stats?.totalRecords || 0} bản ghi)`,
    metadata: { filename: file.name, preRestoreBackupFile: restoreRes.preRestoreBackupFile },
  });

  // Dispatch Telegram Notification to Admin
  dispatchDatabaseRestore({
    filename: file.name,
    adminUsername: authUser.username,
    format: filename.split('.').pop()?.toUpperCase() || 'DB',
    success: true,
  }).catch((err) => console.warn("[restoreHandlers] Non-fatal async error:", err));

  const localBackups = listLocalBackups();
  return NextResponse.json({
    success: true,
    message: restoreRes.message,
    preRestoreBackupFile: restoreRes.preRestoreBackupFile,
    stats: restoreRes.stats,
    localBackups,
    serverTime: new Date().toISOString(),
  });
}

export async function handleRestoreSavedBackup(
  req: NextRequest,
  authUser: BackupAuthUser,
  body: Record<string, any>
): Promise<NextResponse> {
  const { filename } = body;
  if (!filename) {
    return NextResponse.json({ error: 'Vui lòng cung cấp tên file cần phục hồi' }, { status: 400 });
  }

  const restoreRes = await restoreFromLocalBackup(filename);

  await logActivity({
    req,
    userId: authUser.id,
    username: authUser.username,
    userRole: authUser.role,
    action: 'RESTORE_DATABASE',
    targetType: 'DATABASE',
    targetId: filename,
    description: `Phục hồi cơ sở dữ liệu từ bản sao lưu máy chủ: ${filename} (${restoreRes.stats?.totalRecords || 0} bản ghi)`,
    metadata: { filename, preRestoreBackupFile: restoreRes.preRestoreBackupFile },
  });

  // Dispatch Telegram Notification to Admin
  dispatchDatabaseRestore({
    filename,
    adminUsername: authUser.username,
    format: filename.split('.').pop()?.toUpperCase() || 'DB',
    success: true,
  }).catch((err) => console.warn("[restoreHandlers] Non-fatal async error:", err));

  const localBackups = listLocalBackups();
  return NextResponse.json({
    success: true,
    message: restoreRes.message,
    preRestoreBackupFile: restoreRes.preRestoreBackupFile,
    stats: restoreRes.stats,
    localBackups,
    serverTime: new Date().toISOString(),
  });
}
