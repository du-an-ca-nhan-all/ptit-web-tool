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
    examRooms: number;
  };
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
    examRooms,
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
    prisma.examRoom.count().catch(() => 0),
  ]);

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
    examRooms,
  };

  const totalRecords = Object.values(tableStats).reduce((sum, val) => sum + val, 0);

  const tableBreakdown: TableStat[] = [
    { name: 'Student', label: 'Sinh viên & Hồ sơ', count: students, description: 'Thông tin cá nhân, mã SV, lớp, trạng thái' },
    { name: 'ExamRecord', label: 'Lịch thi', count: examRecords, description: 'Các bản ghi ca thi, phòng thi, môn thi, đợt thi' },
    { name: 'ExamBatch', label: 'Đợt thi', count: examBatches, description: 'Danh sách các đợt thi học kỳ' },
    { name: 'ExamRoom', label: 'Phòng thi & Giá tùy chỉnh', count: examRooms, description: 'Danh sách phòng thi và định mức tiền phòng tùy chỉnh' },
    { name: 'User', label: 'Tài khoản người dùng', count: users, description: 'Tài khoản xác thực đăng nhập và phân quyền' },
    { name: 'CourseRegistration', label: 'Đăng ký môn học', count: courseRegistrations, description: 'Dữ liệu kết quả ĐKMH kéo từ cổng QLDTTX' },
    { name: 'ExternalAccount', label: 'Tài khoản QLDTTX', count: externalAccounts, description: 'Cấu hình đồng bộ cổng ngoài và token' },
    { name: 'TelegramConfig', label: 'Cấu hình Telegram cá nhân', count: telegramConfigs, description: 'Thiết lập nhận thông báo bot Telegram theo SV' },
    { name: 'GlobalConfig', label: 'Cấu hình toàn cục hệ thống', count: globalConfigs, description: 'Cấu hình chung hệ thống lưu dạng key-value JSON (Bot Telegram, Backup Telegram, v.v.)' },
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
    examRooms: any[];
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
    examRooms,
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
    prisma.examRoom.findMany({ orderBy: { id: 'asc' } }),
  ]);

  return {
    metadata: {
      appName: 'PTIT Web Tool - Exam & Schedule Portal',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      database: 'PostgreSQL',
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
      examRooms,
    },
  };
}

