import { prisma } from '@/src/lib/prisma';
import { assertSafeSqlIdentifier } from '@/src/lib/sqlSafety';
import type { DatabaseStats } from './types';
import { chunkArray, getTableAliases } from './utils';
import { getDatabaseStats, getPublicTables, getTableDependencyOrder, syncPostgresSequences } from './postgresMetadata';
import { createLocalBackup } from './localBackupStorage';

function resolveRowsForTable(data: Record<string, any>, tableName: string): any[] | undefined {
  if (Array.isArray(data[tableName])) return data[tableName];
  for (const alias of getTableAliases(tableName)) {
    if (Array.isArray(data[alias])) return data[alias];
  }
  return undefined;
}

function serializeSqlParamValue(rawValue: any): any {
  if (rawValue === undefined) return null;
  if (rawValue !== null && typeof rawValue === 'object' && !(rawValue instanceof Date) && !Buffer.isBuffer(rawValue)) {
    return JSON.stringify(rawValue);
  }
  return rawValue;
}

async function insertTableChunk(params: {
  safeTableName: string;
  columns: string[];
  quotedCols: string;
  chunk: any[];
}): Promise<void> {
  const { safeTableName, columns, quotedCols, chunk } = params;
  const placeholders: string[] = [];
  const flatValues: any[] = [];
  let pIndex = 1;

  for (const row of chunk) {
    const rowPlaceholders: string[] = [];
    for (const col of columns) {
      rowPlaceholders.push(`$${pIndex++}`);
      flatValues.push(serializeSqlParamValue(row[col]));
    }
    placeholders.push(`(${rowPlaceholders.join(', ')})`);
  }

  const insertSql = `INSERT INTO "public"."${safeTableName}" (${quotedCols}) VALUES ${placeholders.join(', ')};`;
  await prisma.$executeRawUnsafe(insertSql, ...flatValues);
}

/**
 * Phục hồi cơ sở dữ liệu từ file JSON dump (Tự động nạp động 100% bảng & cột)
 */
export async function restoreFromJsonDump(
  jsonContent: string | object
): Promise<{
  success: boolean;
  message: string;
  recordsRestored: number;
  preRestoreBackupFile: string;
  stats: DatabaseStats;
}> {
  let parsed: any;
  if (typeof jsonContent === 'string') {
    try {
      parsed = JSON.parse(jsonContent);
    } catch (e: any) {
      throw new Error(`Nội dung file JSON không hợp lệ: ${e.message}`);
    }
  } else {
    parsed = jsonContent;
  }

  const data = parsed.data || parsed;
  if (!data || typeof data !== 'object') {
    throw new Error('Cấu trúc file JSON sao lưu không đúng định dạng (thiếu trường data)');
  }

  // 1. Tạo bản sao lưu an toàn trước khi phục hồi
  const preRestoreFiles = await createLocalBackup('sql');
  const preRestoreName = preRestoreFiles[0]?.name || 'pre-restore-backup.sql';

  // 2. Lấy danh sách bảng trong Database đích và sắp xếp theo quan hệ khoá ngoại
  const dbTables = await getPublicTables(prisma);
  const sortedTables = await getTableDependencyOrder(prisma, dbTables);

  // 3. Chuẩn bị map dữ liệu cần nạp cho từng bảng (khớp cả PascalCase, camelCase, alias)
  const tableRowsMap = new Map<string, any[]>();

  for (const tableName of sortedTables) {
    const rows = resolveRowsForTable(data, tableName);
    if (rows && rows.length > 0) {
      tableRowsMap.set(tableName, rows);
    }
  }

  // Tạm tắt ràng buộc ngoại nếu quyền hạn cho phép
  let replicaRoleSet = false;
  try {
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`);
    replicaRoleSet = true;
  } catch (caughtError) {
    console.warn(`[restoreJson] Non-fatal error:`, caughtError);
  }

  // 4. Xóa sạch dữ liệu cũ theo thứ tự con trước, cha sau
  const reverseSorted = [...sortedTables].reverse();
  for (const tableName of reverseSorted) {
    const safeTableName = assertSafeSqlIdentifier(tableName, 'table name');
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "public"."${safeTableName}";`);
    } catch (delErr: any) {
      console.warn(`[Restore Warning] Không thể xoá bảng "${tableName}":`, delErr.message);
    }
  }

  // 5. Nạp dữ liệu mới theo thứ tự cha trước, con sau (Batch dynamic INSERT an toàn)
  let totalRestored = 0;

  for (const tableName of sortedTables) {
    const rows = tableRowsMap.get(tableName);
    if (!rows || rows.length === 0) continue;

    const safeTableName = assertSafeSqlIdentifier(tableName, 'table name');

    // Tìm tất cả các cột xuất hiện trong tập dữ liệu của bảng
    const columnSet = new Set<string>();
    for (const r of rows) {
      if (r && typeof r === 'object') {
        Object.keys(r).forEach((c) => columnSet.add(c));
      }
    }

    const columns = Array.from(columnSet);
    if (columns.length === 0) continue;

    const quotedCols = columns.map((c) => `"${assertSafeSqlIdentifier(c, 'column name')}"`).join(', ');

    // Giới hạn số tham số dưới 30,000 để tránh tràn giới hạn 65,535 của PostgreSQL
    const maxParams = 30000;
    const batchSize = Math.max(1, Math.min(500, Math.floor(maxParams / columns.length)));
    const chunks = chunkArray(rows, batchSize);

    for (const chunk of chunks) {
      await insertTableChunk({ safeTableName, columns, quotedCols, chunk });
    }

    totalRestored += rows.length;
  }

  // Bật lại ràng buộc triggers / foreign keys
  if (replicaRoleSet) {
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`).catch((err) => {
      console.warn('[restoreJson] Failed to restore session_replication_role to origin:', err);
    });
  }

  // 6. Tự động đồng bộ toàn bộ sequences ID trên PostgreSQL
  await syncPostgresSequences().catch((err) => console.warn("[restoreJson] Non-fatal async error:", err));

  const stats = await getDatabaseStats();

  return {
    success: true,
    message: `Phục hồi cơ sở dữ liệu từ file JSON thành công! Đã nạp ${totalRestored.toLocaleString('vi-VN')} bản ghi trên ${tableRowsMap.size} bảng.`,
    recordsRestored: totalRestored,
    preRestoreBackupFile: preRestoreName,
    stats,
  };
}
