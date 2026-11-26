import { PrismaClient } from '@prisma/client';

// Chia mảng thành các chunk nhỏ hơn
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Nạp dữ liệu động từ PROD sang DEV theo thứ tự ràng buộc khoá ngoại
 */
export async function copyTablesData(
  prodPrisma: PrismaClient,
  devPrisma: PrismaClient,
  sortedTables: string[],
  tableCounts: Map<string, number>,
): Promise<number> {
  // Tạm thời tắt ràng buộc triggers/foreign keys nếu quyền cho phép
  let replicaRoleSet = false;
  try {
    await devPrisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`);
    replicaRoleSet = true;
  } catch {
    // Nếu không có superuser, thứ tự topological sort đã đảm bảo an toàn
  }

  let copiedRecords = 0;
  for (const tableName of sortedTables) {
    const count = tableCounts.get(tableName) || 0;
    if (count === 0) {
      console.log(`  ○ Bảng ${tableName}: 0 bản ghi (bỏ qua)`);
      continue;
    }

    // Đọc toàn bộ dữ liệu của bảng từ PROD
    const rows: any[] = await prodPrisma.$queryRawUnsafe(`SELECT * FROM "public"."${tableName}";`);
    if (!Array.isArray(rows) || rows.length === 0) {
      continue;
    }

    const columns = Object.keys(rows[0]);
    const quotedCols = columns.map((c) => `"${c}"`).join(', ');

    // Giới hạn số tham số dưới 30,000 (PostgreSQL tối đa 65,535 params)
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
          // Format object/array sang JSON string nếu cần
          if (val !== null && typeof val === 'object' && !(val instanceof Date) && !Buffer.isBuffer(val)) {
            val = JSON.stringify(val);
          }
          flatValues.push(val);
        }
        placeholders.push(`(${rowPlaceholders.join(', ')})`);
      }

      const insertSql = `INSERT INTO "public"."${tableName}" (${quotedCols}) VALUES ${placeholders.join(', ')};`;
      await devPrisma.$executeRawUnsafe(insertSql, ...flatValues);
    }

    copiedRecords += rows.length;
    console.log(`  ✓ Đã nạp ${tableName}: ${rows.length.toLocaleString('vi-VN')} bản ghi`);
  }

  // Bật lại triggers/foreign keys
  if (replicaRoleSet) {
    await devPrisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`).catch(() => {});
  }

  return copiedRecords;
}
