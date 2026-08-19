import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin } from '@/src/lib/auth';
import { logActivity } from '@/src/lib/activityLog';
import { saveTelegramAdminConfig } from '@/src/lib/globalConfig';
import { dispatchDatabaseExportOrBackup, dispatchDatabaseRestore } from '@/src/lib/telegram-dispatcher';
import {
  getDatabaseStats,
  exportDatabaseAsJson,
  exportDatabaseAsSqlDump,
  createLocalBackup,
  listLocalBackups,
  getSafeBackupFilePath,
  deleteLocalBackup,
  generateTimestampString,
  getBackupTelegramConfig,
  saveBackupTelegramConfig,
  testBackupTelegramTarget,
  sendBackupToTelegram,
  restoreFromLocalBackup,
  restoreFromSqlDump,
  restoreFromSqliteFile,
  restoreFromJsonDump,
} from '@/src/lib/backupService';

async function getAuthUser(req: NextRequest) {
  let authUser = await getCurrentUserFromCookie();
  if (!authUser) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      authUser = await verifyAuthToken(token);
    }
  }
  return authUser;
}

// GET /api/backup
// - ?download=true&format=sql (Stream live PostgreSQL .sql dump)
// - ?download=true&format=json (Stream live full JSON dump)
// - ?download=true&file=xyz.sql (Download existing saved backup file)
// - No download param: return stats, local backup files list, and Telegram backup configuration
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để truy cập tính năng backup' }, { status: 401 });
    }

    const isAdmin = checkIsAdmin(authUser.role);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Bạn không có quyền quản trị để sao lưu dữ liệu' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const isDownload = searchParams.get('download') === 'true';
    const format = searchParams.get('format');
    const requestedFile = searchParams.get('file');

    if (isDownload) {
      const timestamp = generateTimestampString();

      // 1. Download specific saved file
      if (requestedFile) {
        const filePath = getSafeBackupFilePath(requestedFile);
        if (!filePath || !fs.existsSync(filePath)) {
          return NextResponse.json({ error: 'File sao lưu không tồn tại hoặc đã bị xoá' }, { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);
        let contentType = 'application/octet-stream';
        if (requestedFile.endsWith('.json')) {
          contentType = 'application/json; charset=utf-8';
        } else if (requestedFile.endsWith('.sql')) {
          contentType = 'application/sql; charset=utf-8';
        } else if (requestedFile.endsWith('.sqlite') || requestedFile.endsWith('.db')) {
          contentType = 'application/x-sqlite3';
        }

        await logActivity({
          req,
          userId: authUser.id,
          username: authUser.username,
          userRole: authUser.role,
          action: 'DOWNLOAD_BACKUP',
          targetType: 'DATABASE',
          targetId: requestedFile,
          description: `Tải về file sao lưu cơ sở dữ liệu: ${requestedFile}`,
          metadata: { filename: requestedFile, size: fileBuffer.length },
        });

        return new Response(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(requestedFile)}"`,
            'Content-Length': fileBuffer.length.toString(),
            'Cache-Control': 'no-store',
          },
        });
      }

      // 2. Download Live PostgreSQL SQL Dump (.sql)
      if (format === 'sql') {
        const sqlDump = await exportDatabaseAsSqlDump();
        const buffer = Buffer.from(sqlDump, 'utf-8');
        const filename = `ptit-db-dump-${timestamp}.sql`;

        await logActivity({
          req,
          userId: authUser.id,
          username: authUser.username,
          userRole: authUser.role,
          action: 'EXPORT_SQL_DATABASE',
          targetType: 'DATABASE',
          targetId: filename,
          description: `Xuất toàn bộ cơ sở dữ liệu PostgreSQL sang file SQL Dump: ${filename}`,
          metadata: { size: buffer.length },
        });

        // Dispatch Telegram Notification to Admin
        dispatchDatabaseExportOrBackup({
          action: 'EXPORT_SQL',
          filename,
          fileSize: buffer.length,
          adminUsername: authUser.username,
          description: `Quản trị viên ${authUser.username} xuất toàn bộ cơ sở dữ liệu PostgreSQL sang file SQL Dump (.sql)`,
        }).catch(() => {});

        return new Response(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/sql; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'no-store',
          },
        });
      }

      // 3. Download Live JSON Dump (.json)
      if (format === 'json') {
        const jsonDump = await exportDatabaseAsJson();
        const jsonString = JSON.stringify(jsonDump, null, 2);
        const filename = `ptit-db-export-${timestamp}.json`;
        const buffer = Buffer.from(jsonString, 'utf-8');

        await logActivity({
          req,
          userId: authUser.id,
          username: authUser.username,
          userRole: authUser.role,
          action: 'EXPORT_JSON_DATABASE',
          targetType: 'DATABASE',
          targetId: filename,
          description: `Xuất toàn bộ cơ sở dữ liệu sang file JSON: ${filename}`,
          metadata: { stats: jsonDump.metadata.stats.tables },
        });

        // Dispatch Telegram Notification to Admin
        dispatchDatabaseExportOrBackup({
          action: 'EXPORT_JSON',
          filename,
          fileSize: buffer.length,
          adminUsername: authUser.username,
          description: `Quản trị viên ${authUser.username} xuất toàn bộ cơ sở dữ liệu sang file JSON đầy đủ (.json)`,
          tableStats: jsonDump.metadata.stats.tables,
        }).catch(() => {});

        return new Response(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'no-store',
          },
        });
      }

      return NextResponse.json({ error: 'Định dạng tải về không hợp lệ (hỗ trợ sql hoặc json)' }, { status: 400 });
    }

    // Default: Return stats, backups list, and telegram backup config
    const [stats, localBackups, telegramBackup] = await Promise.all([
      getDatabaseStats(),
      Promise.resolve(listLocalBackups()),
      getBackupTelegramConfig(),
    ]);

    return NextResponse.json({
      success: true,
      stats,
      localBackups,
      telegramConfig: telegramBackup.config,
      systemBotInfo: telegramBackup.systemBotInfo,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API /api/backup GET error]:', error);
    return NextResponse.json({ error: error.message || 'Lỗi xử lý sao lưu dữ liệu' }, { status: 500 });
  }
}

