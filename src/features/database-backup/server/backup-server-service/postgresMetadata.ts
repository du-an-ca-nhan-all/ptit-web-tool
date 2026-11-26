import fs from 'fs';
import { prisma } from '@/src/lib/prisma';
import { assertSafeSqlIdentifier } from '@/src/lib/sqlSafety';
import type { DatabaseStats, TableStat } from './types';
import { formatBytes, getDatabaseFilePath } from './utils';

/**
 * 1. Tự động lấy danh sách toàn bộ các bảng trong public schema (Ném lỗi ngay nếu thất bại)
 */
export async function getPublicTables(prismaClient = prisma): Promise<string[]> {
  const rows: any = await prismaClient.$queryRawUnsafe(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename ASC;
  `);
  if (!Array.isArray(rows)) {
    throw new Error('Không thể truy vấn danh sách bảng từ pg_tables: Định dạng kết quả không hợp lệ');
  }
  if (rows.length === 0) {
    throw new Error('Không tìm thấy bảng nào trong public schema của cơ sở dữ liệu PostgreSQL');
  }
  return rows.map((r: any) => r.tablename);
}

/**
 * 2. Đếm số bản ghi cho từng bảng một cách tự động
 */
export async function getTableRecordCounts(
  prismaClient = prisma,
  tables: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (const table of tables) {
    const safeTable = assertSafeSqlIdentifier(table, 'table name');
    try {
      const res: any = await prismaClient.$queryRawUnsafe(`SELECT COUNT(*)::bigint AS count FROM "public"."${safeTable}";`);
      counts.set(table, Number(res[0]?.count || 0));
    } catch (err: any) {
      console.warn(`[BackupService] Lỗi khi đếm số bản ghi bảng "${table}":`, err.message);
      counts.set(table, 0);
    }
  }
  return counts;
}

function sortTablesTopologically(tables: string[], fkRows: any[]): string[] {
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, Set<string>>();
  const dependencies = new Map<string, Set<string>>();

  for (const t of tables) {
    inDegree.set(t, 0);
    dependents.set(t, new Set());
    dependencies.set(t, new Set());
  }

  for (const { child_table, parent_table } of fkRows) {
    if (!tables.includes(child_table) || !tables.includes(parent_table)) continue;
    if (dependencies.get(child_table)!.has(parent_table)) continue;
    dependencies.get(child_table)!.add(parent_table);
    dependents.get(parent_table)!.add(child_table);
    inDegree.set(child_table, (inDegree.get(child_table) || 0) + 1);
  }

  const queue = tables.filter((t) => inDegree.get(t) === 0);
  const sorted: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    for (const child of dependents.get(current) || []) {
      const newDeg = (inDegree.get(child) || 1) - 1;
      inDegree.set(child, newDeg);
      if (newDeg === 0) queue.push(child);
    }
  }

  for (const t of tables) {
    if (!sorted.includes(t)) sorted.push(t);
  }

  return sorted;
}

async function syncSingleSequence(
  prismaClient: typeof prisma,
  row: { table_name: string; column_name: string; seq_name?: string }
): Promise<boolean> {
  if (!row.seq_name) return false;
  const safeTable = assertSafeSqlIdentifier(row.table_name, 'table name');
  const safeColumn = assertSafeSqlIdentifier(row.column_name, 'column name');
  try {
    await prismaClient.$executeRawUnsafe(`
      SELECT setval(
        $1, 
        COALESCE((SELECT MAX("${safeColumn}") FROM "public"."${safeTable}"), 1), 
        (SELECT MAX("${safeColumn}") IS NOT NULL FROM "public"."${safeTable}")
      );
    `, row.seq_name);
    return true;
  } catch (caughtError) {
    console.warn(`[postgresMetadata] Non-fatal error:`, caughtError);
    return false;
  }
}

/**
 * 3. Phân tích quan hệ Foreign Key & Sắp xếp thứ tự nạp bảng theo Topological Sort
 *    (Bảng cha được nạp trước, bảng con chứa khoá ngoại được nạp sau)
 */
export async function getTableDependencyOrder(
  prismaClient = prisma,
  tables: string[]
): Promise<string[]> {
  try {
    const fkRows: any = await prismaClient.$queryRawUnsafe(`
      SELECT
        tc.table_name AS child_table,
        ccu.table_name AS parent_table
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public'
        AND tc.table_name != ccu.table_name;
    `);
    return sortTablesTopologically(tables, Array.isArray(fkRows) ? fkRows : []);
  } catch {
    return tables;
  }
}

/**
 * 4. Tự động đồng bộ TẤT CẢ auto-increment sequences trên PostgreSQL
 *    (Dò tìm tự động từ pg_get_serial_sequence, không cần hardcode)
 */
export async function syncPostgresSequences(prismaClient = prisma): Promise<number> {
  try {
    const seqCols: any = await prismaClient.$queryRawUnsafe(`
      SELECT 
        c.table_name, 
        c.column_name, 
        pg_get_serial_sequence('"' || c.table_name || '"', c.column_name) AS seq_name
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND pg_get_serial_sequence('"' || c.table_name || '"', c.column_name) IS NOT NULL;
    `);

    if (!Array.isArray(seqCols)) return 0;
    let count = 0;
    for (const row of seqCols) {
      if (await syncSingleSequence(prismaClient, row)) count++;
    }
    return count;
  } catch {
    return 0;
  }
}

/**
 * 5. Lấy thống kê cơ sở dữ liệu động toàn diện
 */
export async function getDatabaseStats(): Promise<DatabaseStats> {
  const tables = await getPublicTables(prisma);
  const tableCounts = await getTableRecordCounts(prisma, tables);

  let dbFileSize = 0;
  let dbLastModified: string | null = null;

  try {
    const res: any = await (prisma as any).$queryRawUnsafe?.('SELECT pg_database_size(current_database()) AS size;');
    if (res && res[0] && res[0].size !== undefined) {
      dbFileSize = Number(res[0].size);
      dbLastModified = new Date().toISOString();
    }
  } catch {
    const dbPath = getDatabaseFilePath();
    if (fs.existsSync(dbPath)) {
      const stat = fs.statSync(dbPath);
      dbFileSize = stat.size;
      dbLastModified = stat.mtime.toISOString();
    }
  }

  const tableStats: Record<string, number> = {};
  let totalRecords = 0;

  for (const [tbl, count] of tableCounts.entries()) {
    tableStats[tbl] = count;
    totalRecords += count;
  }

  const tableBreakdown: TableStat[] = tables.map((tbl) => ({
    name: tbl,
    label: tbl,
    count: tableCounts.get(tbl) || 0,
    description: `Bảng dữ liệu "${tbl}"`,
  }));

  return {
    tables: tableStats as any,
    tableBreakdown,
    totalRecords,
    dbFileSize,
    dbFileSizeFormatted: formatBytes(dbFileSize),
    dbLastModified,
  };
}
