import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from './route/auth';
import {
  handleDownloadSavedFile,
  handleDownloadSqlDump,
  handleGetBackupOverview,
} from './route/downloadHandlers';
import {
  handleRestoreUploadedFile,
  handleRestoreSavedBackup,
} from './route/restoreHandlers';
import {
  handleSaveTelegramConfig,
  handleTestTelegramTarget,
  handleSendTelegramBackup,
} from './route/telegramHandlers';
import {
  handleCreateSnapshot,
  handleDeleteBackup,
} from './route/snapshotHandlers';

// GET /api/backup
// - ?download=true&format=sql (Stream live PostgreSQL .sql dump)
// - ?download=true&format=json (Stream live full JSON dump)
// - ?download=true&file=xyz.sql (Download existing saved backup file)
// - No download param: return stats, local backup files list, and Telegram backup configuration
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminUser(req, {
      unauthenticated: 'Vui lòng đăng nhập để truy cập tính năng backup',
      forbidden: 'Bạn không có quyền quản trị để sao lưu dữ liệu',
    });
    if ('response' in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const isDownload = searchParams.get('download') === 'true';
    const format = searchParams.get('format');
    const requestedFile = searchParams.get('file');

    if (isDownload) {
      if (requestedFile) {
        return await handleDownloadSavedFile(req, auth.user, requestedFile);
      }
      if (format === 'sql' || format === 'all' || !format) {
        return await handleDownloadSqlDump(req, auth.user);
      }
      return NextResponse.json({ error: 'Định dạng tải về không hợp lệ (hỗ trợ sql)' }, { status: 400 });
    }

    return await handleGetBackupOverview();
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
    const auth = await requireAdminUser(req, {
      unauthenticated: 'Vui lòng đăng nhập để thực hiện thao tác',
      forbidden: 'Bạn không có quyền quản trị để thực hiện thao tác này',
    });
    if ('response' in auth) return auth.response;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      return await handleRestoreUploadedFile(req, auth.user);
    }

    const body = await req.json().catch(() => ({}));
    const action = (body.action || 'CREATE_SNAPSHOT').toUpperCase();

    if (action === 'RESTORE_SAVED_BACKUP') {
      return await handleRestoreSavedBackup(req, auth.user, body);
    }
    if (action === 'SAVE_TELEGRAM_CONFIG') {
      return await handleSaveTelegramConfig(req, auth.user, body);
    }
    if (action === 'TEST_TELEGRAM_TARGET') {
      return await handleTestTelegramTarget(req, auth.user, body);
    }
    if (action === 'SEND_TELEGRAM') {
      return await handleSendTelegramBackup(req, auth.user, body);
    }

    return await handleCreateSnapshot(req, auth.user);
  } catch (error: any) {
    console.error('[API /api/backup POST error]:', error);
    return NextResponse.json({ error: error.message || 'Lỗi xử lý yêu cầu sao lưu' }, { status: 500 });
  }
}

// DELETE /api/backup
// Delete a specific backup file from backups/ folder
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdminUser(req, {
      unauthenticated: 'Vui lòng đăng nhập để xoá bản sao lưu',
      forbidden: 'Bạn không có quyền quản trị để xoá bản sao lưu',
    });
    if ('response' in auth) return auth.response;

    return await handleDeleteBackup(req, auth.user);
  } catch (error: any) {
    console.error('[API /api/backup DELETE error]:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi xoá bản sao lưu' }, { status: 500 });
  }
}