// POST /api/backup
// Handles:
// - action: 'CREATE_SNAPSHOT' (or default): Create server snapshot file(s) (.sql, .json)
// - action: 'SEND_TELEGRAM': Send live backup files directly to Telegram
// - action: 'SAVE_TELEGRAM_CONFIG': Save backup telegram settings into GlobalConfig
// - action: 'TEST_TELEGRAM_TARGET': Test ping destination Telegram chat/thread
// - action: 'RESTORE_SAVED_BACKUP': Restore from an existing backup in backups/
// - action: 'RESTORE_UPLOADED_FILE' (multipart/form-data): Upload .sql, .json, or .sqlite and restore
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện thao tác' }, { status: 401 });
    }

    const isAdmin = checkIsAdmin(authUser.role);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Bạn không có quyền quản trị để thực hiện thao tác này' }, { status: 403 });
    }

    const contentType = req.headers.get('content-type') || '';

    // 1. HANDLE MULTIPART/FORM-DATA (UPLOAD FILE & RESTORE)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const action = ((formData.get('action') as string) || 'RESTORE_UPLOADED_FILE').toUpperCase();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'Vui lòng chọn file sao lưu (.sql, .json, hoặc .sqlite) để phục hồi' }, { status: 400 });
      }

      const filename = file.name.toLowerCase();
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length === 0) {
        return NextResponse.json({ error: 'File tải lên rỗng' }, { status: 400 });
      }

      let restoreRes: any;
      if (filename.endsWith('.json')) {
        const text = buffer.toString('utf-8');
        restoreRes = await restoreFromJsonDump(text);
      } else if (filename.endsWith('.sql')) {
        const text = buffer.toString('utf-8');
        restoreRes = await restoreFromSqlDump(text);
      } else if (filename.endsWith('.sqlite') || filename.endsWith('.db')) {
        restoreRes = await restoreFromSqliteFile(buffer);
      } else {
        return NextResponse.json(
          { error: 'Định dạng file không được hỗ trợ. Vui lòng tải lên file .sql, .json, hoặc .sqlite / .db' },
          { status: 400 }
        );
      }

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'RESTORE_DATABASE',
        targetType: 'DATABASE',
        targetId: file.name,
        description: `Phục hồi cơ sở dữ liệu PostgreSQL từ file tải lên: ${file.name} (${restoreRes.stats?.totalRecords || 0} bản ghi)`,
        metadata: { filename: file.name, preRestoreBackupFile: restoreRes.preRestoreBackupFile },
      });

      // Dispatch Telegram Notification to Admin
      dispatchDatabaseRestore({
        filename: file.name,
        adminUsername: authUser.username,
        format: filename.split('.').pop()?.toUpperCase() || 'DB',
        success: true,
      }).catch(() => {});

      const localBackups = listLocalBackups();
      return NextResponse.json({
        success: true,
        message: restoreRes.message,
        preRestoreBackupFile: restoreRes.preRestoreBackupFile,
        stats: restoreRes.stats,
        localBackups,
        serverTime: new Date().toISOString(),
      });
    }

    // 2. HANDLE JSON PAYLOAD
    const body = await req.json().catch(() => ({}));
    const action = (body.action || 'CREATE_SNAPSHOT').toUpperCase();

    // 2.1. RESTORE FROM AN EXISTING SAVED BACKUP FILE ON SERVER
    if (action === 'RESTORE_SAVED_BACKUP') {
      const { filename } = body;
      if (!filename) {
        return NextResponse.json({ error: 'Vui lòng cung cấp tên file cần phục hồi' }, { status: 400 });
      }

      const restoreRes = await restoreFromLocalBackup(filename);

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'RESTORE_DATABASE',
        targetType: 'DATABASE',
        targetId: filename,
        description: `Phục hồi cơ sở dữ liệu từ bản sao lưu máy chủ: ${filename} (${restoreRes.stats?.totalRecords || 0} bản ghi)`,
        metadata: { filename, preRestoreBackupFile: restoreRes.preRestoreBackupFile },
      });

      // Dispatch Telegram Notification to Admin
      dispatchDatabaseRestore({
        filename,
        adminUsername: authUser.username,
        format: filename.split('.').pop()?.toUpperCase() || 'DB',
        success: true,
      }).catch(() => {});

      const localBackups = listLocalBackups();
      return NextResponse.json({
        success: true,
        message: restoreRes.message,
        preRestoreBackupFile: restoreRes.preRestoreBackupFile,
        stats: restoreRes.stats,
        localBackups,
        serverTime: new Date().toISOString(),
      });
    }

    // 2.2. SAVE TELEGRAM BACKUP CONFIGURATION
    if (action === 'SAVE_TELEGRAM_CONFIG') {
      const {
        chatId,
        threadId,
        botToken,
        isEnabled,
        sendSql,
        sendSqlite,
        sendJson,
        autoBackupEnabled,
        scheduleTime,
        notifyOnDbBackup,
        notifyOnNewUser,
        notifyOnDbRestore,
      } = body;

      const saved = await saveBackupTelegramConfig({
        chatId,
        threadId,
        botToken,
        isEnabled,
        sendSql: sendSql ?? sendSqlite,
        sendSqlite: sendSqlite ?? sendSql,
        sendJson,
        autoBackupEnabled,
        scheduleTime,
        notifyOnDbBackup,
        notifyOnNewUser,
        notifyOnDbRestore,
      });

      // Synchronize to telegram_admin global config as well
      await saveTelegramAdminConfig({
        chatId,
        threadId,
        botToken,
        isEnabled,
        notifyOnNewUser,
        notifyOnDbBackup,
        notifyOnDbRestore,
      }).catch((err) => console.error('[BackupAPI] Error syncing to telegram_admin:', err));

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'SAVE_BACKUP_TELEGRAM_CONFIG',
        targetType: 'GLOBAL_CONFIG',
        targetId: 'backup_telegram',
        description: `Cập nhật cấu hình gửi backup & thông báo admin lên Telegram: Chat ID ${chatId}${threadId ? ` (Topic ${threadId})` : ''}`,
        metadata: {
          chatId,
          threadId,
          isEnabled,
          sendSql: saved.sendSql,
          sendJson: saved.sendJson,
          autoBackupEnabled,
          scheduleTime,
          notifyOnDbBackup: saved.notifyOnDbBackup,
          notifyOnNewUser: saved.notifyOnNewUser,
          notifyOnDbRestore: saved.notifyOnDbRestore,
        },
      });

      const telegramBackup = await getBackupTelegramConfig();
      return NextResponse.json({
        success: true,
        message: 'Đã lưu cấu hình gửi sao lưu lên Telegram thành công!',
        telegramConfig: telegramBackup.config,
        serverTime: new Date().toISOString(),
      });
    }

    // 2.3. TEST TELEGRAM TARGET CONNECTION
    if (action === 'TEST_TELEGRAM_TARGET') {
      const { chatId, threadId, botToken } = body;
      const testRes = await testBackupTelegramTarget({ chatId, threadId, botToken });

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'TEST_BACKUP_TELEGRAM',
        targetType: 'TELEGRAM',
        targetId: chatId || 'saved_target',
        description: `Kiểm tra gửi test Telegram sao lưu: ${testRes.success ? 'Thành công' : 'Thất bại'}`,
        metadata: { success: testRes.success, error: testRes.error },
      });

      if (testRes.success) {
        return NextResponse.json({ success: true, message: testRes.message, serverTime: new Date().toISOString() });
      } else {
        return NextResponse.json({ error: testRes.error, serverTime: new Date().toISOString() }, { status: 400 });
      }
    }

    // 2.4. SEND BACKUP DIRECTLY TO TELEGRAM
    if (action === 'SEND_TELEGRAM') {
      const { format, customChatId, customThreadId, customBotToken } = body;

      const sendRes = await sendBackupToTelegram({
        format,
        customChatId,
        customThreadId,
        customBotToken,
      });

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'SEND_BACKUP_TELEGRAM',
        targetType: 'DATABASE',
        targetId: sendRes.filesSent.join(', '),
        description: `Gửi bản sao lưu lên Telegram: ${sendRes.filesSent.join(', ')} (${sendRes.success ? 'Thành công' : 'Thất bại'})`,
        metadata: { filesSent: sendRes.filesSent, success: sendRes.success, error: sendRes.error },
      });

      const telegramBackup = await getBackupTelegramConfig();
      if (sendRes.success) {
        return NextResponse.json({
          success: true,
          message: sendRes.message,
          filesSent: sendRes.filesSent,
          telegramConfig: telegramBackup.config,
          serverTime: new Date().toISOString(),
        });
      } else {
        return NextResponse.json(
          { error: sendRes.error || 'Gửi file sao lưu lên Telegram thất bại', telegramConfig: telegramBackup.config, serverTime: new Date().toISOString() },
          { status: 400 }
        );
      }
    }

    // 2.5. CREATE SERVER SNAPSHOT (Default)
    const format = (body.format || 'all') as 'sql' | 'json' | 'all';
    const createdFiles = await createLocalBackup(format);

    await logActivity({
      req,
      userId: authUser.id,
      username: authUser.username,
      userRole: authUser.role,
      action: 'CREATE_SERVER_BACKUP',
      targetType: 'DATABASE',
      targetId: createdFiles.map((f) => f.name).join(', '),
      description: `Tạo bản sao lưu trên máy chủ (${format}): ${createdFiles.map((f) => f.name).join(', ')}`,
      metadata: { format, createdFiles },
    });

    const stats = await getDatabaseStats();
    const localBackups = listLocalBackups();

    // Dispatch Telegram Notification to Admin
    dispatchDatabaseExportOrBackup({
      action: 'MANUAL_SNAPSHOT',
      filename: createdFiles.map((f) => f.name).join(', '),
      fileSize: createdFiles.reduce((acc, f) => acc + (f.size || 0), 0),
      adminUsername: authUser.username,
      description: `Quản trị viên ${authUser.username} tạo ${createdFiles.length} bản snapshot sao lưu máy chủ (${format.toUpperCase()})`,
      tableStats: stats.tables,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Đã tạo thành công ${createdFiles.length} bản sao lưu trên máy chủ`,
      createdFiles,
      stats,
      localBackups,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API /api/backup POST error]:', error);
    return NextResponse.json({ error: error.message || 'Lỗi xử lý yêu cầu sao lưu' }, { status: 500 });
  }
}

// DELETE /api/backup
// Delete a specific backup file from backups/ folder
export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để xoá bản sao lưu' }, { status: 401 });
    }

    const isAdmin = checkIsAdmin(authUser.role);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Bạn không có quyền quản trị để xoá bản sao lưu' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const filename = body.filename || new URL(req.url).searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Vui lòng cung cấp tên file cần xoá' }, { status: 400 });
    }

    const deleted = deleteLocalBackup(filename);
    if (!deleted) {
      return NextResponse.json({ error: 'Không tìm thấy file hoặc không thể xoá file sao lưu' }, { status: 404 });
    }

    await logActivity({
      req,
      userId: authUser.id,
      username: authUser.username,
      userRole: authUser.role,
      action: 'DELETE_SERVER_BACKUP',
      targetType: 'DATABASE',
      targetId: filename,
      description: `Xoá file sao lưu trên máy chủ: ${filename}`,
      metadata: { filename },
    });

    const localBackups = listLocalBackups();
    return NextResponse.json({
      success: true,
      message: `Đã xoá file sao lưu ${filename} thành công`,
      localBackups,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API /api/backup DELETE error]:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi xoá bản sao lưu' }, { status: 500 });
  }
}
