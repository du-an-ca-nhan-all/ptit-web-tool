import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin } from '@/src/lib/auth';
import { logActivity } from '@/src/lib/activityLog';
import {
  getDatabaseStats,
  exportDatabaseAsJson,
  createLocalBackup,
  listLocalBackups,
  getSafeBackupFilePath,
  deleteLocalBackup,
  getDatabaseFilePath,
  generateTimestampString,
  getBackupTelegramConfig,
  saveBackupTelegramConfig,
  testBackupTelegramTarget,
  sendBackupToTelegram,
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
// - ?download=true&format=sqlite (Stream live dev.db as SQLite file)
// - ?download=true&format=json (Stream live full JSON dump)
// - ?download=true&file=xyz.sqlite (Download existing saved backup file)
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
        const isJson = requestedFile.endsWith('.json');
        const contentType = isJson ? 'application/json; charset=utf-8' : 'application/x-sqlite3';

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

      // 2. Download Live SQLite DB
      if (format === 'sqlite') {
        const dbPath = getDatabaseFilePath();
        if (!fs.existsSync(dbPath)) {
          return NextResponse.json({ error: 'Không tìm thấy file cơ sở dữ liệu SQLite dev.db' }, { status: 404 });
        }

        const fileBuffer = fs.readFileSync(dbPath);
        const filename = `ptit-db-live-${timestamp}.sqlite`;

        await logActivity({
          req,
          userId: authUser.id,
          username: authUser.username,
          userRole: authUser.role,
          action: 'BACKUP_SQLITE_LIVE',
          targetType: 'DATABASE',
          targetId: filename,
          description: `Tải về trực tiếp bản sao lưu SQLite live: ${filename}`,
          metadata: { size: fileBuffer.length },
        });

        return new Response(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/x-sqlite3',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': fileBuffer.length.toString(),
            'Cache-Control': 'no-store',
          },
        });
      }

      // 3. Download Live JSON Dump
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

      return NextResponse.json({ error: 'Định dạng tải về không hợp lệ (hỗ trợ sqlite hoặc json)' }, { status: 400 });
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
// - action: 'CREATE_SNAPSHOT' (or default): Create server snapshot file(s)
// - action: 'SEND_TELEGRAM': Send live backup files directly to Telegram
// - action: 'SAVE_TELEGRAM_CONFIG': Save backup telegram settings into GlobalConfig
// - action: 'TEST_TELEGRAM_TARGET': Test ping destination Telegram chat/thread
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

    const body = await req.json().catch(() => ({}));
    const action = (body.action || 'CREATE_SNAPSHOT').toUpperCase();

    // 1. SAVE TELEGRAM BACKUP CONFIGURATION
    if (action === 'SAVE_TELEGRAM_CONFIG') {
      const { chatId, threadId, botToken, isEnabled, sendSqlite, sendJson, autoBackupEnabled, scheduleTime } = body;

      const saved = await saveBackupTelegramConfig({
        chatId,
        threadId,
        botToken,
        isEnabled,
        sendSqlite,
        sendJson,
        autoBackupEnabled,
        scheduleTime,
      });

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'SAVE_BACKUP_TELEGRAM_CONFIG',
        targetType: 'GLOBAL_CONFIG',
        targetId: 'backup_telegram',
        description: `Cập nhật cấu hình gửi backup lên Telegram: Chat ID ${chatId}${threadId ? ` (Topic ${threadId})` : ''}`,
        metadata: { chatId, threadId, isEnabled, sendSqlite, sendJson },
      });

      const telegramBackup = await getBackupTelegramConfig();
      return NextResponse.json({
        success: true,
        message: 'Đã lưu cấu hình gửi sao lưu lên Telegram thành công!',
        telegramConfig: telegramBackup.config,
      });
    }

    // 2. TEST TELEGRAM TARGET CONNECTION
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
        return NextResponse.json({ success: true, message: testRes.message });
      } else {
        return NextResponse.json({ error: testRes.error }, { status: 400 });
      }
    }

    // 3. SEND BACKUP DIRECTLY TO TELEGRAM
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
        });
      } else {
        return NextResponse.json(
          { error: sendRes.error || 'Gửi file sao lưu lên Telegram thất bại', telegramConfig: telegramBackup.config },
          { status: 400 }
        );
      }
    }

    // 4. CREATE SERVER SNAPSHOT (Default)
    const format = (body.format || 'all') as 'sqlite' | 'json' | 'all';
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

    return NextResponse.json({
      success: true,
      message: `Đã tạo thành công ${createdFiles.length} bản sao lưu trên máy chủ`,
      createdFiles,
      stats,
      localBackups,
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
    });
  } catch (error: any) {
    console.error('[API /api/backup DELETE error]:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi xoá bản sao lưu' }, { status: 500 });
  }
}
