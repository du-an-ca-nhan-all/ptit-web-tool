import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { prisma } from '../src/lib/prisma';
import { restoreFromJsonDump, syncPostgresSequences, getDatabaseStats } from '../src/features/database-backup/server/backupServerService';

/**
 * Script di chuyển dữ liệu từ SQLite (dev.db hoặc file backup JSON) sang PostgreSQL.
 * Chạy lệnh: npm run db:migrate:from-sqlite [đường_dẫn_file_json_hoặc_sqlite]
 */
async function main() {
  console.log('================================================================');
  console.log('       PTIT WEB TOOL - SQLITE TO POSTGRESQL DATA MIGRATOR       ');
  console.log('================================================================');
  console.log(`[Time]: ${new Date().toLocaleString('vi-VN')}`);

  const args = process.argv.slice(2);
  let sourceFile = args[0];

  const backupsDir = path.join(process.cwd(), 'backups');
  const sqliteDbPath = path.join(process.cwd(), 'prisma', 'dev.db');

  let jsonData: any = null;

  // 1. Xác định nguồn dữ liệu cần chuyển
  if (sourceFile) {
    const resolvedPath = path.isAbsolute(sourceFile) ? sourceFile : path.join(process.cwd(), sourceFile);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`[ERROR] Không tìm thấy file nguồn: ${resolvedPath}`);
      process.exit(1);
    }
    sourceFile = resolvedPath;
  } else {
    // Tự động tìm file backup JSON mới nhất trong thư mục backups/
    if (fs.existsSync(backupsDir)) {
      const files = fs.readdirSync(backupsDir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => ({
          name: f,
          path: path.join(backupsDir, f),
          time: fs.statSync(path.join(backupsDir, f)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length > 0) {
        sourceFile = files[0].path;
        console.log(`[+] Đã tìm thấy bản sao lưu JSON mới nhất: ${path.basename(sourceFile)}`);
      }
    }
  }

  // 2. Đọc dữ liệu JSON
  if (sourceFile && sourceFile.endsWith('.json')) {
    console.log(`[1/4] Đang đọc dữ liệu từ file JSON: ${sourceFile}...`);
    const raw = fs.readFileSync(sourceFile, 'utf8');
    jsonData = JSON.parse(raw);
  } else if (fs.existsSync(sqliteDbPath)) {
    // Nếu có SQLite dev.db và python3/sqlite3 trên máy, trích xuất dữ liệu
    console.log(`[1/4] Đang trích xuất dữ liệu từ SQLite (${sqliteDbPath})...`);
    try {
      const pythonScript = `
import sqlite3, json, sys

db_path = sys.argv[1]
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

tables = [
    ("users", "User"),
    ("students", "Student"),
    ("examBatches", "ExamBatch"),
    ("examRecords", "ExamRecord"),
    ("courseRegistrations", "CourseRegistration"),
    ("systemMeta", "SystemMeta"),
    ("externalAccounts", "ExternalAccount"),
    ("activityLogs", "ActivityLog"),
    ("telegramConfigs", "TelegramConfig"),
    ("globalConfigs", "GlobalConfig"),
    ("examReminderLogs", "ExamReminderLog"),
    ("qldtAnnouncementLogs", "QldtAnnouncementLog"),
    ("classScheduleReminderLogs", "ClassScheduleReminderLog"),
    ("registrationRequests", "RegistrationRequest"),
]

data = {}
for key, tbl in tables:
    try:
        cur.execute(f'SELECT * FROM "{tbl}"')
        rows = [dict(r) for r in cur.fetchall()]
        data[key] = rows
    except Exception:
        data[key] = []

print(json.dumps({"data": data}))
conn.close()
`;
      const output = execSync(`python3 -c '${pythonScript}' "${sqliteDbPath}"`, {
        maxBuffer: 100 * 1024 * 1024,
        encoding: 'utf8',
      });
      jsonData = JSON.parse(output);
      console.log('  -> Trích xuất từ SQLite dev.db thành công!');
    } catch (pyErr: any) {
      console.warn('  -> Không thể tự động trích xuất trực tiếp từ dev.db bằng Python:', pyErr.message);
    }
  }

  if (!jsonData || !jsonData.data) {
    console.error('\n[ERROR] Không tìm thấy dữ liệu để chuyển đổi. Vui lòng cung cấp đường dẫn tới file sao lưu JSON (ví dụ: backups/ptit-db-backup-*.json).');
    process.exit(1);
  }

  // 3. Kiểm tra kết nối tới PostgreSQL
  console.log('\n[2/4] Kiểm tra kết nối PostgreSQL qua DATABASE_URL...');
  try {
    await prisma.$connect();
    console.log('  -> Kết nối cơ sở dữ liệu PostgreSQL thành công!');
  } catch (dbErr: any) {
    console.error('  -> [FATAL] Không thể kết nối tới PostgreSQL. Vui lòng kiểm tra DATABASE_URL trong file .env');
    console.error('  Chi tiết lỗi:', dbErr.message);
    process.exit(1);
  }

  // 4. Thực hiện nạp dữ liệu vào PostgreSQL
  console.log('\n[3/4] Đang chuyển toàn bộ 14 bảng dữ liệu sang PostgreSQL...');
  const startTime = Date.now();
  const restoreRes = await restoreFromJsonDump(jsonData);

  console.log(`  -> ${restoreRes.message}`);

  // 5. Đồng bộ Sequences
  console.log('\n[4/4] Đang đồng bộ sequences trên PostgreSQL...');
  await syncPostgresSequences();
  console.log('  -> Đồng bộ sequences thành công!');

  const finalStats = await getDatabaseStats();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n================================================================');
  console.log(` [HOÀN TẤT] Chuyển đổi dữ liệu sang PostgreSQL thành công trong ${elapsed}s!`);
  console.log('================================================================');
  console.log(`- Tổng số bản ghi trong PostgreSQL: ${finalStats.totalRecords.toLocaleString('vi-VN')}`);
  console.log('\n--- Thống kê chi tiết các bảng ---');
  finalStats.tableBreakdown.forEach((t) => {
    console.log(`  * ${t.label.padEnd(30, ' ')} [${t.name}]: ${t.count.toLocaleString('vi-VN')} bản ghi`);
  });
  console.log('================================================================\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('[FATAL] Lỗi trong quá trình chuyển đổi dữ liệu:', err);
  process.exit(1);
});
