import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { getPublicTables } from './schema-introspection';

/**
 * 4. Xoá sạch toàn bộ tables / schema cũ trên DEV
 */
export async function dropAllDevTables(devPrisma: PrismaClient) {
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
export function pushSchemaToDev(devUrl: string) {
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
export async function ensureMissingTablesCreated(prodPrisma: PrismaClient, devPrisma: PrismaClient, prodTables: string[]) {
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
export async function syncAllDevSequences(devPrisma: PrismaClient): Promise<number> {
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
