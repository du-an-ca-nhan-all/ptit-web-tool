import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

export interface TableStat {
  name: string;
  label: string;
  count: number;
  description: string;
}

export interface DatabaseStats {
  tables: {
    users: number;
    students: number;
    examBatches: number;
    examRecords: number;
    courseRegistrations: number;
    systemMeta: number;
    externalAccounts: number;
    activityLogs: number;
    telegramConfigs: number;
    globalConfigs: number;
    examReminderLogs: number;
    qldtAnnouncementLogs: number;
    classScheduleReminderLogs: number;
    registrationRequests: number;
  };
  tableBreakdown: TableStat[];
  totalRecords: number;
  dbFileSize: number;
  dbFileSizeFormatted: string;
  dbLastModified: string | null;
}

export interface LocalBackupFile {
  name: string;
  format: 'sqlite' | 'json';
  size: number;
  sizeFormatted: string;
  createdAt: string;
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

export async function getDatabaseStats(): Promise<DatabaseStats> {
  const [
    users,
    students,
    examBatches,
    examRecords,
    courseRegistrations,
    systemMeta,
    externalAccounts,
    activityLogs,
    telegramConfigs,
    globalConfigs,
    examReminderLogs,
    qldtAnnouncementLogs,
    classScheduleReminderLogs,
    registrationRequests,
  ] = await Promise.all([
    prisma.user.count().catch(() => 0),
    prisma.student.count().catch(() => 0),
    prisma.examBatch.count().catch(() => 0),
    prisma.examRecord.count().catch(() => 0),
    prisma.courseRegistration.count().catch(() => 0),
    prisma.systemMeta.count().catch(() => 0),
    prisma.externalAccount.count().catch(() => 0),
    prisma.activityLog.count().catch(() => 0),
    prisma.telegramConfig.count().catch(() => 0),
    prisma.globalConfig.count().catch(() => 0),
    prisma.examReminderLog.count().catch(() => 0),
    prisma.qldtAnnouncementLog.count().catch(() => 0),
    prisma.classScheduleReminderLog.count().catch(() => 0),
    prisma.registrationRequest.count().catch(() => 0),
  ]);

  const dbPath = getDatabaseFilePath();
  let dbFileSize = 0;
  let dbLastModified: string | null = null;

  if (fs.existsSync(dbPath)) {
    const stat = fs.statSync(dbPath);
    dbFileSize = stat.size;
    dbLastModified = stat.mtime.toISOString();
  }

  const tableStats = {
    users,
    students,
    examBatches,
    examRecords,
    courseRegistrations,
    systemMeta,
    externalAccounts,
    activityLogs,
    telegramConfigs,
    globalConfigs,
    examReminderLogs,
    qldtAnnouncementLogs,
    classScheduleReminderLogs,
    registrationRequests,
  };

  const totalRecords = Object.values(tableStats).reduce((sum, val) => sum + val, 0);

  const tableBreakdown: TableStat[] = [
    { name: 'Student', label: 'Sinh viên & Hồ sơ', count: students, description: 'Thông tin cá nhân, mã SV, lớp, trạng thái' },
    { name: 'ExamRecord', label: 'Lịch thi', count: examRecords, description: 'Các bản ghi ca thi, phòng thi, môn thi, đợt thi' },
    { name: 'ExamBatch', label: 'Đợt thi', count: examBatches, description: 'Danh sách các đợt thi học kỳ' },
    { name: 'User', label: 'Tài khoản người dùng', count: users, description: 'Tài khoản xác thực đăng nhập và phân quyền' },
    { name: 'CourseRegistration', label: 'Đăng ký môn học', count: courseRegistrations, description: 'Dữ liệu kết quả ĐKMH kéo từ cổng QLDTTX' },
    { name: 'ExternalAccount', label: 'Tài khoản QLDTTX', count: externalAccounts, description: 'Cấu hình đồng bộ cổng ngoài và token' },
    { name: 'TelegramConfig', label: 'Cấu hình Telegram cá nhân', count: telegramConfigs, description: 'Thiết lập nhận thông báo bot Telegram theo SV' },
    { name: 'GlobalConfig', label: 'Cấu hình toàn cục hệ thống', count: globalConfigs, description: 'Cấu hình chung hệ thống lưu dạng key-value JSON (Bot Telegram, v.v.)' },
    { name: 'RegistrationRequest', label: 'Yêu cầu đăng ký', count: registrationRequests, description: 'Hồ sơ tài khoản chờ Admin xét duyệt' },
    { name: 'ActivityLog', label: 'Nhật ký hoạt động', count: activityLogs, description: 'Lịch sử thao tác người dùng và hệ thống' },
    { name: 'ExamReminderLog', label: 'Nhật ký nhắc lịch thi', count: examReminderLogs, description: 'Lịch sử gửi thông báo nhắc thi' },
    { name: 'ClassScheduleReminderLog', label: 'Nhật ký nhắc lịch học', count: classScheduleReminderLogs, description: 'Lịch sử gửi thông báo nhắc học' },
    { name: 'QldtAnnouncementLog', label: 'Nhật ký thông báo QLDTTX', count: qldtAnnouncementLogs, description: 'Lịch sử thông báo từ cổng QLDTTX' },
    { name: 'SystemMeta', label: 'Cấu hình hệ thống', count: systemMeta, description: 'Thông số và trạng thái khởi tạo hệ thống' },
  ];

  return {
    tables: tableStats,
    tableBreakdown,
    totalRecords,
    dbFileSize,
    dbFileSizeFormatted: formatBytes(dbFileSize),
    dbLastModified,
  };
}

export async function exportDatabaseAsJson(): Promise<{
  metadata: {
    appName: string;
    version: string;
    exportedAt: string;
    database: string;
    stats: DatabaseStats;
  };
  data: {
    users: any[];
    students: any[];
    examBatches: any[];
    examRecords: any[];
    courseRegistrations: any[];
    systemMeta: any[];
    externalAccounts: any[];
    activityLogs: any[];
    telegramConfigs: any[];
    globalConfigs: any[];
    examReminderLogs: any[];
    qldtAnnouncementLogs: any[];
    classScheduleReminderLogs: any[];
    registrationRequests: any[];
  };
}> {
  const stats = await getDatabaseStats();

  const [
    users,
    students,
    examBatches,
    examRecords,
    courseRegistrations,
    systemMeta,
    externalAccounts,
    activityLogs,
    telegramConfigs,
    globalConfigs,
    examReminderLogs,
    qldtAnnouncementLogs,
    classScheduleReminderLogs,
    registrationRequests,
  ] = await Promise.all([
    prisma.user.findMany({ orderBy: { id: 'asc' } }),
    prisma.student.findMany({ orderBy: { id: 'asc' } }),
    prisma.examBatch.findMany({ orderBy: { id: 'asc' } }),
    prisma.examRecord.findMany({ orderBy: { id: 'asc' } }),
    prisma.courseRegistration.findMany({ orderBy: { id: 'asc' } }),
    prisma.systemMeta.findMany({ orderBy: { id: 'asc' } }),
    prisma.externalAccount.findMany({ orderBy: { id: 'asc' } }),
    prisma.activityLog.findMany({ orderBy: { id: 'asc' } }),
    prisma.telegramConfig.findMany({ orderBy: { id: 'asc' } }),
    prisma.globalConfig.findMany({ orderBy: { id: 'asc' } }),
    prisma.examReminderLog.findMany({ orderBy: { id: 'asc' } }),
    prisma.qldtAnnouncementLog.findMany({ orderBy: { id: 'asc' } }),
    prisma.classScheduleReminderLog.findMany({ orderBy: { id: 'asc' } }),
    prisma.registrationRequest.findMany({ orderBy: { id: 'asc' } }),
  ]);

  return {
    metadata: {
      appName: 'PTIT Web Tool - Exam & Schedule Portal',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      database: 'SQLite',
      stats,
    },
    data: {
      users,
      students,
      examBatches,
      examRecords,
      courseRegistrations,
      systemMeta,
      externalAccounts,
      activityLogs,
      telegramConfigs,
      globalConfigs,
      examReminderLogs,
      qldtAnnouncementLogs,
      classScheduleReminderLogs,
      registrationRequests,
    },
  };
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

export async function createLocalBackup(format: 'sqlite' | 'json' | 'all' = 'all'): Promise<LocalBackupFile[]> {
  const backupsDir = getBackupsDirectory();
  const timestamp = generateTimestampString();
  const createdFiles: LocalBackupFile[] = [];

  // 1. Backup SQLite
  if (format === 'sqlite' || format === 'all') {
    const dbPath = getDatabaseFilePath();
    if (fs.existsSync(dbPath)) {
      const filename = `ptit-db-backup-${timestamp}.sqlite`;
      const targetPath = path.join(backupsDir, filename);
      fs.copyFileSync(dbPath, targetPath);
      const stat = fs.statSync(targetPath);
      createdFiles.push({
        name: filename,
        format: 'sqlite',
        size: stat.size,
        sizeFormatted: formatBytes(stat.size),
        createdAt: stat.birthtime.toISOString(),
      });
    }
  }

  // 2. Backup JSON
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

      let format: 'sqlite' | 'json' = 'sqlite';
      if (file.endsWith('.json')) {
        format = 'json';
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
