import { PrismaClient } from '@prisma/client';

/**
 * 1. Lấy danh sách toàn bộ các bảng trong public schema
 */
export async function getPublicTables(prismaClient: PrismaClient): Promise<string[]> {
  const rows: any = await prismaClient.$queryRawUnsafe(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename ASC;
  `);
  if (!Array.isArray(rows)) return [];
  return rows.map((r: any) => r.tablename);
}

/**
 * 2. Đếm số bản ghi cho từng bảng
 */
export async function getTableRecordCounts(prismaClient: PrismaClient, tables: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (const table of tables) {
    try {
      const res: any = await prismaClient.$queryRawUnsafe(`SELECT COUNT(*)::bigint AS count FROM "public"."${table}";`);
      counts.set(table, Number(res[0]?.count || 0));
    } catch {
      counts.set(table, 0);
    }
  }
  return counts;
}

/**
 * 3. Phân tích quan hệ Foreign Key & Sắp xếp thứ tự nạp bảng theo Topological Sort
 *    (Bảng cha được nạp trước, bảng con chứa khoá ngoại được nạp sau)
 */
export async function getTableDependencyOrder(prismaClient: PrismaClient, tables: string[]): Promise<string[]> {
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

    const inDegree = new Map<string, number>();
    const dependents = new Map<string, Set<string>>(); // parent -> children
    const dependencies = new Map<string, Set<string>>(); // child -> parents

    for (const t of tables) {
      inDegree.set(t, 0);
      dependents.set(t, new Set());
      dependencies.set(t, new Set());
    }

    if (Array.isArray(fkRows)) {
      for (const { child_table, parent_table } of fkRows) {
        if (tables.includes(child_table) && tables.includes(parent_table)) {
          if (!dependencies.get(child_table)!.has(parent_table)) {
            dependencies.get(child_table)!.add(parent_table);
            dependents.get(parent_table)!.add(child_table);
            inDegree.set(child_table, (inDegree.get(child_table) || 0) + 1);
          }
        }
      }
    }

    // Hàng đợi các bảng không phụ thuộc bảng nào
    const queue: string[] = [];
    for (const t of tables) {
      if (inDegree.get(t) === 0) {
        queue.push(t);
      }
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      sorted.push(current);

      for (const child of dependents.get(current) || []) {
        const newDeg = (inDegree.get(child) || 1) - 1;
        inDegree.set(child, newDeg);
        if (newDeg === 0) {
          queue.push(child);
        }
      }
    }

    // Nếu có chu trình phụ thuộc vòng quanh, bổ sung các bảng còn lại vào cuối
    for (const t of tables) {
      if (!sorted.includes(t)) {
        sorted.push(t);
      }
    }

    return sorted;
  } catch {
    // Nếu lỗi phân tích FK, giữ nguyên thứ tự ban đầu
    return tables;
  }
}

export function printProdTablesSummary(prodTables: string[], tableCounts: Map<string, number>): void {
  let totalRecords = 0;
  for (const count of tableCounts.values()) {
    totalRecords += count;
  }

  console.log(`  📊 Đã phát hiện ${prodTables.length} bảng dữ liệu trên PROD (${totalRecords.toLocaleString('vi-VN')} bản ghi):`);
  console.log('  ┌────┬─────────────────────────────────────┬────────────┐');
  console.log('  │ STT│ Tên bảng dữ liệu                    │ Số bản ghi │');
  console.log('  ├────┼─────────────────────────────────────┼────────────┤');
  prodTables.forEach((tbl, idx) => {
    const cnt = tableCounts.get(tbl) || 0;
    console.log(`  │ ${String(idx + 1).padStart(2, ' ')} │ ${tbl.padEnd(35, ' ')} │ ${String(cnt).padStart(10, ' ')} │`);
  });
  console.log('  └────┴─────────────────────────────────────┴────────────┘');
}
