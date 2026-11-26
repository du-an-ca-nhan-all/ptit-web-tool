import { prisma } from '@/src/lib/prisma';
import type { DatabaseStats } from './types';
import { chunkArray, getTableAliases } from './utils';
import { getDatabaseStats, getPublicTables, getTableDependencyOrder, syncPostgresSequences } from './postgresMetadata';
import { createLocalBackup } from './localBackupStorage';

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
    let rows: any[] | undefined;

    if (Array.isArray(data[tableName])) {
      rows = data[tableName];
    } else {
      const aliases = getTableAliases(tableName);
      for (const alias of aliases) {
        if (Array.isArray(data[alias])) {
          rows = data[alias];
          break;
        }
      }
    }

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
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "public"."${tableName}";`);
    } catch (delErr: any) {
      console.warn(`[Restore Warning] Không thể xoá bảng "${tableName}":`, delErr.message);
    }
  }

  // 5. Nạp dữ liệu mới theo thứ tự cha trước, con sau (Batch dynamic INSERT an toàn)
  let totalRestored = 0;

  for (const tableName of sortedTables) {
    const rows = tableRowsMap.get(tableName);
    if (!rows || rows.length === 0) continue;

    // Tìm tất cả các cột xuất hiện trong tập dữ liệu của bảng
    const columnSet = new Set<string>();
    for (const r of rows) {
      if (r && typeof r === 'object') {
        Object.keys(r).forEach((c) => columnSet.add(c));
      }
    }

    const columns = Array.from(columnSet);
    if (columns.length === 0) continue;

    const quotedCols = columns.map((c) => `"${c}"`).join(', ');

    // Giới hạn số tham số dưới 30,000 để tránh tràn giới hạn 65,535 của PostgreSQL
    const maxParams = 30000;
    const batchSize = Math.max(1, Math.min(500, Math.floor(maxParams / columns.length)));
    const chunks = chunkArray(rows, batchSize);

    for (const chunk of chunks) {
      const placeholders: string[] = [];
      const flatValues: any[] = [];
      let pIndex = 1;

      for (const row of chunk) {
        const rowPlaceholders: string[] = [];
        for (const col of columns) {
          rowPlaceholders.push(`$${pIndex++}`);
          let val = row[col];
          if (val !== null && val !== undefined && typeof val === 'object' && !(val instanceof Date) && !Buffer.isBuffer(val)) {
            val = JSON.stringify(val);
          }
          flatValues.push(val === undefined ? null : val);
        }
        placeholders.push(`(${rowPlaceholders.join(', ')})`);
      }

      const insertSql = `INSERT INTO "public"."${tableName}" (${quotedCols}) VALUES ${placeholders.join(', ')};`;
      await prisma.$executeRawUnsafe(insertSql, ...flatValues);
    }

    totalRestored += rows.length;
  }

  // Bật lại ràng buộc triggers / foreign keys
  if (replicaRoleSet) {
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`).catch(() => {});
  }

  // 6. Tự động đồng bộ toàn bộ sequences ID trên PostgreSQL
  await syncPostgresSequences().catch(() => {});

  const stats = await getDatabaseStats();

  return {
    success: true,
    message: `Phục hồi cơ sở dữ liệu từ file JSON thành công! Đã nạp ${totalRestored.toLocaleString('vi-VN')} bản ghi trên ${tableRowsMap.size} bảng.`,
    recordsRestored: totalRestored,
    preRestoreBackupFile: preRestoreName,
    stats,
  };
}
