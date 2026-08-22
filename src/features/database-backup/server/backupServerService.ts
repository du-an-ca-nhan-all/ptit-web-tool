import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { prisma } from '@/src/lib/prisma';
import { sendTelegramDocument, sendTelegramMessage, getSystemTelegramBotConfig, verifyTelegramBot } from '@/src/features/telegram/server/telegramServerService';
import { getGlobalConfig, setGlobalConfig, BackupTelegramConfigValue, GLOBAL_CONFIG_KEYS } from '@/src/lib/globalConfig';

export interface TableStat {
  name: string;
  label: string;
  count: number;
  description: string;
}

export interface DatabaseStats {
  tables: Record<string, number>;
  tableBreakdown: TableStat[];
  totalRecords: number;
  dbFileSize: number;
  dbFileSizeFormatted: string;
  dbLastModified: string | null;
}

export interface LocalBackupFile {
  name: string;
  format: 'sql' | 'json' | 'sqlite';
  size: number;
  sizeFormatted: string;
  createdAt: string;
}

function toCamelCase(str: string): string {
  if (!str) return str;
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function getTableAliases(tableName: string): string[] {
  const camel = toCamelCase(tableName);
  const aliases = new Set<string>([tableName, camel]);
  if (!camel.endsWith('s')) {
    aliases.add(camel + 's');
    if (camel.endsWith('ch') || camel.endsWith('sh') || camel.endsWith('x')) {
      aliases.add(camel + 'es');
    }
  }
  return Array.from(aliases);
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getDatabaseFilePath(): string {
  return path.join(process.cwd(), 'prisma', 'dev.db');
}

export function getBackupsDirectory(): string {
  const dir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * 1. Tự động lấy danh sách toàn bộ các bảng trong public schema (Ném lỗi ngay nếu thất bại)
 */
export async function getPublicTables(prismaClient = prisma): Promise<string[]> {
  const rows: any = await prismaClient.$queryRawUnsafe(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename ASC;
  `);
  if (!Array.isArray(rows)) {
    throw new Error('Không thể truy vấn danh sách bảng từ pg_tables: Định dạng kết quả không hợp lệ');
  }
  if (rows.length === 0) {
    throw new Error('Không tìm thấy bảng nào trong public schema của cơ sở dữ liệu PostgreSQL');
  }
  return rows.map((r: any) => r.tablename);
}

/**
 * 2. Đếm số bản ghi cho từng bảng một cách tự động
 */
export async function getTableRecordCounts(
  prismaClient = prisma,
  tables: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (const table of tables) {
    try {
      const res: any = await prismaClient.$queryRawUnsafe(`SELECT COUNT(*)::bigint AS count FROM "public"."${table}";`);
      counts.set(table, Number(res[0]?.count || 0));
    } catch (err: any) {
      console.warn(`[BackupService] Lỗi khi đếm số bản ghi bảng "${table}":`, err.message);
      counts.set(table, 0);
    }
  }
  return counts;
}

/**
 * 3. Phân tích quan hệ Foreign Key & Sắp xếp thứ tự nạp bảng theo Topological Sort
 *    (Bảng cha được nạp trước, bảng con chứa khoá ngoại được nạp sau)
 */
export async function getTableDependencyOrder(
  prismaClient = prisma,
  tables: string[]
): Promise<string[]> {
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

    // Bổ sung các bảng còn lại nếu có quan hệ vòng tròn
    for (const t of tables) {
      if (!sorted.includes(t)) {
        sorted.push(t);
      }
    }

    return sorted;
  } catch {
    return tables;
  }
}

/**
 * 4. Tự động đồng bộ TẤT CẢ auto-increment sequences trên PostgreSQL
 *    (Dò tìm tự động từ pg_get_serial_sequence, không cần hardcode)
 */
export async function syncPostgresSequences(prismaClient = prisma): Promise<number> {
  try {
    const seqCols: any = await prismaClient.$queryRawUnsafe(`
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
          await prismaClient.$executeRawUnsafe(`
            SELECT setval(
              $1, 
              COALESCE((SELECT MAX("${column_name}") FROM "public"."${table_name}"), 1), 
              (SELECT MAX("${column_name}") IS NOT NULL FROM "public"."${table_name}")
            );
          `, seq_name);
          count++;
        } catch {
          // Bỏ qua lỗi cấp quyền nếu có
        }
      }
    }
    return count;
  } catch {
    return 0;
  }
}

