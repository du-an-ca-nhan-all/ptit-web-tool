import fs from 'fs';
import path from 'path';
import {
  getDatabaseStats,
  createLocalBackup,
  getBackupsDirectory,
} from '../src/lib/backupService';

async function main() {
  console.log('====================================================');
  console.log('       PTIT WEB TOOL - DATABASE BACKUP SCRIPT       ');
  console.log('====================================================');
  console.log(`[Backup] Time: ${new Date().toLocaleString('vi-VN')}`);

  const startTime = Date.now();

  try {
    console.log('\n[1/3] Reading database information & statistics...');
    const stats = await getDatabaseStats();

    console.log(`- Database file: prisma/dev.db (${stats.dbFileSizeFormatted})`);
    console.log(`- Total records: ${stats.totalRecords.toLocaleString('vi-VN')}`);
    console.log('\n--- Table Breakdown ---');
    stats.tableBreakdown.forEach((t) => {
      console.log(`  * ${t.label.padEnd(30, ' ')} [${t.name}]: ${t.count.toLocaleString('vi-VN')} records`);
    });

    console.log('\n[2/3] Generating backups (SQLite binary & JSON export)...');
    const backupsDir = getBackupsDirectory();
    console.log(`- Destination folder: ${backupsDir}`);

    const createdFiles = await createLocalBackup('all');

    console.log('\n[3/3] Backup completed successfully!');
    createdFiles.forEach((file) => {
      console.log(`  -> File created: ${file.name} (${file.sizeFormatted}) [${file.format.toUpperCase()}]`);
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n====================================================`);
    console.log(` [SUCCESS] Database backup finished in ${elapsed}s`);
    console.log(`====================================================\n`);

    process.exit(0);
  } catch (error: any) {
    console.error('\n[ERROR] Database backup failed:', error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[FATAL] Script error:', err);
  process.exit(1);
});