function sqlVal(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

/**
 * Xuất toàn bộ cơ sở dữ liệu PostgreSQL sang script SQL (.sql)
 */
export async function exportDatabaseAsSqlDump(): Promise<string> {
  const json = await exportDatabaseAsJson();
  const d = json.data;
  const lines: string[] = [];

  lines.push('-- ================================================================');
  lines.push('-- PTIT WEB TOOL - POSTGRESQL DATABASE BACKUP (.sql)');
  lines.push(`-- App: ${json.metadata.appName} (v${json.metadata.version})`);
  lines.push(`-- Exported At: ${json.metadata.exportedAt}`);
  lines.push(`-- Total Records: ${json.metadata.stats.totalRecords.toLocaleString('vi-VN')}`);
  lines.push('-- ================================================================');
  lines.push('');
  lines.push('BEGIN;');
  lines.push("SET session_replication_role = 'replica';");
  lines.push('');

  // 1. Truncate tables
  lines.push('-- 1. Clean existing records in cascade');
  lines.push('TRUNCATE TABLE "ClassScheduleReminderLog", "QldtAnnouncementLog", "ExamReminderLog", "ActivityLog", "TelegramConfig", "ExternalAccount", "CourseRegistration", "ExamRecord", "ExamBatch", "User", "Student", "RegistrationRequest", "GlobalConfig", "SystemMeta" CASCADE;');
  lines.push('');

  // 2. SystemMeta
  if (d.systemMeta?.length) {
    lines.push(`-- SystemMeta (${d.systemMeta.length} rows)`);
    for (const r of d.systemMeta) {
      lines.push(`INSERT INTO "SystemMeta" ("id", "key", "value", "updatedAt") VALUES (${sqlVal(r.id)}, ${sqlVal(r.key)}, ${sqlVal(r.value)}, ${sqlVal(r.updatedAt)});`);
    }
    lines.push('');
  }

  // 3. GlobalConfig
  if (d.globalConfigs?.length) {
    lines.push(`-- GlobalConfig (${d.globalConfigs.length} rows)`);
    for (const r of d.globalConfigs) {
      lines.push(`INSERT INTO "GlobalConfig" ("id", "key", "value", "description", "createdAt", "updatedAt") VALUES (${sqlVal(r.id)}, ${sqlVal(r.key)}, ${sqlVal(r.value)}, ${sqlVal(r.description)}, ${sqlVal(r.createdAt)}, ${sqlVal(r.updatedAt)});`);
    }
    lines.push('');
  }

  // 4. Student
  if (d.students?.length) {
    lines.push(`-- Student (${d.students.length} rows)`);
    for (const r of d.students) {
      lines.push(`INSERT INTO "Student" ("id", "maSV", "hoLot", "ten", "hoTen", "gioiTinh", "ngaySinh", "maLop", "trangThai", "soDienThoai", "ghiChu", "createdAt", "updatedAt") VALUES (${sqlVal(r.id)}, ${sqlVal(r.maSV)}, ${sqlVal(r.hoLot)}, ${sqlVal(r.ten)}, ${sqlVal(r.hoTen)}, ${sqlVal(r.gioiTinh)}, ${sqlVal(r.ngaySinh)}, ${sqlVal(r.maLop)}, ${sqlVal(r.trangThai)}, ${sqlVal(r.soDienThoai)}, ${sqlVal(r.ghiChu)}, ${sqlVal(r.createdAt)}, ${sqlVal(r.updatedAt)});`);
    }
    lines.push('');
  }

  // 5. User
  if (d.users?.length) {
    lines.push(`-- User (${d.users.length} rows)`);
    for (const r of d.users) {
      lines.push(`INSERT INTO "User" ("id", "username", "passwordHash", "role", "isActive", "lastLogin", "createdAt", "updatedAt") VALUES (${sqlVal(r.id)}, ${sqlVal(r.username)}, ${sqlVal(r.passwordHash)}, ${sqlVal(r.role)}, ${sqlVal(r.isActive)}, ${sqlVal(r.lastLogin)}, ${sqlVal(r.createdAt)}, ${sqlVal(r.updatedAt)});`);
    }
    lines.push('');
  }

  // 6. ExamBatch
  if (d.examBatches?.length) {
    lines.push(`-- ExamBatch (${d.examBatches.length} rows)`);
    for (const r of d.examBatches) {
      lines.push(`INSERT INTO "ExamBatch" ("id", "code", "name", "semester", "academicYear", "startDate", "endDate", "isActive", "description", "createdAt", "updatedAt") VALUES (${sqlVal(r.id)}, ${sqlVal(r.code)}, ${sqlVal(r.name)}, ${sqlVal(r.semester)}, ${sqlVal(r.academicYear)}, ${sqlVal(r.startDate)}, ${sqlVal(r.endDate)}, ${sqlVal(r.isActive)}, ${sqlVal(r.description)}, ${sqlVal(r.createdAt)}, ${sqlVal(r.updatedAt)});`);
    }
    lines.push('');
  }

  // 7. ExamRecord
  if (d.examRecords?.length) {
    lines.push(`-- ExamRecord (${d.examRecords.length} rows)`);
    for (const r of d.examRecords) {
      lines.push(`INSERT INTO "ExamRecord" ("id", "maSV", "batchCode", "nhomThi", "mapThi", "maMH", "tenMH", "maHTThi", "nhomHoc", "toThi", "maLopMH", "ngayThi", "gioThi", "soPhutThi", "maDotThi", "tenDotThi", "isPostponed", "createdAt") VALUES (${sqlVal(r.id)}, ${sqlVal(r.maSV)}, ${sqlVal(r.batchCode)}, ${sqlVal(r.nhomThi)}, ${sqlVal(r.mapThi)}, ${sqlVal(r.maMH)}, ${sqlVal(r.tenMH)}, ${sqlVal(r.maHTThi)}, ${sqlVal(r.nhomHoc)}, ${sqlVal(r.toThi)}, ${sqlVal(r.maLopMH)}, ${sqlVal(r.ngayThi)}, ${sqlVal(r.gioThi)}, ${sqlVal(r.soPhutThi)}, ${sqlVal(r.maDotThi)}, ${sqlVal(r.tenDotThi)}, ${sqlVal(r.isPostponed)}, ${sqlVal(r.createdAt)});`);
    }
    lines.push('');
  }

  // 8. CourseRegistration
  if (d.courseRegistrations?.length) {
    lines.push(`-- CourseRegistration (${d.courseRegistrations.length} rows)`);
    for (const r of d.courseRegistrations) {
      lines.push(`INSERT INTO "CourseRegistration" ("id", "classCode", "username", "data", "totalCourses", "totalCredits", "tuitionFee", "lastPulledAt", "createdAt", "updatedAt") VALUES (${sqlVal(r.id)}, ${sqlVal(r.classCode)}, ${sqlVal(r.username)}, ${sqlVal(r.data)}, ${sqlVal(r.totalCourses)}, ${sqlVal(r.totalCredits)}, ${sqlVal(r.tuitionFee)}, ${sqlVal(r.lastPulledAt)}, ${sqlVal(r.createdAt)}, ${sqlVal(r.updatedAt)});`);
    }
    lines.push('');
  }

  // 9. ExternalAccount
  if (d.externalAccounts?.length) {
    lines.push(`-- ExternalAccount (${d.externalAccounts.length} rows)`);
    for (const r of d.externalAccounts) {
      lines.push(`INSERT INTO "ExternalAccount" ("id", "username", "systemKey", "systemName", "systemUrl", "extUsername", "extPassword", "token", "status", "lastSyncAt", "syncMessage", "createdAt", "updatedAt") VALUES (${sqlVal(r.id)}, ${sqlVal(r.username)}, ${sqlVal(r.systemKey)}, ${sqlVal(r.systemName)}, ${sqlVal(r.systemUrl)}, ${sqlVal(r.extUsername)}, ${sqlVal(r.extPassword)}, ${sqlVal(r.token)}, ${sqlVal(r.status)}, ${sqlVal(r.lastSyncAt)}, ${sqlVal(r.syncMessage)}, ${sqlVal(r.createdAt)}, ${sqlVal(r.updatedAt)});`);
    }
    lines.push('');
  }

  // 10. TelegramConfig
  if (d.telegramConfigs?.length) {
    lines.push(`-- TelegramConfig (${d.telegramConfigs.length} rows)`);
    for (const r of d.telegramConfigs) {
      lines.push(`INSERT INTO "TelegramConfig" ("id", "username", "botToken", "chatId", "threadId", "isEnabled", "notifyExamSchedule", "notifyClassActivity", "notifyQldtAnnouncements", "qldtCheckInterval", "lastQldtCheckedAt", "notifyClassSchedule", "classReminderBefore", "lastTestedAt", "lastTestStatus", "lastTestError", "botUsername", "botFirstName", "createdAt", "updatedAt") VALUES (${sqlVal(r.id)}, ${sqlVal(r.username)}, ${sqlVal(r.botToken)}, ${sqlVal(r.chatId)}, ${sqlVal(r.threadId)}, ${sqlVal(r.isEnabled)}, ${sqlVal(r.notifyExamSchedule)}, ${sqlVal(r.notifyClassActivity)}, ${sqlVal(r.notifyQldtAnnouncements)}, ${sqlVal(r.qldtCheckInterval)}, ${sqlVal(r.lastQldtCheckedAt)}, ${sqlVal(r.notifyClassSchedule)}, ${sqlVal(r.classReminderBefore)}, ${sqlVal(r.lastTestedAt)}, ${sqlVal(r.lastTestStatus)}, ${sqlVal(r.lastTestError)}, ${sqlVal(r.botUsername)}, ${sqlVal(r.botFirstName)}, ${sqlVal(r.createdAt)}, ${sqlVal(r.updatedAt)});`);
    }
    lines.push('');
  }

  // 11. RegistrationRequest
  if (d.registrationRequests?.length) {
    lines.push(`-- RegistrationRequest (${d.registrationRequests.length} rows)`);
    for (const r of d.registrationRequests) {
      lines.push(`INSERT INTO "RegistrationRequest" ("id", "username", "fullName", "email", "phoneNumber", "lop", "passwordHash", "status", "note", "reviewedBy", "reviewedAt", "createdAt", "updatedAt") VALUES (${sqlVal(r.id)}, ${sqlVal(r.username)}, ${sqlVal(r.fullName)}, ${sqlVal(r.email)}, ${sqlVal(r.phoneNumber)}, ${sqlVal(r.lop)}, ${sqlVal(r.passwordHash)}, ${sqlVal(r.status)}, ${sqlVal(r.note)}, ${sqlVal(r.reviewedBy)}, ${sqlVal(r.reviewedAt)}, ${sqlVal(r.createdAt)}, ${sqlVal(r.updatedAt)});`);
    }
    lines.push('');
  }

  // 12. ActivityLog
  if (d.activityLogs?.length) {
    lines.push(`-- ActivityLog (${d.activityLogs.length} rows)`);
    for (const r of d.activityLogs) {
      lines.push(`INSERT INTO "ActivityLog" ("id", "userId", "username", "userRole", "action", "targetType", "targetId", "description", "metadata", "ipAddress", "userAgent", "createdAt") VALUES (${sqlVal(r.id)}, ${sqlVal(r.userId)}, ${sqlVal(r.username)}, ${sqlVal(r.userRole)}, ${sqlVal(r.action)}, ${sqlVal(r.targetType)}, ${sqlVal(r.targetId)}, ${sqlVal(r.description)}, ${sqlVal(r.metadata)}, ${sqlVal(r.ipAddress)}, ${sqlVal(r.userAgent)}, ${sqlVal(r.createdAt)});`);
    }
    lines.push('');
  }

  // 13. ExamReminderLog
  if (d.examReminderLogs?.length) {
    lines.push(`-- ExamReminderLog (${d.examReminderLogs.length} rows)`);
    for (const r of d.examReminderLogs) {
      lines.push(`INSERT INTO "ExamReminderLog" ("id", "username", "examRecordId", "reminderType", "targetDate", "sentAt") VALUES (${sqlVal(r.id)}, ${sqlVal(r.username)}, ${sqlVal(r.examRecordId)}, ${sqlVal(r.reminderType)}, ${sqlVal(r.targetDate)}, ${sqlVal(r.sentAt)});`);
    }
    lines.push('');
  }

  // 14. QldtAnnouncementLog
  if (d.qldtAnnouncementLogs?.length) {
    lines.push(`-- QldtAnnouncementLog (${d.qldtAnnouncementLogs.length} rows)`);
    for (const r of d.qldtAnnouncementLogs) {
      lines.push(`INSERT INTO "QldtAnnouncementLog" ("id", "username", "announcementId", "title", "publishDate", "sentAt") VALUES (${sqlVal(r.id)}, ${sqlVal(r.username)}, ${sqlVal(r.announcementId)}, ${sqlVal(r.title)}, ${sqlVal(r.publishDate)}, ${sqlVal(r.sentAt)});`);
    }
    lines.push('');
  }

  // 15. ClassScheduleReminderLog
  if (d.classScheduleReminderLogs?.length) {
    lines.push(`-- ClassScheduleReminderLog (${d.classScheduleReminderLogs.length} rows)`);
    for (const r of d.classScheduleReminderLogs) {
      lines.push(`INSERT INTO "ClassScheduleReminderLog" ("id", "username", "courseCode", "reminderType", "targetDate", "sessionInfo", "sentAt") VALUES (${sqlVal(r.id)}, ${sqlVal(r.username)}, ${sqlVal(r.courseCode)}, ${sqlVal(r.reminderType)}, ${sqlVal(r.targetDate)}, ${sqlVal(r.sessionInfo)}, ${sqlVal(r.sentAt)});`);
    }
    lines.push('');
  }

  // 16. ExamRoom
  if (d.examRooms?.length) {
    lines.push(`-- ExamRoom (${d.examRooms.length} rows)`);
    for (const r of d.examRooms) {
      lines.push(`INSERT INTO "ExamRoom" ("id", "roomKey", "mapThi", "maMH", "tenMH", "ngayThi", "gioThi", "maHTThi", "batchCode", "customPrice", "note", "updatedBy", "createdAt", "updatedAt") VALUES (${sqlVal(r.id)}, ${sqlVal(r.roomKey)}, ${sqlVal(r.mapThi)}, ${sqlVal(r.maMH)}, ${sqlVal(r.tenMH)}, ${sqlVal(r.ngayThi)}, ${sqlVal(r.gioThi)}, ${sqlVal(r.maHTThi)}, ${sqlVal(r.batchCode)}, ${sqlVal(r.customPrice)}, ${sqlVal(r.note)}, ${sqlVal(r.updatedBy)}, ${sqlVal(r.createdAt)}, ${sqlVal(r.updatedAt)});`);
    }
    lines.push('');
  }

  lines.push("SET session_replication_role = 'origin';");
  lines.push('');
  lines.push('-- Reset auto-increment sequences');
  const tablesWithId = [
    'User',
    'Student',
    'ExamBatch',
    'ExamRecord',
    'CourseRegistration',
    'SystemMeta',
    'ExternalAccount',
    'ActivityLog',
    'TelegramConfig',
    'GlobalConfig',
    'ExamReminderLog',
    'QldtAnnouncementLog',
    'ClassScheduleReminderLog',
    'RegistrationRequest',
    'ExamRoom',
  ];
  for (const t of tablesWithId) {
    lines.push(`SELECT setval(pg_get_serial_sequence('"${t}"', 'id'), coalesce(max(id), 1), max(id) IS NOT NULL) FROM "${t}";`);
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

  // If custom token is provided, verify it
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

  // Update test status in global config
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

      const caption = `🐘 <b>BẢN SAO LƯU DATABASE POSTGRESQL (.sql)</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 <b>Tổng số bản ghi:</b> ${stats.totalRecords.toLocaleString('vi-VN')}\n👥 <b>Sinh viên:</b> ${stats.tables.students.toLocaleString('vi-VN')} | <b>Lịch thi:</b> ${stats.tables.examRecords.toLocaleString('vi-VN')}\n📁 <b>Tài khoản:</b> ${stats.tables.users.toLocaleString('vi-VN')} | <b>Đợt thi:</b> ${stats.tables.examBatches}\n💾 <b>Dung lượng file:</b> ${sizeFormatted}\n⏰ <b>Thời gian:</b> <i>${timeDisplay}</i>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🛡️ <i>File SQL Dump chuẩn PostgreSQL - Khôi phục tức thì hoặc nạp vào PostgreSQL bằng lệnh psql.</i>`;

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

      const caption = `📄 <b>BẢN XUẤT DỮ LIỆU JSON ĐẦY ĐỦ (.json)</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 <b>Tổng số bản ghi:</b> ${stats.totalRecords.toLocaleString('vi-VN')}\n📋 <b>Bao gồm:</b> 14 bảng dữ liệu hệ thống PostgreSQL\n💾 <b>Dung lượng file:</b> ${sizeFormatted}\n⏰ <b>Thời gian:</b> <i>${timeDisplay}</i>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🌐 <i>Dữ liệu JSON có cấu trúc đầy đủ, dễ đọc & di chuyển sang mọi môi trường.</i>`;

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

  // Update last sent status in GlobalConfig
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

    console.log(`⏰ [Auto Backup 10:00 AM VN] Bắt đầu tự động tạo bản sao lưu dữ liệu PostgreSQL lúc ${scheduleTime} sáng...`);

    // 1. Tạo snapshot lưu cục bộ trên máy chủ
    const createdFiles = await createLocalBackup('all');
    console.log(`⏰ [Auto Backup 10:00 AM VN] Đã tạo ${createdFiles.length} file snapshot trên máy chủ.`);

    // 2. Gửi Telegram nếu có cấu hình
    let telegramResult: any = null;
    if (config?.chatId && config.isEnabled !== false) {
      try {
        telegramResult = await sendBackupToTelegram();
        console.log(`⏰ [Auto Backup 10:00 AM VN] Đã gửi ${telegramResult.filesSent?.length || 0} file lên Telegram.`);
      } catch (telErr: any) {
        console.error(`⏰ [Auto Backup 10:00 AM VN] Lỗi khi gửi file lên Telegram:`, telErr.message);
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
// DATABASE RESTORATION CAPABILITIES (Phục hồi CSDL PostgreSQL)
// ─────────────────────────────────────────────────────────────────────────────

async function insertInChunks<T>(
  items: T[],
  chunkSize: number,
  insertFn: (chunk: any[]) => Promise<any>
) {
  if (!items || items.length === 0) return;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await insertFn(chunk as any[]);
  }
}

export async function syncPostgresSequences(): Promise<void> {
  const tablesWithId = [
    'User',
    'Student',
    'ExamBatch',
    'ExamRecord',
    'CourseRegistration',
    'SystemMeta',
    'ExternalAccount',
    'ActivityLog',
    'TelegramConfig',
    'GlobalConfig',
    'ExamReminderLog',
    'QldtAnnouncementLog',
    'ClassScheduleReminderLog',
    'RegistrationRequest',
  ];
  for (const table of tablesWithId) {
    try {
      await (prisma as any).$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max(id), 1), max(id) IS NOT NULL) FROM "${table}";`
      );
    } catch {
      // Silently ignore if not running on PostgreSQL
    }
  }
}

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
    message: `Phục hồi cơ sở dữ liệu từ file SQL Dump PostgreSQL thành công! Tổng cộng ${stats.totalRecords.toLocaleString('vi-VN')} bản ghi.`,
    preRestoreBackupFile: preRestoreName,
    stats,
  };
}

/**
 * Phục hồi cơ sở dữ liệu từ file JSON dump đầy đủ
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

  const parseDate = (d: any) => (d ? new Date(d) : undefined);

  // 2. Xóa sạch dữ liệu cũ theo thứ tự khóa ngoại an toàn
  await prisma.classScheduleReminderLog.deleteMany({}).catch(() => {});
  await prisma.qldtAnnouncementLog.deleteMany({}).catch(() => {});
  await prisma.examReminderLog.deleteMany({}).catch(() => {});
  await prisma.activityLog.deleteMany({}).catch(() => {});
  await prisma.telegramConfig.deleteMany({}).catch(() => {});
  await prisma.externalAccount.deleteMany({}).catch(() => {});
  await prisma.courseRegistration.deleteMany({}).catch(() => {});
  await prisma.examRecord.deleteMany({}).catch(() => {});
  await prisma.examBatch.deleteMany({}).catch(() => {});
  await prisma.user.deleteMany({}).catch(() => {});
  await prisma.student.deleteMany({}).catch(() => {});
  await prisma.registrationRequest.deleteMany({}).catch(() => {});
  await prisma.globalConfig.deleteMany({}).catch(() => {});
  await prisma.systemMeta.deleteMany({}).catch(() => {});

  let count = 0;

  // 3. Nạp dữ liệu mới theo thứ tự phụ thuộc chính xác

  // SystemMeta
  if (Array.isArray(data.systemMeta) && data.systemMeta.length > 0) {
    const items = data.systemMeta.map((s: any) => ({
      id: s.id,
      key: s.key,
      value: s.value,
      updatedAt: parseDate(s.updatedAt) || new Date(),
    }));
    await insertInChunks(items, 200, (c) => prisma.systemMeta.createMany({ data: c, skipDuplicates: true }));
    count += items.length;
  }

  // GlobalConfig
  if (Array.isArray(data.globalConfigs) && data.globalConfigs.length > 0) {
    const items = data.globalConfigs.map((g: any) => ({
      id: g.id,
      key: g.key,
      value: g.value,
      description: g.description ?? null,
      createdAt: parseDate(g.createdAt) || new Date(),
      updatedAt: parseDate(g.updatedAt) || new Date(),
    }));
    await insertInChunks(items, 200, (c) => prisma.globalConfig.createMany({ data: c, skipDuplicates: true }));
    count += items.length;
  }

  // Student
  if (Array.isArray(data.students) && data.students.length > 0) {
    const items = data.students.map((s: any) => ({
      id: s.id,
      maSV: s.maSV,
      hoLot: s.hoLot ?? null,
      ten: s.ten ?? null,
      hoTen: s.hoTen ?? null,
      gioiTinh: s.gioiTinh ?? null,
      ngaySinh: s.ngaySinh ?? null,
      maLop: s.maLop ?? null,
      trangThai: s.trangThai ?? 'DANG_HOC',
      soDienThoai: s.soDienThoai ?? null,
      ghiChu: s.ghiChu ?? null,
      createdAt: parseDate(s.createdAt) || new Date(),
      updatedAt: parseDate(s.updatedAt) || new Date(),
    }));
    await insertInChunks(items, 300, (c) => prisma.student.createMany({ data: c, skipDuplicates: true }));
    count += items.length;
  }

  // User
  if (Array.isArray(data.users) && data.users.length > 0) {
    const items = data.users.map((u: any) => ({
      id: u.id,
      username: u.username,
      passwordHash: u.passwordHash,
      role: u.role || 'sinh_vien',
      isActive: u.isActive !== undefined ? Boolean(u.isActive) : true,
      lastLogin: parseDate(u.lastLogin) || null,
      createdAt: parseDate(u.createdAt) || new Date(),
      updatedAt: parseDate(u.updatedAt) || new Date(),
    }));
    await insertInChunks(items, 300, (c) => prisma.user.createMany({ data: c, skipDuplicates: true }));
    count += items.length;
  }

  // ExamBatch
  if (Array.isArray(data.examBatches) && data.examBatches.length > 0) {
    const items = data.examBatches.map((b: any) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      semester: b.semester ?? null,
      academicYear: b.academicYear ?? null,
      startDate: b.startDate ?? null,
      endDate: b.endDate ?? null,
      isActive: b.isActive !== undefined ? Boolean(b.isActive) : true,
      description: b.description ?? null,
      createdAt: parseDate(b.createdAt) || new Date(),
      updatedAt: parseDate(b.updatedAt) || new Date(),
    }));
    await insertInChunks(items, 200, (c) => prisma.examBatch.createMany({ data: c, skipDuplicates: true }));
    count += items.length;
  }

  // ExamRecord
  if (Array.isArray(data.examRecords) && data.examRecords.length > 0) {
    const items = data.examRecords.map((r: any) => ({
      id: r.id,
      maSV: r.maSV,
      batchCode: r.batchCode ?? null,
      nhomThi: r.nhomThi ?? null,
      mapThi: r.mapThi ?? null,
      maMH: r.maMH ?? null,
      tenMH: r.tenMH ?? null,
      maHTThi: r.maHTThi ?? null,
      nhomHoc: r.nhomHoc ?? null,
      toThi: r.toThi ?? null,
      maLopMH: r.maLopMH ?? null,
      ngayThi: r.ngayThi ?? null,
      gioThi: r.gioThi ?? null,
      soPhutThi: r.soPhutThi ?? null,
      maDotThi: r.maDotThi ?? null,
      tenDotThi: r.tenDotThi ?? null,
      isPostponed: Boolean(r.isPostponed),
      createdAt: parseDate(r.createdAt) || new Date(),
    }));
    await insertInChunks(items, 500, (c) => prisma.examRecord.createMany({ data: c, skipDuplicates: true }));
    count += items.length;
  }

  // CourseRegistration
  if (Array.isArray(data.courseRegistrations) && data.courseRegistrations.length > 0) {
    const items = data.courseRegistrations.map((cr: any) => ({
      id: cr.id,
      classCode: cr.classCode,
      username: cr.username,
      data: cr.data,
      totalCourses: cr.totalCourses ?? 0,
      totalCredits: cr.totalCredits ?? 0,
      tuitionFee: cr.tuitionFee ?? 0,
      lastPulledAt: parseDate(cr.lastPulledAt) || new Date(),
      createdAt: parseDate(cr.createdAt) || new Date(),
      updatedAt: parseDate(cr.updatedAt) || new Date(),
    }));
    await insertInChunks(items, 200, (c) => prisma.courseRegistration.createMany({ data: c, skipDuplicates: true }));
    count += items.length;
  }

  // ExternalAccount
  if (Array.isArray(data.externalAccounts) && data.externalAccounts.length > 0) {
    const items = data.externalAccounts.map((ea: any) => ({
      id: ea.id,
      username: ea.username,
      systemKey: ea.systemKey,
      systemName: ea.systemName,
      systemUrl: ea.systemUrl,
      extUsername: ea.extUsername,
      extPassword: ea.extPassword,
      token: ea.token ?? null,
      status: ea.status || 'CONNECTED',
      lastSyncAt: parseDate(ea.lastSyncAt) || null,
      syncMessage: ea.syncMessage ?? null,
      createdAt: parseDate(ea.createdAt) || new Date(),
      updatedAt: parseDate(ea.updatedAt) || new Date(),
    }));
    await insertInChunks(items, 200, (c) => prisma.externalAccount.createMany({ data: c, skipDuplicates: true }));
    count += items.length;
  }

  // TelegramConfig
  if (Array.isArray(data.telegramConfigs) && data.telegramConfigs.length > 0) {
    const items = data.telegramConfigs.map((tc: any) => ({
      id: tc.id,
      username: tc.username,
      botToken: tc.botToken ?? null,
      chatId: tc.chatId,
      threadId: tc.threadId ?? null,
      isEnabled: tc.isEnabled !== undefined ? Boolean(tc.isEnabled) : true,
      notifyExamSchedule: tc.notifyExamSchedule !== undefined ? Boolean(tc.notifyExamSchedule) : true,
      notifyClassActivity: tc.notifyClassActivity !== undefined ? Boolean(tc.notifyClassActivity) : true,
      notifyQldtAnnouncements: tc.notifyQldtAnnouncements !== undefined ? Boolean(tc.notifyQldtAnnouncements) : true,
      qldtCheckInterval: Number(tc.qldtCheckInterval) || 2,
      lastQldtCheckedAt: parseDate(tc.lastQldtCheckedAt) || null,
      notifyClassSchedule: tc.notifyClassSchedule !== undefined ? Boolean(tc.notifyClassSchedule) : true,
      classReminderBefore: Number(tc.classReminderBefore) || 30,
      lastTestedAt: parseDate(tc.lastTestedAt) || null,
      lastTestStatus: tc.lastTestStatus ?? null,
      lastTestError: tc.lastTestError ?? null,
      botUsername: tc.botUsername ?? null,
      botFirstName: tc.botFirstName ?? null,
      createdAt: parseDate(tc.createdAt) || new Date(),
      updatedAt: parseDate(tc.updatedAt) || new Date(),
    }));
    await insertInChunks(items, 200, (c) => prisma.telegramConfig.createMany({ data: c, skipDuplicates: true }));
    count += items.length;
  }

  // RegistrationRequest
  if (Array.isArray(data.registrationRequests) && data.registrationRequests.length > 0) {
    const items = data.registrationRequests.map((rr: any) => ({
      id: rr.id,
      username: rr.username,
      fullName: rr.fullName ?? null,
      email: rr.email ?? null,
      phoneNumber: rr.phoneNumber ?? null,
      lop: rr.lop ?? null,
      passwordHash: rr.passwordHash,
      status: rr.status || 'PENDING',
      note: rr.note ?? null,
      reviewedBy: rr.reviewedBy ?? null,
      reviewedAt: parseDate(rr.reviewedAt) || null,
      createdAt: parseDate(rr.createdAt) || new Date(),
      updatedAt: parseDate(rr.updatedAt) || new Date(),
    }));
    await insertInChunks(items, 200, (c) => prisma.registrationRequest.createMany({ data: c, skipDuplicates: true }));
    count += items.length;
  }

  // ActivityLog
  if (Array.isArray(data.activityLogs) && data.activityLogs.length > 0) {
    const items = data.activityLogs.map((al: any) => ({
      id: al.id,
      userId: al.userId ?? null,
      username: al.username ?? null,
      userRole: al.userRole ?? null,
      action: al.action,
      targetType: al.targetType ?? null,
      targetId: al.targetId ?? null,
      description: al.description,
      metadata: al.metadata ?? null,
      ipAddress: al.ipAddress ?? null,
      userAgent: al.userAgent ?? null,
      createdAt: parseDate(al.createdAt) || new Date(),
    }));
    await insertInChunks(items, 500, (c) => prisma.activityLog.createMany({ data: c, skipDuplicates: true }));
    count += items.length;
  }

  // ExamReminderLog
  if (Array.isArray(data.examReminderLogs) && data.examReminderLogs.length > 0) {
    const items = data.examReminderLogs.map((er: any) => ({
      id: er.id,
      username: er.username,
      examRecordId: er.examRecordId,
      reminderType: er.reminderType,
      targetDate: er.targetDate,
      sentAt: parseDate(er.sentAt) || new Date(),
    }));
    await insertInChunks(items, 300, (c) => prisma.examReminderLog.createMany({ data: c, skipDuplicates: true }));
    count += items.length;
  }

  // QldtAnnouncementLog
  if (Array.isArray(data.qldtAnnouncementLogs) && data.qldtAnnouncementLogs.length > 0) {
    const items = data.qldtAnnouncementLogs.map((qa: any) => ({
      id: qa.id,
      username: qa.username,
      announcementId: qa.announcementId,
      title: qa.title ?? null,
      publishDate: qa.publishDate ?? null,
      sentAt: parseDate(qa.sentAt) || new Date(),
    }));
    await insertInChunks(items, 300, (c) => prisma.qldtAnnouncementLog.createMany({ data: c, skipDuplicates: true }));
    count += items.length;
  }

  // ClassScheduleReminderLog
  if (Array.isArray(data.classScheduleReminderLogs) && data.classScheduleReminderLogs.length > 0) {
    const items = data.classScheduleReminderLogs.map((cs: any) => ({
      id: cs.id,
      username: cs.username,
      courseCode: cs.courseCode,
      reminderType: cs.reminderType,
      targetDate: cs.targetDate,
      sessionInfo: cs.sessionInfo ?? null,
      sentAt: parseDate(cs.sentAt) || new Date(),
    }));
    await insertInChunks(items, 300, (c) => prisma.classScheduleReminderLog.createMany({ data: c, skipDuplicates: true }));
    count += items.length;
  }

  // ExamRoom
  if (Array.isArray(data.examRooms) && data.examRooms.length > 0) {
    const items = data.examRooms.map((er: any) => ({
      id: er.id,
      roomKey: er.roomKey,
      mapThi: er.mapThi,
      maMH: er.maMH ?? null,
      tenMH: er.tenMH ?? null,
      ngayThi: er.ngayThi ?? null,
      gioThi: er.gioThi ?? null,
      maHTThi: er.maHTThi ?? null,
      batchCode: er.batchCode ?? null,
      customPrice: typeof er.customPrice === 'number' ? er.customPrice : 600000,
      note: er.note ?? null,
      updatedBy: er.updatedBy ?? null,
      createdAt: parseDate(er.createdAt) || new Date(),
      updatedAt: parseDate(er.updatedAt) || new Date(),
    }));
    await insertInChunks(items, 200, (c) => prisma.examRoom.createMany({ data: c, skipDuplicates: true }));
    count += items.length;
  }

  // Đồng bộ sequence ID trên PostgreSQL sau khi nạp dữ liệu có chỉ định explicit ID
  await syncPostgresSequences().catch(() => {});

  const stats = await getDatabaseStats();

  return {
    success: true,
    message: `Phục hồi cơ sở dữ liệu từ file JSON thành công! Đã nạp ${count.toLocaleString('vi-VN')} bản ghi trên 15 bảng.`,
    recordsRestored: count,
    preRestoreBackupFile: preRestoreName,
    stats,
  };
}

/**
 * Phục hồi cơ sở dữ liệu từ file SQLite cũ (.sqlite / .db) và nạp vào PostgreSQL
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
    ("examRooms", "ExamRoom"),
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