/**
 * 5. Lấy thống kê cơ sở dữ liệu động toàn diện
 */
export async function getDatabaseStats(): Promise<DatabaseStats> {
  const tables = await getPublicTables(prisma);
  const tableCounts = await getTableRecordCounts(prisma, tables);

  let dbFileSize = 0;
  let dbLastModified: string | null = null;

  try {
    const res: any = await (prisma as any).$queryRawUnsafe?.('SELECT pg_database_size(current_database()) AS size;');
    if (res && res[0] && res[0].size !== undefined) {
      dbFileSize = Number(res[0].size);
      dbLastModified = new Date().toISOString();
    }
  } catch {
    const dbPath = getDatabaseFilePath();
    if (fs.existsSync(dbPath)) {
      const stat = fs.statSync(dbPath);
      dbFileSize = stat.size;
      dbLastModified = stat.mtime.toISOString();
    }
  }

  const tableStats: Record<string, number> = {};
  let totalRecords = 0;

  for (const [tbl, count] of tableCounts.entries()) {
    tableStats[tbl] = count;
    totalRecords += count;
  }

  const tableBreakdown: TableStat[] = tables.map((tbl) => ({
    name: tbl,
    label: tbl,
    count: tableCounts.get(tbl) || 0,
    description: `Bảng dữ liệu "${tbl}"`,
  }));

  return {
    tables: tableStats as any,
    tableBreakdown,
    totalRecords,
    dbFileSize,
    dbFileSizeFormatted: formatBytes(dbFileSize),
    dbLastModified,
  };
}

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

function sqlVal(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'bigint') return val.toString();
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (Buffer.isBuffer(val)) {
    return `E'\\\\x${val.toString('hex')}'`;
  }
  if (typeof val === 'object') {
    const jsonStr = JSON.stringify(val);
    return `'${jsonStr.replace(/'/g, "''")}'`;
  }
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
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
  } catch {
    // Silently ignore sequence error in dump generation
  }

  lines.push('');
  lines.push('COMMIT;');
  lines.push('');

  return lines.join('\n');
}

