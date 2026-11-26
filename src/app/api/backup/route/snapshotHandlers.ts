import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJsonBody } from '@/src/lib/requestValidation';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { dispatchDatabaseExportOrBackup } from '@/src/features/telegram/server/telegramDispatcher';
import {
  getDatabaseStats,
  createLocalBackup,
  listLocalBackups,
  deleteLocalBackup,
} from '@/src/features/database-backup/server/backupServerService';
import type { BackupAuthUser } from './auth';

export async function handleCreateSnapshot(
  req: NextRequest,
  authUser: BackupAuthUser
): Promise<NextResponse> {
  const createdFiles = await createLocalBackup('sql');

  await logActivity({
    req,
    userId: authUser.id,
    username: authUser.username,
    userRole: authUser.role,
    action: 'CREATE_SERVER_BACKUP',
    targetType: 'DATABASE',
    targetId: createdFiles.map((f) => f.name).join(', '),
    description: `Tạo bản sao lưu PostgreSQL (.sql) trên máy chủ: ${createdFiles.map((f) => f.name).join(', ')}`,
    metadata: { format: 'sql', createdFiles },
  });

  const stats = await getDatabaseStats();
  const localBackups = listLocalBackups();

  // Dispatch Telegram Notification to Admin
  dispatchDatabaseExportOrBackup({
    action: 'MANUAL_SNAPSHOT',
    filename: createdFiles.map((f) => f.name).join(', '),
    fileSize: createdFiles.reduce((acc, f) => acc + (f.size || 0), 0),
    adminUsername: authUser.username,
    description: `Quản trị viên ${authUser.username} tạo ${createdFiles.length} bản snapshot sao lưu máy chủ (.SQL)`,
    tableStats: stats.tables,
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    message: `Đã tạo thành công ${createdFiles.length} bản sao lưu SQL trên máy chủ`,
    createdFiles,
    stats,
    localBackups,
    serverTime: new Date().toISOString(),
  });
}

const deleteBackupSchema = z.object({
  filename: z.string().nullish(),
}).passthrough();

export async function handleDeleteBackup(
  req: NextRequest,
  authUser: BackupAuthUser
): Promise<NextResponse> {
  const queryFilename = new URL(req.url).searchParams.get('filename');
  let body: z.infer<typeof deleteBackupSchema> = {};
  if (req.headers.get('content-type')?.includes('application/json') || !queryFilename) {
    const parsed = await parseJsonBody(req, deleteBackupSchema);
    if (!parsed.ok) return parsed.response;
    body = parsed.data;
  }
  const filename = body.filename || queryFilename;

  if (!filename) {
    return NextResponse.json({ error: 'Vui lòng cung cấp tên file cần xoá' }, { status: 400 });
  }

  const deleted = deleteLocalBackup(filename);
  if (!deleted) {
    return NextResponse.json({ error: 'Không tìm thấy file hoặc không thể xoá file sao lưu' }, { status: 404 });
  }

  await logActivity({
    req,
    userId: authUser.id,
    username: authUser.username,
    userRole: authUser.role,
    action: 'DELETE_SERVER_BACKUP',
    targetType: 'DATABASE',
    targetId: filename,
    description: `Xoá file sao lưu trên máy chủ: ${filename}`,
    metadata: { filename },
  });

  const localBackups = listLocalBackups();
  return NextResponse.json({
    success: true,
    message: `Đã xoá file sao lưu ${filename} thành công`,
    localBackups,
    serverTime: new Date().toISOString(),
  });
}
