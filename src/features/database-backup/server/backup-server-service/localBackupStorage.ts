import fs from 'fs';
import path from 'path';
import type { LocalBackupFile } from './types';
import { formatBytes, generateTimestampString, getBackupsDirectory } from './utils';
import { exportDatabaseAsSqlDump } from './backupExport';

export async function createLocalBackup(format: 'sql' = 'sql'): Promise<LocalBackupFile[]> {
  const backupsDir = getBackupsDirectory();
  const timestamp = generateTimestampString();
  const createdFiles: LocalBackupFile[] = [];

  // Backup PostgreSQL SQL Dump (.sql)
  const sqlDump = await exportDatabaseAsSqlDump();
  const filename = `ptit-db-backup-${timestamp}.sql`;
  const targetPath = path.join(backupsDir, filename);
  fs.writeFileSync(targetPath, sqlDump, 'utf8');
  const stat = fs.statSync(targetPath);
  createdFiles.push({
    name: filename,
    format: 'sql',
    size: stat.size,
    sizeFormatted: formatBytes(stat.size),
    createdAt: stat.birthtime.toISOString(),
  });

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

      let format: 'sql' | 'json' | 'sqlite' = 'json';
      if (file.endsWith('.json')) {
        format = 'json';
      } else if (file.endsWith('.sql')) {
        format = 'sql';
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
    } catch (caughtError) {
      console.warn(`[localBackupStorage] Non-fatal error:`, caughtError);
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