export function generateTimestampString(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

export async function createLocalBackup(format: 'sql' | 'json' | 'all' = 'all'): Promise<LocalBackupFile[]> {
  const backupsDir = getBackupsDirectory();
  const timestamp = generateTimestampString();
  const createdFiles: LocalBackupFile[] = [];

  // 1. Backup PostgreSQL SQL Dump (.sql)
  if (format === 'sql' || format === 'all') {
    const sqlDump = await exportDatabaseAsSqlDump();
    const filename = `ptit-db-backup-${timestamp}.sql`;
    const targetPath = path.join(backupsDir, filename);
    fs.writeFileSync(targetPath, sqlDump, 'utf8');
    const stat = fs.statSync(targetPath);
    createdFiles.push({
      name: filename,
      format: 'sql',
      size: stat.size,
      sizeFormatted: formatBytes(stat.size),
      createdAt: stat.birthtime.toISOString(),
    });
  }

  // 2. Backup JSON (.json)
  if (format === 'json' || format === 'all') {
    const jsonDump = await exportDatabaseAsJson();
    const filename = `ptit-db-backup-${timestamp}.json`;
    const targetPath = path.join(backupsDir, filename);
    fs.writeFileSync(targetPath, JSON.stringify(jsonDump, null, 2), 'utf8');
    const stat = fs.statSync(targetPath);
    createdFiles.push({
      name: filename,
      format: 'json',
      size: stat.size,
      sizeFormatted: formatBytes(stat.size),
      createdAt: stat.birthtime.toISOString(),
    });
  }

  return createdFiles;
}

export function listLocalBackups(): LocalBackupFile[] {
  const backupsDir = getBackupsDirectory();
  if (!fs.existsSync(backupsDir)) return [];

  const files = fs.readdirSync(backupsDir);
  const result: LocalBackupFile[] = [];

  for (const file of files) {
    if (file.startsWith('.')) continue;
    const filePath = path.join(backupsDir, file);
    try {
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;

      let format: 'sql' | 'json' | 'sqlite' = 'json';
      if (file.endsWith('.json')) {
        format = 'json';
      } else if (file.endsWith('.sql')) {
        format = 'sql';
      } else if (file.endsWith('.sqlite') || file.endsWith('.db')) {
        format = 'sqlite';
      } else {
        continue;
      }

      result.push({
        name: file,
        format,
        size: stat.size,
        sizeFormatted: formatBytes(stat.size),
        createdAt: stat.mtime.toISOString(),
      });
    } catch {
      // Ignore file stat errors
    }
  }

  // Sort newest first
  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getSafeBackupFilePath(filename: string): string | null {
  const backupsDir = getBackupsDirectory();
  const cleanName = path.basename(filename);
  const targetPath = path.join(backupsDir, cleanName);

  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    return targetPath;
  }
  return null;
}

export function deleteLocalBackup(filename: string): boolean {
  const targetPath = getSafeBackupFilePath(filename);
  if (!targetPath) return false;

  try {
    fs.unlinkSync(targetPath);
    return true;
  } catch (err) {
    console.error(`[BackupService] Failed to delete backup file: ${filename}`, err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TELEGRAM CLOUD BACKUP CAPABILITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lấy cấu hình gửi backup lên Telegram
 */
export async function getBackupTelegramConfig(): Promise<{
  config: BackupTelegramConfigValue | null;
  systemBotInfo: { isConfigured: boolean; botUsername?: string | null; botFirstName?: string | null };
}> {
  const config = await getGlobalConfig<BackupTelegramConfigValue>(GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM);
  const sysBot = await getSystemTelegramBotConfig();

  return {
    config: config
      ? {
          ...config,
          botToken: config.botToken ? `${config.botToken.substring(0, 10)}...${config.botToken.slice(-5)}` : '',
        }
      : null,
    systemBotInfo: {
      isConfigured: !!(sysBot && sysBot.botToken),
      botUsername: sysBot?.botUsername || null,
      botFirstName: sysBot?.botFirstName || null,
    },
  };
}

/**
 * Lưu cấu hình gửi backup lên Telegram
 */
export async function saveBackupTelegramConfig(params: {
  chatId: string;
  threadId?: string | null;
  botToken?: string | null;
  isEnabled?: boolean;
  sendSql?: boolean;
  sendSqlite?: boolean;
  sendJson?: boolean;
  autoBackupEnabled?: boolean;
  scheduleTime?: string;
  notifyOnDbBackup?: boolean;
  notifyOnNewUser?: boolean;
  notifyOnDbRestore?: boolean;
}): Promise<BackupTelegramConfigValue> {
  const {
    chatId,
    threadId,
    botToken,
    isEnabled = true,
    sendSql = true,
    sendSqlite,
    sendJson = true,
    autoBackupEnabled = false,
    scheduleTime = '10:00',
    notifyOnDbBackup = true,
    notifyOnNewUser = true,
    notifyOnDbRestore = true,
  } = params;

  if (!chatId || !chatId.trim()) {
    throw new Error('Vui lòng nhập Chat ID nhận file backup');
  }

  if (botToken && botToken.trim()) {
    const verify = await verifyTelegramBot(botToken.trim());
    if (!verify.success) {
      throw new Error(verify.error || 'Token Bot riêng không hợp lệ');
    }
  }

  const existing = await getGlobalConfig<BackupTelegramConfigValue>(GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM);

  const newConfig: BackupTelegramConfigValue = {
    isEnabled: Boolean(isEnabled),
    chatId: chatId.trim(),
    threadId: threadId ? String(threadId).trim() : null,
    botToken: botToken ? botToken.trim() : (existing?.botToken || null),
    sendSql: Boolean(sendSql ?? existing?.sendSql ?? true),
    sendSqlite: Boolean(sendSqlite ?? existing?.sendSqlite ?? true),
    sendJson: Boolean(sendJson),
    autoBackupEnabled: Boolean(autoBackupEnabled),
    scheduleTime: scheduleTime || '10:00',
    notifyOnDbBackup: Boolean(notifyOnDbBackup ?? existing?.notifyOnDbBackup ?? true),
    notifyOnNewUser: Boolean(notifyOnNewUser ?? existing?.notifyOnNewUser ?? true),
    notifyOnDbRestore: Boolean(notifyOnDbRestore ?? existing?.notifyOnDbRestore ?? true),
    lastAutoBackupDate: existing?.lastAutoBackupDate || null,
    lastBackupSentAt: existing?.lastBackupSentAt || null,
    lastBackupStatus: existing?.lastBackupStatus || null,
    lastBackupError: existing?.lastBackupError || null,
    lastBackupFiles: existing?.lastBackupFiles || [],
    lastTestedAt: existing?.lastTestedAt || null,
    lastTestStatus: existing?.lastTestStatus || null,
    lastTestError: existing?.lastTestError || null,
  };

  await setGlobalConfig(
    GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM,
    newConfig,
    'Cấu hình tự động gửi file backup cơ sở dữ liệu lên Telegram'
  );

  return newConfig;
}

/**
 * Kiểm tra kết nối / gửi thông điệp test đến đích Telegram
 */
export async function testBackupTelegramTarget(params?: {
  chatId?: string;
  threadId?: string | null;
  botToken?: string | null;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  let chatId = params?.chatId?.trim();
  let threadId = params?.threadId !== undefined ? (params.threadId ? String(params.threadId).trim() : null) : undefined;
  let botToken = params?.botToken?.trim();

  if (!chatId || !botToken) {
    const stored = await getGlobalConfig<BackupTelegramConfigValue>(GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM);
    if (stored) {
      if (!chatId) chatId = stored.chatId;
      if (threadId === undefined) threadId = stored.threadId || null;
      if (!botToken && stored.botToken) botToken = stored.botToken;
    }
  }

  if (!botToken) {
    const sysBot = await getSystemTelegramBotConfig();
    if (!sysBot || !sysBot.botToken) {
      return { success: false, error: 'Chưa có Bot Token (Bot hệ thống hoặc Bot riêng)' };
    }
    botToken = sysBot.botToken;
  }

  if (!chatId) {
    return { success: false, error: 'Vui lòng nhập Chat ID Telegram nhận file backup' };
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN');
  const message = `🔔 <b>KIỂM TRA KẾT NỐI SAO LƯU TELEGRAM (POSTGRESQL)</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n✅ <b>Trạng thái:</b> Kết nối thành công!\n📌 <b>Kênh/Nhóm/Chat:</b> <code>${chatId}</code>${threadId ? ` (Topic: <code>${threadId}</code>)` : ''}\n⏰ <b>Thời gian test:</b> <i>${timeStr}</i>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🐘 <i>Sẵn sàng nhận các file sao lưu PostgreSQL (.sql / .json) từ PTIT Exam Portal.</i>`;

  const sendRes = await sendTelegramMessage(botToken, chatId, message, {
    threadId: threadId ? Number(threadId) : undefined,
  });

  const existing = await getGlobalConfig<BackupTelegramConfigValue>(GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM);
  if (existing) {
    await setGlobalConfig(GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM, {
      ...existing,
      lastTestedAt: now.toISOString(),
      lastTestStatus: sendRes.success ? 'SUCCESS' : 'FAILED',
      lastTestError: sendRes.success ? null : (sendRes.error || 'Lỗi gửi tin nhắn test'),
    });
  }

  if (sendRes.success) {
    return { success: true, message: 'Đã gửi tin nhắn kiểm tra thành công lên Telegram!' };
  } else {
    return { success: false, error: sendRes.error || 'Không thể gửi tin nhắn kiểm tra đến Telegram' };
  }
}

/**
 * Thực hiện backup và gửi file trực tiếp lên Telegram
 */
export async function sendBackupToTelegram(params?: {
  format?: 'sql' | 'json' | 'all';
  customChatId?: string;
  customThreadId?: string | null;
  customBotToken?: string | null;
}): Promise<{
  success: boolean;
  message: string;
  filesSent: string[];
  results: any[];
  error?: string;
}> {
  const storedConfig = await getGlobalConfig<BackupTelegramConfigValue>(GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM);

  const chatId = params?.customChatId?.trim() || storedConfig?.chatId;
  const threadId = params?.customThreadId !== undefined ? params.customThreadId : storedConfig?.threadId;
  let botToken = params?.customBotToken?.trim() || storedConfig?.botToken;

  if (!chatId) {
    throw new Error('Chưa cấu hình Chat ID Telegram để gửi file backup. Vui lòng thiết lập trong phần cấu hình.');
  }

  if (!botToken) {
    const sysBot = await getSystemTelegramBotConfig();
    if (!sysBot || !sysBot.botToken) {
      throw new Error('Chưa có Bot Telegram. Vui lòng thiết lập Bot Hệ Thống hoặc cấu hình Bot Token riêng.');
    }
    botToken = sysBot.botToken;
  }

  const shouldSendSql = storedConfig?.sendSql !== false && storedConfig?.sendSqlite !== false;
  const shouldSendJson = storedConfig?.sendJson !== false;

  const format =
    params?.format ||
    (shouldSendSql && shouldSendJson
      ? 'all'
      : shouldSendSql
      ? 'sql'
      : 'json');

  const stats = await getDatabaseStats();
  const timestamp = generateTimestampString();
  const timeDisplay = new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN');

  const filesSent: string[] = [];
  const results: any[] = [];
  const errors: string[] = [];

  // 1. Send PostgreSQL SQL Dump (.sql)
  if (format === 'sql' || format === 'all') {
    try {
      const sqlDump = await exportDatabaseAsSqlDump();
      const sqlBuffer = Buffer.from(sqlDump, 'utf-8');
      const filename = `ptit-db-${timestamp}.sql`;
      const sizeFormatted = formatBytes(sqlBuffer.length);

      const caption = `🐘 <b>BẢN SAO LƯU DATABASE POSTGRESQL (.sql)</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 <b>Tổng số bản ghi:</b> ${stats.totalRecords.toLocaleString('vi-VN')}\n📋 <b>Bao gồm:</b> ${stats.tableBreakdown.length} bảng dữ liệu PostgreSQL\n💾 <b>Dung lượng file:</b> ${sizeFormatted}\n⏰ <b>Thời gian:</b> <i>${timeDisplay}</i>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🛡️ <i>File SQL Dump chuẩn PostgreSQL - Tự động nhận diện toàn bộ cấu trúc bảng & khôi phục tức thì.</i>`;

      const sendRes = await sendTelegramDocument(botToken, chatId, sqlBuffer, filename, {
        threadId: threadId ? Number(threadId) : undefined,
        caption,
      });

      results.push({ file: filename, format: 'sql', result: sendRes });
      if (sendRes.success) {
        filesSent.push(filename);
      } else {
        errors.push(`Lỗi gửi file SQL: ${sendRes.error}`);
      }
    } catch (sqlErr: any) {
      errors.push(`Lỗi tạo file SQL Dump: ${sqlErr.message}`);
    }
  }

  // 2. Send JSON Dump (.json)
  if (format === 'json' || format === 'all') {
    try {
      const jsonDump = await exportDatabaseAsJson();
      const jsonStr = JSON.stringify(jsonDump, null, 2);
      const jsonBuffer = Buffer.from(jsonStr, 'utf-8');
      const filename = `ptit-db-${timestamp}.json`;
      const sizeFormatted = formatBytes(jsonBuffer.length);

      const caption = `📄 <b>BẢN XUẤT DỮ LIỆU JSON ĐẦY ĐỦ (.json)</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 <b>Tổng số bản ghi:</b> ${stats.totalRecords.toLocaleString('vi-VN')}\n📋 <b>Bao gồm:</b> ${stats.tableBreakdown.length} bảng dữ liệu hệ thống PostgreSQL\n💾 <b>Dung lượng file:</b> ${sizeFormatted}\n⏰ <b>Thời gian:</b> <i>${timeDisplay}</i>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🌐 <i>Dữ liệu JSON có cấu trúc đầy đủ, tự động khớp mọi bảng & cột khi khôi phục.</i>`;

      const sendRes = await sendTelegramDocument(botToken, chatId, jsonBuffer, filename, {
        threadId: threadId ? Number(threadId) : undefined,
        caption,
      });

      results.push({ file: filename, format: 'json', result: sendRes });
      if (sendRes.success) {
        filesSent.push(filename);
      } else {
        errors.push(`Lỗi gửi file JSON: ${sendRes.error}`);
      }
    } catch (jsonErr: any) {
      errors.push(`Lỗi tạo file JSON: ${jsonErr.message}`);
    }
  }

  const isSuccess = filesSent.length > 0;
  const errorMsg = errors.join('; ');

  if (storedConfig) {
    await setGlobalConfig(GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM, {
      ...storedConfig,
      lastBackupSentAt: new Date().toISOString(),
      lastBackupStatus: isSuccess ? 'SUCCESS' : 'FAILED',
      lastBackupError: errorMsg || null,
      lastBackupFiles: filesSent,
    });
  }

  return {
    success: isSuccess,
    message: isSuccess
      ? `Đã gửi thành công ${filesSent.length} file sao lưu lên Telegram!`
      : `Gửi file sao lưu lên Telegram thất bại: ${errorMsg}`,
    filesSent,
    results,
    error: errorMsg || undefined,
  };
}

/**
 * Trình quét tự động kiểm tra và thực hiện sao lưu lúc 10:00 sáng (giờ Việt Nam).
 */
export async function runDailyAutoBackupScheduler(): Promise<{ executed: boolean; reason?: string }> {
  try {
    const nowVN = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const currentHour = nowVN.getHours();
    const currentMinute = nowVN.getMinutes();
    const currentDateStr = `${nowVN.getFullYear()}-${String(nowVN.getMonth() + 1).padStart(2, '0')}-${String(nowVN.getDate()).padStart(2, '0')}`;

    const config = await getGlobalConfig<BackupTelegramConfigValue>(GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM);

    const isAutoEnabled = config?.autoBackupEnabled !== false;
    const scheduleTime = config?.scheduleTime || '10:00';
    const [targetHourStr, targetMinuteStr] = scheduleTime.split(':');
    const targetHour = parseInt(targetHourStr || '10', 10);
    const targetMinute = parseInt(targetMinuteStr || '0', 10);

    if (!isAutoEnabled) {
      return { executed: false, reason: 'Tự động sao lưu đang tắt' };
    }

    if (config?.lastAutoBackupDate === currentDateStr) {
      return { executed: false, reason: `Đã sao lưu tự động trong ngày hôm nay (${currentDateStr})` };
    }

    const isTimeToBackup = currentHour > targetHour || (currentHour === targetHour && currentMinute >= targetMinute);

    if (!isTimeToBackup) {
      return {
        executed: false,
        reason: `Chưa đến giờ sao lưu (Hiện tại: ${currentHour}:${String(currentMinute).padStart(2, '0')} VN, Lịch hẹn: ${scheduleTime} VN)`,
      };
    }

    console.log(`⏰ [Auto Backup] Bắt đầu tự động tạo bản sao lưu dữ liệu PostgreSQL lúc ${scheduleTime} sáng...`);

    // 1. Tạo snapshot lưu cục bộ trên máy chủ
    const createdFiles = await createLocalBackup('all');
    console.log(`⏰ [Auto Backup] Đã tạo ${createdFiles.length} file snapshot trên máy chủ.`);

    // 2. Gửi Telegram nếu có cấu hình
    let telegramResult: any = null;
    if (config?.chatId && config.isEnabled !== false) {
      try {
        telegramResult = await sendBackupToTelegram();
        console.log(`⏰ [Auto Backup] Đã gửi ${telegramResult.filesSent?.length || 0} file lên Telegram.`);
      } catch (telErr: any) {
        console.error(`⏰ [Auto Backup] Lỗi khi gửi file lên Telegram:`, telErr.message);
      }
    }

    // 3. Cập nhật ngày sao lưu tự động gần nhất
    const updatedConfig: BackupTelegramConfigValue = {
      ...(config || {
        isEnabled: true,
        chatId: '',
        sendSql: true,
        sendJson: true,
      }),
      autoBackupEnabled: isAutoEnabled,
      scheduleTime,
      lastAutoBackupDate: currentDateStr,
      lastBackupSentAt: telegramResult?.success ? new Date().toISOString() : config?.lastBackupSentAt || new Date().toISOString(),
      lastBackupStatus: telegramResult ? (telegramResult.success ? 'SUCCESS' : 'FAILED') : config?.lastBackupStatus || 'SUCCESS',
      lastBackupError: telegramResult?.error || config?.lastBackupError || null,
      lastBackupFiles: telegramResult?.filesSent || createdFiles.map((f) => f.name),
    };

    await setGlobalConfig(
      GLOBAL_CONFIG_KEYS.BACKUP_TELEGRAM,
      updatedConfig,
      'Cấu hình tự động gửi file backup cơ sở dữ liệu lên Telegram'
    );

    return { executed: true };
  } catch (err: any) {
    console.error('[Auto Backup Error]:', err);
    return { executed: false, reason: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE RESTORATION CAPABILITIES (Phục hồi CSDL PostgreSQL Động)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Phục hồi cơ sở dữ liệu từ file SQL Dump PostgreSQL (.sql)
 */
export async function restoreFromSqlDump(
  sqlContent: string
): Promise<{
  success: boolean;
  message: string;
  preRestoreBackupFile: string;
  stats: DatabaseStats;
}> {
  // 1. Tạo bản sao lưu an toàn trước khi phục hồi
  const preRestoreFiles = await createLocalBackup('json');
  const preRestoreName = preRestoreFiles[0]?.name || 'pre-restore-backup.json';

  try {
    await prisma.$executeRawUnsafe(sqlContent);
  } catch (err: any) {
    // Nếu khối lớn lỗi, tách theo dấu chấm phẩy và thực thi từng lệnh
    const statements = sqlContent
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
      if (stmt) {
        await prisma.$executeRawUnsafe(stmt).catch((e) => {
          console.warn(`[Restore SQL Warning]: Statement failed: ${stmt.substring(0, 60)}...`, e.message);
        });
      }
    }
  }

  await syncPostgresSequences().catch(() => {});
  const stats = await getDatabaseStats();

  return {
    success: true,
    message: `Phục hồi cơ sở dữ liệu từ file SQL Dump PostgreSQL thành công! Tổng cộng ${stats.totalRecords.toLocaleString('vi-VN')} bản ghi trên ${stats.tableBreakdown.length} bảng.`,
    preRestoreBackupFile: preRestoreName,
    stats,
  };
}

/**
 * Phục hồi cơ sở dữ liệu từ file JSON dump (Tự động nạp động 100% bảng & cột)
 */
export async function restoreFromJsonDump(
  jsonContent: string | object
): Promise<{
  success: boolean;
  message: string;
  recordsRestored: number;
  preRestoreBackupFile: string;
  stats: DatabaseStats;
}> {
  let parsed: any;
  if (typeof jsonContent === 'string') {
    try {
      parsed = JSON.parse(jsonContent);
    } catch (e: any) {
      throw new Error(`Nội dung file JSON không hợp lệ: ${e.message}`);
    }
  } else {
    parsed = jsonContent;
  }

  const data = parsed.data || parsed;
  if (!data || typeof data !== 'object') {
    throw new Error('Cấu trúc file JSON sao lưu không đúng định dạng (thiếu trường data)');
  }

  // 1. Tạo bản sao lưu an toàn trước khi phục hồi
  const preRestoreFiles = await createLocalBackup('json');
  const preRestoreName = preRestoreFiles[0]?.name || 'pre-restore-backup.json';

  // 2. Lấy danh sách bảng trong Database đích và sắp xếp theo quan hệ khoá ngoại
  const dbTables = await getPublicTables(prisma);
  const sortedTables = await getTableDependencyOrder(prisma, dbTables);

  // 3. Chuẩn bị map dữ liệu cần nạp cho từng bảng (khớp cả PascalCase, camelCase, alias)
  const tableRowsMap = new Map<string, any[]>();

  for (const tableName of sortedTables) {
    let rows: any[] | undefined;

    if (Array.isArray(data[tableName])) {
      rows = data[tableName];
    } else {
      const aliases = getTableAliases(tableName);
      for (const alias of aliases) {
        if (Array.isArray(data[alias])) {
          rows = data[alias];
          break;
        }
      }
    }

    if (rows && rows.length > 0) {
      tableRowsMap.set(tableName, rows);
    }
  }

  // Tạm tắt ràng buộc ngoại nếu quyền hạn cho phép
  let replicaRoleSet = false;
  try {
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`);
    replicaRoleSet = true;
  } catch {
    // Không sao, topological sort sẽ đảm bảo thứ tự
  }

  // 4. Xóa sạch dữ liệu cũ theo thứ tự con trước, cha sau
  const reverseSorted = [...sortedTables].reverse();
  for (const tableName of reverseSorted) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "public"."${tableName}";`);
    } catch (delErr: any) {
      console.warn(`[Restore Warning] Không thể xoá bảng "${tableName}":`, delErr.message);
    }
  }

  // 5. Nạp dữ liệu mới theo thứ tự cha trước, con sau (Batch dynamic INSERT an toàn)
  let totalRestored = 0;

  for (const tableName of sortedTables) {
    const rows = tableRowsMap.get(tableName);
    if (!rows || rows.length === 0) continue;

    // Tìm tất cả các cột xuất hiện trong tập dữ liệu của bảng
    const columnSet = new Set<string>();
    for (const r of rows) {
      if (r && typeof r === 'object') {
        Object.keys(r).forEach((c) => columnSet.add(c));
      }
    }

    const columns = Array.from(columnSet);
    if (columns.length === 0) continue;

    const quotedCols = columns.map((c) => `"${c}"`).join(', ');

    // Giới hạn số tham số dưới 30,000 để tránh tràn giới hạn 65,535 của PostgreSQL
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
          if (val !== null && val !== undefined && typeof val === 'object' && !(val instanceof Date) && !Buffer.isBuffer(val)) {
            val = JSON.stringify(val);
          }
          flatValues.push(val === undefined ? null : val);
        }
        placeholders.push(`(${rowPlaceholders.join(', ')})`);
      }

      const insertSql = `INSERT INTO "public"."${tableName}" (${quotedCols}) VALUES ${placeholders.join(', ')};`;
      await prisma.$executeRawUnsafe(insertSql, ...flatValues);
    }

    totalRestored += rows.length;
  }

  // Bật lại ràng buộc triggers / foreign keys
  if (replicaRoleSet) {
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`).catch(() => {});
  }

  // 6. Tự động đồng bộ toàn bộ sequences ID trên PostgreSQL
  await syncPostgresSequences().catch(() => {});

  const stats = await getDatabaseStats();

  return {
    success: true,
    message: `Phục hồi cơ sở dữ liệu từ file JSON thành công! Đã nạp ${totalRestored.toLocaleString('vi-VN')} bản ghi trên ${tableRowsMap.size} bảng.`,
    recordsRestored: totalRestored,
    preRestoreBackupFile: preRestoreName,
    stats,
  };
}

/**
 * Phục hồi cơ sở dữ liệu từ file SQLite (.sqlite / .db) và nạp tự động vào PostgreSQL
 */
export async function restoreFromSqliteFile(
  sourcePathOrBuffer: string | Buffer
): Promise<{
  success: boolean;
  message: string;
  recordsRestored: number;
  preRestoreBackupFile: string;
  stats: DatabaseStats;
}> {
  const timestamp = generateTimestampString();
  const tempDir = path.join(process.cwd(), 'backups', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  let tempSqlitePath = '';
  if (typeof sourcePathOrBuffer === 'string') {
    if (!fs.existsSync(sourcePathOrBuffer)) {
      throw new Error(`File sao lưu SQLite không tồn tại: ${sourcePathOrBuffer}`);
    }
    tempSqlitePath = sourcePathOrBuffer;
  } else {
    tempSqlitePath = path.join(tempDir, `temp-restore-${timestamp}.sqlite`);
    fs.writeFileSync(tempSqlitePath, sourcePathOrBuffer);
  }

  try {
    // Tự động quét 100% tất cả các bảng trong SQLite không cần hardcode
    const pythonScript = `
import sqlite3, json, sys

db_path = sys.argv[1]
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
tables = [row[0] for row in cur.fetchall()]

data = {}
for tbl in tables:
    try:
        cur.execute(f'SELECT * FROM "{tbl}"')
        rows = [dict(r) for r in cur.fetchall()]
        data[tbl] = rows
    except Exception:
        data[tbl] = []

print(json.dumps({"data": data}))
conn.close()
`;
    const output = execSync(`python3 -c '${pythonScript}' "${tempSqlitePath}"`, {
      maxBuffer: 100 * 1024 * 1024,
      encoding: 'utf8',
    });
    const parsed = JSON.parse(output);
    const result = await restoreFromJsonDump(parsed);
    return {
      ...result,
      message: `Đã chuyển đổi và phục hồi thành công dữ liệu từ file SQLite vào PostgreSQL! (${result.recordsRestored} bản ghi)`,
    };
  } catch (err: any) {
    throw new Error(`Không thể trích xuất dữ liệu từ file SQLite để nạp vào PostgreSQL: ${err.message}`);
  } finally {
    if (typeof sourcePathOrBuffer !== 'string' && fs.existsSync(tempSqlitePath)) {
      try { fs.unlinkSync(tempSqlitePath); } catch {}
    }
  }
}

/**
 * Phục hồi từ một file sao lưu đã có sẵn trong thư mục backups/
 */
export async function restoreFromLocalBackup(filename: string): Promise<{
  success: boolean;
  message: string;
  preRestoreBackupFile: string;
  stats: DatabaseStats;
  recordsRestored?: number;
}> {
  const filePath = getSafeBackupFilePath(filename);
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`File sao lưu không tồn tại trên máy chủ: ${filename}`);
  }

  if (filename.endsWith('.json')) {
    const jsonContent = fs.readFileSync(filePath, 'utf-8');
    return await restoreFromJsonDump(jsonContent);
  } else if (filename.endsWith('.sql')) {
    const sqlContent = fs.readFileSync(filePath, 'utf-8');
    return await restoreFromSqlDump(sqlContent);
  } else if (filename.endsWith('.sqlite') || filename.endsWith('.db')) {
    return await restoreFromSqliteFile(filePath);
  } else {
    throw new Error('Định dạng file sao lưu không được hỗ trợ (chỉ chấp nhận .sql, .json, .sqlite, .db)');
  }
}

