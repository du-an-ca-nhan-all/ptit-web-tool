import { PrismaClient } from '@prisma/client';
import {
  confirmPrompt,
  resolveDatabaseUrls,
  validateAndLogDatabaseUrls,
} from './clone-prod-to-dev-logic/config';
import {
  getPublicTables,
  getTableDependencyOrder,
  getTableRecordCounts,
  printProdTablesSummary,
} from './clone-prod-to-dev-logic/schema-introspection';
import {
  dropAllDevTables,
  ensureMissingTablesCreated,
  pushSchemaToDev,
  syncAllDevSequences,
} from './clone-prod-to-dev-logic/dev-schema-reset';
import { copyTablesData } from './clone-prod-to-dev-logic/data-transfer';

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

/**
 * Hàm thực thi chính
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        PTIT WEB TOOL - SMART CLONE POSTGRESQL PROD -> DEV    ║');
  console.log('║  (Tự động nhận diện 100% tables, tái tạo DDL & chuyển data)  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`[Thời gian]: ${new Date().toLocaleString('vi-VN')}`);

  const resolvedUrls = resolveDatabaseUrls();
  validateAndLogDatabaseUrls(resolvedUrls);
  const { prodUrl, devUrl } = resolvedUrls;

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
    printProdTablesSummary(prodTables, tableCounts);

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
    await devPrisma.$disconnect().catch((err) => console.warn("[clone-prod-to-dev-logic] Non-fatal async error:", err));

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
    const copiedRecords = await copyTablesData({
      prodPrisma,
      devPrisma,
      sortedTables,
      tableCounts,
    });

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
    await prodPrisma.$disconnect().catch((err) => console.warn("[clone-prod-to-dev-logic] Non-fatal async error:", err));
    await devPrisma.$disconnect().catch((err) => console.warn("[clone-prod-to-dev-logic] Non-fatal async error:", err));
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
