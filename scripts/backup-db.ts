import {
  getDatabaseStats,
  createLocalBackup,
  getBackupsDirectory,
  sendBackupToTelegram,
} from '../src/lib/backupService';

async function main() {
  console.log('====================================================');
  console.log('    PTIT WEB TOOL - POSTGRESQL DATABASE BACKUP      ');
  console.log('====================================================');
  console.log(`[Backup] Time: ${new Date().toLocaleString('vi-VN')}`);

  const args = process.argv.slice(2);
  const shouldSendTelegram = args.includes('--telegram') || args.includes('--send-telegram');

  const startTime = Date.now();

  try {
    console.log('\n[1/3] Reading database information & statistics...');
    const stats = await getDatabaseStats();

    console.log(`- Database Engine: PostgreSQL (${stats.dbFileSizeFormatted})`);
    console.log(`- Total records: ${stats.totalRecords.toLocaleString('vi-VN')}`);
    console.log('\n--- Table Breakdown ---');
    stats.tableBreakdown.forEach((t) => {
      console.log(`  * ${t.label.padEnd(30, ' ')} [${t.name}]: ${t.count.toLocaleString('vi-VN')} records`);
    });

    console.log('\n[2/3] Generating PostgreSQL backups (SQL Dump & JSON export)...');
    const backupsDir = getBackupsDirectory();
    console.log(`- Destination folder: ${backupsDir}`);

    const createdFiles = await createLocalBackup('all');

    console.log('\n[3/3] Local backup completed!');
    createdFiles.forEach((file) => {
      console.log(`  -> File created: ${file.name} (${file.sizeFormatted}) [${file.format.toUpperCase()}]`);
    });

    if (shouldSendTelegram) {
      console.log('\n[+] Sending backup files to Telegram...');
      try {
        const telRes = await sendBackupToTelegram();
        if (telRes.success) {
          console.log(`  -> [Telegram SUCCESS] Sent ${telRes.filesSent.length} files: ${telRes.filesSent.join(', ')}`);
        } else {
          console.warn(`  -> [Telegram FAILED] ${telRes.error || telRes.message}`);
        }
      } catch (telErr: any) {
        console.error(`  -> [Telegram ERROR] ${telErr.message}`);
      }
    }

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
