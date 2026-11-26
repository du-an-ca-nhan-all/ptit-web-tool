import { PrismaClient } from '@prisma/client';
import { assertSafeSqlIdentifier } from '../../src/lib/sqlSafety';

// Chia mảng thành các chunk nhỏ hơn
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export interface CopyTablesDataParams {
  prodPrisma: PrismaClient;
  devPrisma: PrismaClient;
  sortedTables: string[];
  tableCounts: Map<string, number>;
}

function serializeTransferValue(rawValue: any): any {
  if (rawValue !== null && typeof rawValue === 'object' && !(rawValue instanceof Date) && !Buffer.isBuffer(rawValue)) {
    return JSON.stringify(rawValue);
  }
  return rawValue;
}

async function insertDevChunk(params: {
  devPrisma: PrismaClient;
  safeTableName: string;
  columns: string[];
  quotedCols: string;
  chunk: any[];
}): Promise<void> {
  const { devPrisma, safeTableName, columns, quotedCols, chunk } = params;
  const placeholders: string[] = [];
  const flatValues: any[] = [];
  let pIndex = 1;

  for (const row of chunk) {
    const rowPlaceholders: string[] = [];
    for (const col of columns) {
      rowPlaceholders.push(`$${pIndex++}`);
      flatValues.push(serializeTransferValue(row[col]));
    }
    placeholders.push(`(${rowPlaceholders.join(', ')})`);
  }

  const insertSql = `INSERT INTO "public"."${safeTableName}" (${quotedCols}) VALUES ${placeholders.join(', ')};`;
  await devPrisma.$executeRawUnsafe(insertSql, ...flatValues);
}

/**
 * Nạp dữ liệu động từ PROD sang DEV theo thứ tự ràng buộc khoá ngoại
 */
export async function copyTablesData({
  prodPrisma,
  devPrisma,
  sortedTables,
  tableCounts,
}: CopyTablesDataParams): Promise<number> {
  // Tạm thời tắt ràng buộc triggers/foreign keys nếu quyền cho phép
  let replicaRoleSet = false;
  try {
    await devPrisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`);
    replicaRoleSet = true;
  } catch (caughtError) {
    console.warn(`[data-transfer] Non-fatal error:`, caughtError);
  }

  let copiedRecords = 0;
  for (const tableName of sortedTables) {
    const count = tableCounts.get(tableName) || 0;
    if (count === 0) {
      console.log(`  ○ Bảng ${tableName}: 0 bản ghi (bỏ qua)`);
      continue;
    }

    const safeTableName = assertSafeSqlIdentifier(tableName, 'table name');

    // Đọc toàn bộ dữ liệu của bảng từ PROD
    const rows: any[] = await prodPrisma.$queryRawUnsafe(`SELECT * FROM "public"."${safeTableName}";`);
    if (!Array.isArray(rows) || rows.length === 0) {
      continue;
    }

    const columns = Object.keys(rows[0]);
    const quotedCols = columns.map((c) => `"${assertSafeSqlIdentifier(c, 'column name')}"`).join(', ');

    // Giới hạn số tham số dưới 30,000 (PostgreSQL tối đa 65,535 params)
    const maxParams = 30000;
    const batchSize = Math.max(1, Math.min(500, Math.floor(maxParams / columns.length)));
    const chunks = chunkArray(rows, batchSize);

    for (const chunk of chunks) {
      await insertDevChunk({ devPrisma, safeTableName, columns, quotedCols, chunk });
    }

    copiedRecords += rows.length;
    console.log(`  ✓ Đã nạp ${tableName}: ${rows.length.toLocaleString('vi-VN')} bản ghi`);
  }

  // Bật lại triggers/foreign keys
  if (replicaRoleSet) {
    await devPrisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`).catch((err) => {
      console.warn('[data-transfer] Failed to restore session_replication_role to origin:', err);
    });
  }

  return copiedRecords;
}
