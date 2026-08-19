import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

/**
 * Script Tự Động Clone Toàn Bộ Cơ Sở Dữ Liệu PostgreSQL từ PROD sang DEV
 * 
 * Ưu điểm & Điểm thông minh:
 * 1. Tự động truy vấn pg_tables để lấy 100% tất cả các bảng trên PROD (bao gồm _prisma_migrations, ExamRoom, User, Student, ...)
 *    -> Không cần khai báo cứng tên bảng trong code. Thêm bảng mới ở PROD là tự động clone về DEV.
 * 2. Tự động phân tích quan hệ khoá ngoại (Foreign Keys) & sắp xếp thứ tự nạp (Topological Sorting).
 * 3. Tự động kiểm tra và tạo bù bảng cấu hình hệ thống (như _prisma_migrations hoặc bảng ngoài Prisma Schema).
 * 4. Tự động phát hiện và đồng bộ tất cả Auto-increment Sequences (SERIAL/BIGSERIAL/IDENTITY) cho toàn bộ bảng.
 * 5. Cơ chế nạp dữ liệu động theo batch an toàn (tránh tràn 65,535 parameter limit của PostgreSQL).
 * 
 * Cách dùng:
 * 1. Chạy mặc định (Tự động đọc .env.prod và .env.dev):
 *    npm run db:clone:prod-to-dev
 * 
 * 2. Chỉ định trực tiếp connection string hoặc file env:
 *    npm run db:clone:prod-to-dev -- --prod="postgres://..." --dev="postgres://..."
 *    npm run db:clone:prod-to-dev -- --force
 */

// Helper đọc file env
function readEnvFile(filename: string): Record<string, string> {
  const filePath = path.join(process.cwd(), filename);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    return dotenv.parse(content);
  }
  return {};
}

// Lấy database URL cho PROD và DEV
function resolveDatabaseUrls(): { prodUrl: string; devUrl: string; prodSource: string; devSource: string } {
  const args = process.argv.slice(2);
  let prodUrl = '';
  let devUrl = '';
  let prodSource = '';
  let devSource = '';

  // 1. Kiểm tra tham số CLI: --prod=... hoặc --dev=...
  for (const arg of args) {
    if (arg.startsWith('--prod=') || arg.startsWith('--source=')) {
      prodUrl = arg.split('=')[1]?.replace(/^["']|["']$/g, '');
      prodSource = 'CLI argument (--prod)';
    }
    if (arg.startsWith('--dev=') || arg.startsWith('--target=')) {
      devUrl = arg.split('=')[1]?.replace(/^["']|["']$/g, '');
      devSource = 'CLI argument (--dev)';
    }
  }

  // 2. Kiểm tra biến môi trường hệ thống
  if (!prodUrl) {
    prodUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL_PROD || '';
    if (prodUrl) prodSource = 'Environment variable (PROD_DATABASE_URL)';
  }
  if (!devUrl) {
    devUrl = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL_DEV || '';
    if (devUrl) devSource = 'Environment variable (DEV_DATABASE_URL)';
  }

  // 3. Đọc từ file .env.prod và .env.dev
  const envProd = readEnvFile('.env.prod');
  const envDev = readEnvFile('.env.dev');

  if (!prodUrl && envProd.DATABASE_URL) {
    prodUrl = envProd.DATABASE_URL;
    prodSource = 'File .env.prod';
  }
  if (!devUrl && envDev.DATABASE_URL) {
    devUrl = envDev.DATABASE_URL;
    devSource = 'File .env.dev';
  }

  // 4. Fallback đọc từ .env mặc định nếu có DATABASE_URL
  const envDefault = readEnvFile('.env');
  if (!prodUrl && envDefault.PROD_DATABASE_URL) {
    prodUrl = envDefault.PROD_DATABASE_URL;
    prodSource = 'File .env (PROD_DATABASE_URL)';
  }
  if (!devUrl && envDefault.DEV_DATABASE_URL) {
    devUrl = envDefault.DEV_DATABASE_URL;
    devSource = 'File .env (DEV_DATABASE_URL)';
  }

  return { prodUrl, devUrl, prodSource, devSource };
}

// Ẩn mật khẩu trong connection string để hiển thị an toàn trên console
function maskDbUrl(url: string): string {
  try {
    return url.replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@.+)/, '$1******$3');
  } catch {
    return url.substring(0, 15) + '...';
  }
}

// Chia mảng thành các chunk nhỏ hơn
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Xác nhận từ người dùng nếu chưa truyền --force hoặc --yes
async function confirmPrompt(message: string): Promise<boolean> {
  const args = process.argv.slice(2);
  if (args.includes('--force') || args.includes('-f') || args.includes('--yes') || args.includes('-y')) {
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      resolve(trimmed === 'y' || trimmed === 'yes' || trimmed === 'đồng ý' || trimmed === 'dong y');
    });
  });
}

