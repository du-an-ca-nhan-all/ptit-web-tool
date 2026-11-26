import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { prisma } from '@/src/lib/prisma';
import type { DatabaseStats } from './types';
import { generateTimestampString } from './utils';
import { getDatabaseStats, syncPostgresSequences } from './postgresMetadata';
import { createLocalBackup, getSafeBackupFilePath } from './localBackupStorage';
import { restoreFromJsonDump } from './restoreJson';

/**
 * Phục hồi cơ sở dữ liệu từ file SQL Dump PostgreSQL (.sql)
 */
export async function restoreFromSqlDump(
  sqlContent: string
): Promise<{
  success: boolean;
  message: string;
  preRestoreBackupFile: string;
  stats: DatabaseStats;
}> {
  // 1. Tạo bản sao lưu an toàn trước khi phục hồi
  const preRestoreFiles = await createLocalBackup('sql');
  const preRestoreName = preRestoreFiles[0]?.name || 'pre-restore-backup.sql';

  try {
    await prisma.$executeRawUnsafe(sqlContent);
  } catch (err: any) {
    // Nếu khối lớn lỗi, tách theo dấu chấm phẩy và thực thi từng lệnh
    const statements = sqlContent
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
      if (stmt) {
        await prisma.$executeRawUnsafe(stmt).catch((e) => {
          console.warn(`[Restore SQL Warning]: Statement failed: ${stmt.substring(0, 60)}...`, e.message);
        });
      }
    }
  }

  await syncPostgresSequences().catch((err) => console.warn("[restoreSqlAndLocal] Non-fatal async error:", err));
  const stats = await getDatabaseStats();

  return {
    success: true,
    message: `Phục hồi cơ sở dữ liệu từ file SQL Dump PostgreSQL thành công! Tổng cộng ${stats.totalRecords.toLocaleString('vi-VN')} bản ghi trên ${stats.tableBreakdown.length} bảng.`,
    preRestoreBackupFile: preRestoreName,
    stats,
  };
}

/**
 * Phục hồi cơ sở dữ liệu từ file SQLite (.sqlite / .db) và nạp tự động vào PostgreSQL
 */
export async function restoreFromSqliteFile(
  sourcePathOrBuffer: string | Buffer
): Promise<{
  success: boolean;
  message: string;
  recordsRestored: number;
  preRestoreBackupFile: string;
  stats: DatabaseStats;
}> {
  const timestamp = generateTimestampString();
  const tempDir = path.join(process.cwd(), 'backups', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  let tempSqlitePath = '';
  if (typeof sourcePathOrBuffer === 'string') {
    if (!fs.existsSync(sourcePathOrBuffer)) {
      throw new Error(`File sao lưu SQLite không tồn tại: ${sourcePathOrBuffer}`);
    }
    tempSqlitePath = sourcePathOrBuffer;
  } else {
    tempSqlitePath = path.join(tempDir, `temp-restore-${timestamp}.sqlite`);
    fs.writeFileSync(tempSqlitePath, sourcePathOrBuffer);
  }

  try {
    // Tự động quét 100% tất cả các bảng trong SQLite không cần hardcode
    const pythonScript = `
import sqlite3, json, sys

db_path = sys.argv[1]
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
tables = [row[0] for row in cur.fetchall()]

data = {}
for tbl in tables:
    try:
        cur.execute(f'SELECT * FROM "{tbl}"')
        rows = [dict(r) for r in cur.fetchall()]
        data[tbl] = rows
    except Exception:
        data[tbl] = []

print(json.dumps({"data": data}))
conn.close()
`;
    const output = execFileSync('python3', ['-c', pythonScript, tempSqlitePath], {
      maxBuffer: 100 * 1024 * 1024,
      encoding: 'utf8',
    });
    const parsed = JSON.parse(output);
    const result = await restoreFromJsonDump(parsed);
    return {
      ...result,
      message: `Đã chuyển đổi và phục hồi thành công dữ liệu từ file SQLite vào PostgreSQL! (${result.recordsRestored} bản ghi)`,
    };
  } catch (err: any) {
    throw new Error(`Không thể trích xuất dữ liệu từ file SQLite để nạp vào PostgreSQL: ${err.message}`);
  } finally {
    if (typeof sourcePathOrBuffer !== 'string' && fs.existsSync(tempSqlitePath)) {
      try { fs.unlinkSync(tempSqlitePath); } catch (caughtError) {
        console.warn(`[restoreSqlAndLocal] Non-fatal error:`, caughtError);
      }
    }
  }
}

/**
 * Phục hồi từ một file sao lưu đã có sẵn trong thư mục backups/
 */
export async function restoreFromLocalBackup(filename: string): Promise<{
  success: boolean;
  message: string;
  preRestoreBackupFile: string;
  stats: DatabaseStats;
  recordsRestored?: number;
}> {
  const filePath = getSafeBackupFilePath(filename);
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`File sao lưu không tồn tại trên máy chủ: ${filename}`);
  }

  if (filename.endsWith('.json')) {
    const jsonContent = fs.readFileSync(filePath, 'utf-8');
    return await restoreFromJsonDump(jsonContent);
  } else if (filename.endsWith('.sql')) {
    const sqlContent = fs.readFileSync(filePath, 'utf-8');
    return await restoreFromSqlDump(sqlContent);
  } else if (filename.endsWith('.sqlite') || filename.endsWith('.db')) {
    return await restoreFromSqliteFile(filePath);
  } else {
    throw new Error('Định dạng file sao lưu không được hỗ trợ (chỉ chấp nhận .sql, .json, .sqlite, .db)');
  }
}
