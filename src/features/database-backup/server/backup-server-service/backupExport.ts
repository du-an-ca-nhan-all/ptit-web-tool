import { prisma } from '@/src/lib/prisma';
import type { DatabaseStats } from './types';
import { chunkArray, getTableAliases, sqlVal, toCamelCase } from './utils';
import { getDatabaseStats, getPublicTables, getTableDependencyOrder } from './postgresMetadata';

/**
 * 6. Xuất toàn bộ cơ sở dữ liệu sang JSON (Tự động quét tất cả bảng & cột)
 */
export async function exportDatabaseAsJson(): Promise<{
  metadata: {
    appName: string;
    version: string;
    exportedAt: string;
    database: string;
    tables: string[];
    stats: DatabaseStats;
  };
  data: Record<string, any[]>;
}> {
  const stats = await getDatabaseStats();
  const tables = await getPublicTables(prisma);
  const sortedTables = await getTableDependencyOrder(prisma, tables);

  const data: Record<string, any[]> = {};

  for (const tableName of sortedTables) {
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."${tableName}";`);
      const rowData = Array.isArray(rows) ? rows : [];
      data[tableName] = rowData;

      // Tạo thêm alias camelCase và plural để tương thích ngược 100% với code cũ
      const camel = toCamelCase(tableName);
      data[camel] = rowData;
      for (const alias of getTableAliases(tableName)) {
        data[alias] = rowData;
      }
    } catch (err: any) {
      console.warn(`[BackupService] Lỗi khi đọc dữ liệu bảng ${tableName}:`, err.message);
      data[tableName] = [];
    }
  }

  return {
    metadata: {
      appName: 'PTIT Web Tool - Exam & Schedule Portal',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      database: 'PostgreSQL',
      tables: sortedTables,
      stats,
    },
    data,
  };
}

/**
 * 7. Xuất toàn bộ cơ sở dữ liệu sang SQL Dump (Tự động 100% bảng, cột & sequences)
 */
export async function exportDatabaseAsSqlDump(): Promise<string> {
  const stats = await getDatabaseStats();
  const tables = await getPublicTables(prisma);
  const sortedTables = await getTableDependencyOrder(prisma, tables);

  const lines: string[] = [];
  lines.push('-- ================================================================');
  lines.push('-- PTIT WEB TOOL - DYNAMIC POSTGRESQL DATABASE BACKUP (.sql)');
  lines.push(`-- App: PTIT Web Tool (v2.0.0)`);
  lines.push(`-- Exported At: ${new Date().toISOString()}`);
  lines.push(`-- Total Records: ${stats.totalRecords.toLocaleString('vi-VN')}`);
  lines.push(`-- Total Tables: ${tables.length} (${tables.join(', ')})`);
  lines.push('-- ================================================================');
  lines.push('');
  lines.push('BEGIN;');
  lines.push("SET session_replication_role = 'replica';");
  lines.push('');

  // 1. Truncate theo thứ tự đảo ngược ràng buộc (con trước, cha sau)
  const cleanTables = [...sortedTables].reverse();
  const truncateList = cleanTables.map((t) => `"public"."${t}"`).join(', ');
  if (truncateList) {
    lines.push('-- 1. Clean existing records in cascade');
    lines.push(`TRUNCATE TABLE ${truncateList} CASCADE;`);
    lines.push('');
  }

  // 2. Nạp dữ liệu từng bảng động theo thứ tự cha trước con sau
  for (const tableName of sortedTables) {
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."${tableName}";`);
      if (!Array.isArray(rows) || rows.length === 0) {
        continue;
      }

      lines.push(`-- Table: "${tableName}" (${rows.length} rows)`);
      const columns = Object.keys(rows[0]);
      const quotedCols = columns.map((c) => `"${c}"`).join(', ');

      // Nhóm theo chunk 100 dòng cho mỗi câu lệnh INSERT để file gọn và tốc độ nạp nhanh
      const rowChunks = chunkArray(rows, 100);
      for (const chunk of rowChunks) {
        const valuesList = chunk.map((r) => {
          const vals = columns.map((col) => sqlVal(r[col]));
          return `(${vals.join(', ')})`;
        });
        lines.push(`INSERT INTO "public"."${tableName}" (${quotedCols}) VALUES`);
        lines.push(`  ${valuesList.join(',\n  ')};`);
      }
      lines.push('');
    } catch (err: any) {
      console.warn(`[BackupService] Lỗi khi tạo SQL dump cho bảng ${tableName}:`, err.message);
    }
  }

  lines.push("SET session_replication_role = 'origin';");
  lines.push('');
  lines.push('-- Reset all auto-increment sequences dynamically');

  try {
    const seqCols: any = await prisma.$queryRawUnsafe(`
      SELECT 
        c.table_name, 
        c.column_name, 
        pg_get_serial_sequence('"' || c.table_name || '"', c.column_name) AS seq_name
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND pg_get_serial_sequence('"' || c.table_name || '"', c.column_name) IS NOT NULL;
    `);

    if (Array.isArray(seqCols)) {
      for (const { table_name, column_name, seq_name } of seqCols) {
        if (seq_name) {
          lines.push(`SELECT setval('${seq_name}', coalesce(max("${column_name}"), 1), max("${column_name}") IS NOT NULL) FROM "public"."${table_name}";`);
        }
      }
    }
  } catch (caughtError) {
    console.warn(`[backupExport] Non-fatal error:`, caughtError);
  }

  lines.push('');
  lines.push('COMMIT;');
  lines.push('');

  return lines.join('\n');
}
