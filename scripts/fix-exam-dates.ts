import { prisma } from '../src/lib/prisma';

/**
 * Script đảo ngược định dạng cột ngayThi từ M/D/YYYY (hoặc MM/DD/YYYY) sang D/M/YYYY
 * Ví dụ: 7/18/2026 -> 18/7/2026
 * 
 * Chạy lệnh: npx tsx scripts/fix-exam-dates.ts
 */
async function main() {
  console.log('====================================================');
  console.log('       PTIT WEB TOOL - FIX NGAY THI FORMAT          ');
  console.log('====================================================');
  console.log(`[Bắt đầu]: ${new Date().toLocaleString('vi-VN')}`);

  // 1. Kiểm tra các định dạng ngayThi hiện tại trong ExamRecord
  console.log('\n[1/3] Đang quét các giá trị ngayThi hiện tại...');
  const distinctDates: any[] = await prisma.$queryRawUnsafe(`
    SELECT "ngayThi", COUNT(*)::int as count 
    FROM "ExamRecord" 
    GROUP BY "ngayThi" 
    ORDER BY "ngayThi" ASC;
  `);

  console.log('Danh sách ngày thi hiện tại:');
  console.table(distinctDates);

  // 2. Chuyển đổi dữ liệu trong ExamRecord
  console.log('\n[2/3] Đang cập nhật lại cột ngayThi trong bảng ExamRecord...');
  const updateExamRes: number = await prisma.$executeRawUnsafe(`
    UPDATE "ExamRecord"
    SET "ngayThi" = split_part("ngayThi", '/', 2) || '/' || split_part("ngayThi", '/', 1) || '/' || split_part("ngayThi", '/', 3)
    WHERE "ngayThi" ~ '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$';
  `);
  console.log(`  -> Đã cập nhật thành công ${updateExamRes.toLocaleString('vi-VN')} bản ghi ExamRecord!`);

  // 3. Đồng bộ lại bảng RoomEnvelopeConfirmation (nếu có)
  console.log('\n[3/3] Đang đồng bộ bảng RoomEnvelopeConfirmation...');
  const updateEnvDateRes: number = await prisma.$executeRawUnsafe(`
    UPDATE "RoomEnvelopeConfirmation"
    SET "date" = split_part("date", '/', 2) || '/' || split_part("date", '/', 1) || '/' || split_part("date", '/', 3)
    WHERE "date" ~ '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$';
  `);

  const updateEnvSessionRes: number = await prisma.$executeRawUnsafe(`
    UPDATE "RoomEnvelopeConfirmation"
    SET "sessionId" = split_part("sessionId", '|', 1) || '|' || 
                      split_part(split_part("sessionId", '|', 2), '/', 2) || '/' || 
                      split_part(split_part("sessionId", '|', 2), '/', 1) || '/' || 
                      split_part(split_part("sessionId", '|', 2), '/', 3) || '|' || 
                      split_part("sessionId", '|', 3) || '|' || 
                      split_part("sessionId", '|', 4)
    WHERE "sessionId" LIKE '%|%/%/%|%';
  `);

  console.log(`  -> Đã cập nhật ${updateEnvDateRes} dòng date và ${updateEnvSessionRes} dòng sessionId trong RoomEnvelopeConfirmation!`);

  // 4. Kiểm tra lại kết quả sau khi chuyển đổi
  console.log('\n--- KẾT QUẢ SAU KHI SỬA ---');
  const newDistinctDates: any[] = await prisma.$queryRawUnsafe(`
    SELECT "ngayThi", COUNT(*)::int as count 
    FROM "ExamRecord" 
    GROUP BY "ngayThi" 
    ORDER BY count DESC;
  `);
  console.table(newDistinctDates);

  console.log('\n====================================================');
  console.log(' [HOÀN TẤT] Định dạng ngayThi đã được chuẩn hóa sang D/M/YYYY!');
  console.log('====================================================\n');
}

main()
  .catch((err) => {
    console.error('Lỗi khi thực hiện fix ngày thi:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