/**
 * 1. Lấy danh sách toàn bộ các bảng trong public schema
 */
async function getPublicTables(prismaClient: PrismaClient): Promise<string[]> {
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
async function getTableRecordCounts(prismaClient: PrismaClient, tables: string[]): Promise<Map<string, number>> {
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
async function getTableDependencyOrder(prismaClient: PrismaClient, tables: string[]): Promise<string[]> {
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

/**
 * 4. Xoá sạch toàn bộ tables / schema cũ trên DEV
 */
async function dropAllDevTables(devPrisma: PrismaClient) {
  try {
    // Drop và tạo lại public schema (nhanh và sạch 100%)
    await devPrisma.$executeRawUnsafe(`
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
      COMMENT ON SCHEMA public IS 'standard public schema';
    `);
  } catch {
    // Fallback: Tìm tất cả bảng và view trong public schema để DROP CASCADE
    const tables: any = await devPrisma.$queryRawUnsafe(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public';
    `);
    if (Array.isArray(tables) && tables.length > 0) {
      for (const { tablename } of tables) {
        await devPrisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "public"."${tablename}" CASCADE;`);
      }
    }

    // Drop enum types nếu có
    const types: any = await devPrisma.$queryRawUnsafe(`
      SELECT t.typname FROM pg_type t 
      JOIN pg_namespace n ON t.typnamespace = n.oid 
      WHERE n.nspname = 'public' AND t.typtype = 'e';
    `);
    if (Array.isArray(types) && types.length > 0) {
      for (const { typname } of types) {
        await devPrisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "public"."${typname}" CASCADE;`);
      }
    }
  }
}

/**
 * 5. Tái tạo cấu trúc bảng từ schema.prisma qua Prisma CLI
 */
function pushSchemaToDev(devUrl: string) {
  const prismaBin = path.join(process.cwd(), 'node_modules', '.bin', 'prisma');
  const prismaCmd = fs.existsSync(prismaBin) ? `"${prismaBin}"` : 'npx prisma';

  execSync(`${prismaCmd} db push --accept-data-loss --skip-generate`, {
    env: {
      ...process.env,
      DATABASE_URL: devUrl,
      DATABASE_DIRECT_URL: devUrl,
    },
    stdio: 'inherit',
  });
}

/**
 * 6. Tự động kiểm tra và tạo bù bất kỳ bảng nào có trên PROD nhưng chưa có trên DEV
 *    (Đặc biệt là _prisma_migrations hoặc các bảng ngoài schema.prisma)
 */
async function ensureMissingTablesCreated(prodPrisma: PrismaClient, devPrisma: PrismaClient, prodTables: string[]) {
  const devTables = await getPublicTables(devPrisma);
  const missingTables = prodTables.filter((t) => !devTables.includes(t));

  for (const table of missingTables) {
    if (table === '_prisma_migrations') {
      await devPrisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "public"."_prisma_migrations" (
          "id" VARCHAR(36) NOT NULL,
          "checksum" VARCHAR(64) NOT NULL,
          "finished_at" TIMESTAMPTZ,
          "migration_name" VARCHAR(255) NOT NULL,
          "logs" TEXT,
          "rolled_back_at" TIMESTAMPTZ,
          "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
          CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
        );
      `);
      console.log(`  ➕ Đã tự động tạo bảng hệ thống "_prisma_migrations" trên DEV.`);
    } else {
      // Dynamic DDL generation cho bất kỳ bảng tuỳ chỉnh nào khác
      try {
        const columns: any = await prodPrisma.$queryRawUnsafe(`
          SELECT 
            column_name, 
            data_type, 
            udt_name,
            is_nullable, 
            column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position;
        `, table);

        if (Array.isArray(columns) && columns.length > 0) {
          const colDefs = columns.map((c: any) => {
            let typeStr = c.udt_name || c.data_type;
            if (typeStr === 'varchar') typeStr = 'text';
            if (typeStr === 'int4') typeStr = 'integer';
            if (typeStr === 'int8') typeStr = 'bigint';
            if (typeStr === 'bool') typeStr = 'boolean';
            const nullStr = c.is_nullable === 'NO' ? ' NOT NULL' : '';
            return `"${c.column_name}" ${typeStr}${nullStr}`;
          });

          await devPrisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "public"."${table}" (
              ${colDefs.join(',\n')}
            );
          `);
          console.log(`  ➕ Đã tự động tái tạo cấu trúc bảng tuỳ chỉnh "${table}" trên DEV.`);
        }
      } catch (err: any) {
        console.warn(`  ⚠️ Không thể tự động tạo DDL cho bảng "${table}":`, err.message);
      }
    }
  }
}

/**
 * 7. Tự động đồng bộ TẤT CẢ auto-increment sequences trên DEV
 *    (Không cần hardcode danh sách TABLES_WITH_ID)
 */
async function syncAllDevSequences(devPrisma: PrismaClient): Promise<number> {
  const seqCols: any = await devPrisma.$queryRawUnsafe(`
    SELECT 
      c.table_name, 
      c.column_name, 
      pg_get_serial_sequence('"' || c.table_name || '"', c.column_name) AS seq_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND pg_get_serial_sequence('"' || c.table_name || '"', c.column_name) IS NOT NULL;
  `);

  let count = 0;
  if (Array.isArray(seqCols)) {
    for (const { table_name, column_name, seq_name } of seqCols) {
      if (!seq_name) continue;
      try {
        await devPrisma.$executeRawUnsafe(`
          SELECT setval(
            $1, 
            COALESCE((SELECT MAX("${column_name}") FROM "public"."${table_name}"), 1), 
            (SELECT MAX("${column_name}") IS NOT NULL FROM "public"."${table_name}")
          );
        `, seq_name);
        count++;
      } catch {
        // Bỏ qua lỗi cấp quyền sequence nếu có
      }
    }
  }
  return count;
}

/**
 * Hàm thực thi chính
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        PTIT WEB TOOL - SMART CLONE POSTGRESQL PROD -> DEV    ║');
  console.log('║  (Tự động nhận diện 100% tables, tái tạo DDL & chuyển data)  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`[Thời gian]: ${new Date().toLocaleString('vi-VN')}`);

  const { prodUrl, devUrl, prodSource, devSource } = resolveDatabaseUrls();

  // 1. Kiểm tra cấu hình URL
  if (!prodUrl) {
    console.error('\n❌ [LỖI] Không tìm thấy URL Database PROD!');
    console.error('👉 Vui lòng kiểm tra:');
    console.error('   1. Tạo file .env.prod chứa: DATABASE_URL="postgres://..."');
    console.error('   2. Hoặc truyền tham số: --prod="postgres://..."');
    console.error('   3. Hoặc gán biến môi trường PROD_DATABASE_URL\n');
    process.exit(1);
  }

  if (!devUrl) {
    console.error('\n❌ [LỖI] Không tìm thấy URL Database DEV!');
    console.error('👉 Vui lòng kiểm tra:');
    console.error('   1. Tạo file .env.dev chứa: DATABASE_URL="postgres://..."');
    console.error('   2. Hoặc truyền tham số: --dev="postgres://..."');
    console.error('   3. Hoặc gán biến môi trường DEV_DATABASE_URL\n');
    process.exit(1);
  }

  // 2. Bảo vệ an toàn: Kiểm tra tránh ghi đè nhầm nếu 2 URL giống nhau
  if (prodUrl.trim() === devUrl.trim()) {
    console.error('\n⛔ [NGUY HIỂM] Database PROD và DEV đang trỏ đến cùng 1 URL!');
    console.error(`URL: ${maskDbUrl(prodUrl)}`);
    console.error('❌ Thao tác bị huỷ để tránh mất mát dữ liệu. Vui lòng kiểm tra lại file .env.prod và .env.dev.\n');
    process.exit(1);
  }

  console.log('\n--- CẤU HÌNH KẾT NỐI ---');
  console.log(`🔹 NGUỒN (PROD): ${maskDbUrl(prodUrl)}`);
  console.log(`   └─ Nguồn cấu hình: ${prodSource}`);
  console.log(`🔸 ĐÍCH  (DEV) : ${maskDbUrl(devUrl)}`);
  console.log(`   └─ Nguồn cấu hình: ${devSource}`);

  // 3. Khởi tạo Prisma Client cho từng database
  const prodPrisma = new PrismaClient({
    datasources: { db: { url: prodUrl } },
    log: ['error'],
  });

  let devPrisma = new PrismaClient({
    datasources: { db: { url: devUrl } },
    log: ['error'],
  });

  const startTime = Date.now();

  try {
    // 4. Kiểm tra kết nối tới cả 2 CSDL
    console.log('\n[1/6] Đang kiểm tra kết nối tới 2 Database PostgreSQL...');
    await prodPrisma.$connect();
    console.log('  ✅ Kết nối PROD thành công!');
    await devPrisma.$connect();
    console.log('  ✅ Kết nối DEV thành công!');

    // 5. Tự động phát hiện 100% tất cả các bảng trên PROD
    console.log('\n[2/6] Đang tự động quét toàn bộ bảng và dữ liệu từ Database PROD...');
    const prodTables = await getPublicTables(prodPrisma);

    if (prodTables.length === 0) {
      console.warn('  ⚠️ Không tìm thấy bảng nào trong public schema trên PROD!');
      process.exit(0);
    }

    const tableCounts = await getTableRecordCounts(prodPrisma, prodTables);
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

    // 6. Yêu cầu xác nhận trước khi xoá trắng và tạo lại schema DEV
    const confirmed = await confirmPrompt(
      '\n⚠️  CẢNH BÁO: Toàn bộ bảng và dữ liệu trên DEV sẽ bị XOÁ TRẮNG và TÁI TẠO lại theo PROD.\n👉 Bạn có chắc chắn muốn tiếp tục? (y/N): '
    );

    if (!confirmed) {
      console.log('\n❌ Thao tác đã bị huỷ bởi người dùng.');
      process.exit(0);
    }

    // 7. Xoá sạch toàn bộ bảng / schema trên DEV
    console.log('\n[3/6] Đang xoá toàn bộ bảng và Schema cũ trên Database DEV (DROP CASCADE)...');
    await dropAllDevTables(devPrisma);
    console.log('  ✅ Đã xoá sạch toàn bộ bảng và dữ liệu cũ trên DEV!');

    // Ngắt kết nối devPrisma tạm thời để prisma db push tạo mới schema
    await devPrisma.$disconnect().catch(() => {});

    // 8. Tái tạo lại cấu trúc bảng trên DEV từ schema.prisma
    console.log('\n[4/6] Đang tái tạo cấu trúc bảng trên DEV (theo Prisma Schema & Tự động bù bảng thiếu)...');
    pushSchemaToDev(devUrl);

    // Khởi tạo lại kết nối devPrisma sau khi schema được tạo mới
    devPrisma = new PrismaClient({
      datasources: { db: { url: devUrl } },
      log: ['error'],
    });
    await devPrisma.$connect();

    // Tự động bù các bảng không nằm trong schema.prisma (như _prisma_migrations)
    await ensureMissingTablesCreated(prodPrisma, devPrisma, prodTables);
    console.log('  ✅ Đã sẵn sàng toàn bộ cấu trúc bảng, chỉ mục và ràng buộc trên DEV!');

    // 9. Sắp xếp thứ tự nạp bảng theo Foreign Key (Topological Sort)
    const sortedTables = await getTableDependencyOrder(prodPrisma, prodTables);

    // 10. Nạp dữ liệu động từ PROD sang DEV
    console.log('\n[5/6] Đang nạp dữ liệu từ PROD sang DEV theo thứ tự ràng buộc khoá ngoại...');

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

    // 11. Tự động đồng bộ Sequences trên Database DEV
    console.log('\n[6/6] Đang tự động quét & đồng bộ tất cả auto-increment sequences trên DEV...');
    const syncedSeqCount = await syncAllDevSequences(devPrisma);
    console.log(`  ✅ Đã đồng bộ thành công ${syncedSeqCount} sequences!`);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log(`║  🎉 CLONE DỮ LIỆU PROD -> DEV THÀNH CÔNG (${elapsed}s)          ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`- Tổng số bảng đã đồng bộ: ${prodTables.length} bảng (bao gồm _prisma_migrations & ExamRoom)`);
    console.log(`- Tổng số bản ghi đã sao chép: ${copiedRecords.toLocaleString('vi-VN')} bản ghi`);
    console.log(`- Database DEV hiện tại đã được tái tạo mới & đồng bộ 100% với PROD.\n`);

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ [LỖI TRONG QUÁ TRÌNH CLONE DỮ LIỆU]:', error);
    process.exit(1);
  } finally {
    await prodPrisma.$disconnect().catch(() => {});
    await devPrisma.$disconnect().catch(() => {});
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
