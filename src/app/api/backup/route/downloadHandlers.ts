import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { dispatchDatabaseExportOrBackup } from '@/src/features/telegram/server/telegramDispatcher';
import {
  getDatabaseStats,
  exportDatabaseAsSqlDump,
  listLocalBackups,
  getSafeBackupFilePath,
  generateTimestampString,
  getBackupTelegramConfig,
} from '@/src/features/database-backup/server/backupServerService';
import type { BackupAuthUser } from './auth';

function resolveBackupContentType(filename: string): string {
  if (filename.endsWith('.json')) {
    return 'application/json; charset=utf-8';
  }
  if (filename.endsWith('.sql')) {
    return 'application/sql; charset=utf-8';
  }
  if (filename.endsWith('.sqlite') || filename.endsWith('.db')) {
    return 'application/x-sqlite3';
  }
  return 'application/octet-stream';
}

export async function handleDownloadSavedFile(
  req: NextRequest,
  authUser: BackupAuthUser,
  requestedFile: string
): Promise<Response> {
  const filePath = getSafeBackupFilePath(requestedFile);
  if (!filePath || !fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File sao lưu không tồn tại hoặc đã bị xoá' }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  const contentType = resolveBackupContentType(requestedFile);

  await logActivity({
    req,
    userId: authUser.id,
    username: authUser.username,
    userRole: authUser.role,
    action: 'DOWNLOAD_BACKUP',
    targetType: 'DATABASE',
    targetId: requestedFile,
    description: `Tải về file sao lưu cơ sở dữ liệu: ${requestedFile}`,
    metadata: { filename: requestedFile, size: fileBuffer.length },
  });

  return new Response(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(requestedFile)}"`,
      'Content-Length': fileBuffer.length.toString(),
      'Cache-Control': 'no-store',
    },
  });
}

export async function handleDownloadSqlDump(
  req: NextRequest,
  authUser: BackupAuthUser
): Promise<Response> {
  const timestamp = generateTimestampString();
  const sqlDump = await exportDatabaseAsSqlDump();
  const buffer = Buffer.from(sqlDump, 'utf-8');
  const filename = `ptit-db-dump-${timestamp}.sql`;

  await logActivity({
    req,
    userId: authUser.id,
    username: authUser.username,
    userRole: authUser.role,
    action: 'EXPORT_SQL_DATABASE',
    targetType: 'DATABASE',
    targetId: filename,
    description: `Xuất toàn bộ cơ sở dữ liệu PostgreSQL sang file SQL Dump: ${filename}`,
    metadata: { size: buffer.length },
  });

  // Dispatch Telegram Notification to Admin
  dispatchDatabaseExportOrBackup({
    action: 'EXPORT_SQL',
    filename,
    fileSize: buffer.length,
    adminUsername: authUser.username,
    description: `Quản trị viên ${authUser.username} xuất toàn bộ cơ sở dữ liệu PostgreSQL sang file SQL Dump (.sql)`,
  }).catch(() => {});

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/sql; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-store',
    },
  });
}

export async function handleGetBackupOverview(): Promise<NextResponse> {
  const [stats, localBackups, telegramBackup] = await Promise.all([
    getDatabaseStats(),
    Promise.resolve(listLocalBackups()),
    getBackupTelegramConfig(),
  ]);

  return NextResponse.json({
    success: true,
    stats,
    localBackups,
    telegramConfig: telegramBackup.config,
    systemBotInfo: telegramBackup.systemBotInfo,
    serverTime: new Date().toISOString(),
  });
}
