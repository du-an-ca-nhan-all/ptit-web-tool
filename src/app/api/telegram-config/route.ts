import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import {
  sendTestNotification,
  verifyTelegramBot,
  pullForumTopics,
  createTelegramForumTopic,
} from '@/src/lib/telegram-service';
import { logActivity } from '@/src/lib/activityLog';

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

// GET /api/telegram-config
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để xem thông tin' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const viewAll = searchParams.get('view') === 'all' || searchParams.get('admin') === 'true';
    const targetUsername = searchParams.get('username');

    // ADMIN: View all users' Telegram configs
    if (viewAll) {
      if (!authUser.isAdmin) {
        return NextResponse.json(
          { error: 'Chỉ Quản trị viên (Admin) mới có quyền xem toàn bộ danh sách cấu hình Telegram' },
          { status: 403 }
        );
      }

      const allConfigs = await prisma.telegramConfig.findMany({
        include: {
          user: {
            include: {
              student: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      const formattedConfigs = allConfigs.map((cfg) => {
        const student = cfg.user?.student;
        return {
          id: cfg.id,
          username: cfg.username,
          fullName: student?.hoTen || cfg.username,
          maLop: student?.maLop || 'Chưa phân lớp',
          soDienThoai: student?.soDienThoai || '',
          botToken: cfg.botToken ? `${cfg.botToken.substring(0, 10)}...${cfg.botToken.slice(-5)}` : '',
          rawBotToken: cfg.botToken, // For admin testing
          chatId: cfg.chatId,
          threadId: cfg.threadId,
          isEnabled: cfg.isEnabled,
          notifyExamSchedule: cfg.notifyExamSchedule,
          notifyCourseRegistration: cfg.notifyCourseRegistration,
          notifyClassActivity: cfg.notifyClassActivity,
          lastTestedAt: cfg.lastTestedAt ? cfg.lastTestedAt.toISOString() : null,
          lastTestStatus: cfg.lastTestStatus,
          lastTestError: cfg.lastTestError,
          botUsername: cfg.botUsername,
          botFirstName: cfg.botFirstName,
          createdAt: cfg.createdAt.toISOString(),
          updatedAt: cfg.updatedAt.toISOString(),
        };
      });

      return NextResponse.json({
        success: true,
        configs: formattedConfigs,
        totalConfigs: formattedConfigs.length,
      });
    }

    // Target specific username (if admin) or own user
    let usernameToQuery = authUser.username;
    if (targetUsername && targetUsername !== authUser.username) {
      if (!authUser.isAdmin) {
        return NextResponse.json({ error: 'Không có quyền truy cập cấu hình của tài khoản khác' }, { status: 403 });
      }
      usernameToQuery = targetUsername;
    }

    const config = await prisma.telegramConfig.findUnique({
      where: { username: usernameToQuery },
      include: {
        user: {
          include: {
            student: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      config: config
        ? {
            id: config.id,
            username: config.username,
            botToken: config.botToken,
            chatId: config.chatId,
            threadId: config.threadId,
            isEnabled: config.isEnabled,
            notifyExamSchedule: config.notifyExamSchedule,
            notifyCourseRegistration: config.notifyCourseRegistration,
            notifyClassActivity: config.notifyClassActivity,
            lastTestedAt: config.lastTestedAt ? config.lastTestedAt.toISOString() : null,
            lastTestStatus: config.lastTestStatus,
            lastTestError: config.lastTestError,
            botUsername: config.botUsername,
            botFirstName: config.botFirstName,
            createdAt: config.createdAt.toISOString(),
            updatedAt: config.updatedAt.toISOString(),
          }
        : null,
    });
  } catch (err: any) {
    console.error('GET /api/telegram-config error:', err);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lấy cấu hình Telegram', details: err.message }, { status: 500 });
  }
}

// POST /api/telegram-config
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện' }, { status: 401 });
    }

    const body = await req.json();
    const { action = 'SAVE', targetUsername } = body;

    let username = authUser.username;
    if (targetUsername && targetUsername !== authUser.username) {
      if (!authUser.isAdmin) {
        return NextResponse.json({ error: 'Không có quyền thao tác cấu hình của tài khoản khác' }, { status: 403 });
      }
      username = targetUsername;
    }

    // Get student info for message templates
    const studentInfo = await prisma.student.findUnique({
      where: { maSV: username },
    });
    const userDisplayInfo = {
      username: username,
      fullName: studentInfo?.hoTen || authUser.fullName || username,
      maLop: studentInfo?.maLop || authUser.lop || 'Chưa cập nhật',
    };

    // 1. ACTION: TEST NOTIFICATION (Gửi tin nhắn thử nghiệm)
    if (action === 'TEST') {
      const botToken = body.botToken?.trim();
      const chatId = body.chatId?.trim();
      const threadId = body.threadId ? String(body.threadId).trim() : null;

      if (!botToken) {
        return NextResponse.json({ error: 'Vui lòng nhập Telegram Bot Token' }, { status: 400 });
      }
      if (!chatId) {
        return NextResponse.json({ error: 'Vui lòng nhập Chat ID người nhận' }, { status: 400 });
      }

      const testResult = await sendTestNotification(botToken, chatId, threadId, userDisplayInfo);

      // Update test result in DB if config already exists
      const existingConfig = await prisma.telegramConfig.findUnique({
        where: { username },
      });

      if (existingConfig) {
        await prisma.telegramConfig.update({
          where: { username },
          data: {
            lastTestedAt: new Date(),
            lastTestStatus: testResult.success ? 'SUCCESS' : 'FAILED',
            lastTestError: testResult.success ? null : testResult.error,
            botUsername: testResult.botInfo?.username || existingConfig.botUsername,
            botFirstName: testResult.botInfo?.firstName || existingConfig.botFirstName,
          },
        });
      }

      await logActivity({
        req,
        action: 'TEST_TELEGRAM_CONFIG',
        targetType: 'TELEGRAM_CONFIG',
        targetId: username,
        description: `Thử nghiệm gửi tin nhắn Telegram cho tài khoản ${username} (${testResult.success ? 'Thành công' : 'Thất bại'})`,
        metadata: {
          chatId,
          threadId,
          success: testResult.success,
          error: testResult.error || null,
          botUsername: testResult.botInfo?.username,
        },
      });

      if (!testResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: testResult.error || 'Gửi tin nhắn thử nghiệm thất bại',
            details: testResult,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Đã gửi tin nhắn thử nghiệm thành công tới Chat ID: ${chatId}${threadId ? ` (Topic: ${threadId})` : ''}!`,
        messageId: testResult.messageId,
        botInfo: testResult.botInfo,
      });
    }

    // 2. ACTION: SAVE CONFIGURATION (Lưu cấu hình)
    if (action === 'SAVE') {
      const botToken = body.botToken?.trim();
      const chatId = body.chatId?.trim();
      const threadId = body.threadId ? String(body.threadId).trim() : null;
      const isEnabled = body.isEnabled !== undefined ? Boolean(body.isEnabled) : true;
      const notifyExamSchedule = body.notifyExamSchedule !== undefined ? Boolean(body.notifyExamSchedule) : true;
      const notifyCourseRegistration = body.notifyCourseRegistration !== undefined ? Boolean(body.notifyCourseRegistration) : true;
      const notifyClassActivity = body.notifyClassActivity !== undefined ? Boolean(body.notifyClassActivity) : true;

      if (!botToken) {
        return NextResponse.json({ error: 'Vui lòng nhập Telegram Bot Token' }, { status: 400 });
      }
      if (!chatId) {
        return NextResponse.json({ error: 'Vui lòng nhập Chat ID nhận thông báo' }, { status: 400 });
      }

      // Verify bot token to fetch bot metadata
      let botUsername: string | null = null;
      let botFirstName: string | null = null;
      const verifyRes = await verifyTelegramBot(botToken);
      if (verifyRes.success && verifyRes.botInfo) {
        botUsername = verifyRes.botInfo.username || null;
        botFirstName = verifyRes.botInfo.firstName || null;
      }

      const savedConfig = await prisma.telegramConfig.upsert({
        where: { username },
        create: {
          username,
          botToken,
          chatId,
          threadId,
          isEnabled,
          notifyExamSchedule,
          notifyCourseRegistration,
          notifyClassActivity,
          botUsername,
          botFirstName,
        },
        update: {
          botToken,
          chatId,
          threadId,
          isEnabled,
          notifyExamSchedule,
          notifyCourseRegistration,
          notifyClassActivity,
          botUsername: botUsername ?? undefined,
          botFirstName: botFirstName ?? undefined,
        },
      });

      await logActivity({
        req,
        action: 'SAVE_TELEGRAM_CONFIG',
        targetType: 'TELEGRAM_CONFIG',
        targetId: username,
        description: `Lưu cấu hình thông báo Telegram cho tài khoản ${username}`,
        metadata: {
          chatId,
          threadId,
          isEnabled,
          botUsername,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã lưu cấu hình thông báo Telegram thành công!',
        config: savedConfig,
        botInfo: verifyRes.botInfo,
      });
    }

    // 3. ACTION: PULL FORUM TOPICS (Lấy danh sách topic từ nhóm)
    if (action === 'PULL_TOPICS') {
      const botToken = body.botToken?.trim();
      const chatId = body.chatId?.trim();

      if (!botToken) {
        return NextResponse.json({ error: 'Vui lòng nhập Telegram Bot Token để quét Topic' }, { status: 400 });
      }
      if (!chatId) {
        return NextResponse.json({ error: 'Vui lòng nhập Chat ID nhóm để quét Topic' }, { status: 400 });
      }

      const pullResult = await pullForumTopics(botToken, chatId);

      if (!pullResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: pullResult.error || 'Không thể lấy danh sách Topic từ Telegram',
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        chat: pullResult.chat,
        topics: pullResult.topics,
        isForumGroup: pullResult.isForumGroup,
        message: `Đã tìm thấy ${pullResult.topics.length} topic trong nhóm "${pullResult.chat?.title || chatId}"`,
      });
    }

    // 4. ACTION: CREATE FORUM TOPIC (Tạo topic mới trong nhóm)
    if (action === 'CREATE_TOPIC') {
      const botToken = body.botToken?.trim();
      const chatId = body.chatId?.trim();
      const topicName = body.topicName?.trim();
      const iconColor = body.iconColor;

      if (!botToken) {
        return NextResponse.json({ error: 'Vui lòng nhập Telegram Bot Token' }, { status: 400 });
      }
      if (!chatId) {
        return NextResponse.json({ error: 'Vui lòng nhập Chat ID nhóm' }, { status: 400 });
      }
      if (!topicName) {
        return NextResponse.json({ error: 'Vui lòng nhập tên Topic cần tạo' }, { status: 400 });
      }

      const createRes = await createTelegramForumTopic(botToken, chatId, topicName, iconColor);
      if (!createRes.success) {
        return NextResponse.json(
          {
            success: false,
            error: createRes.error || 'Không thể tạo Topic trên Telegram',
          },
          { status: 400 }
        );
      }

      await logActivity({
        req,
        action: 'CREATE_TELEGRAM_TOPIC',
        targetType: 'TELEGRAM_CONFIG',
        targetId: username,
        description: `Tạo topic Telegram "${topicName}" (#${createRes.topic?.threadId}) trong nhóm ${chatId}`,
      });

      return NextResponse.json({
        success: true,
        topic: createRes.topic,
        message: `Đã tạo Topic "${topicName}" (Thread ID: ${createRes.topic?.threadId}) thành công!`,
      });
    }

    // 5. ACTION: TOGGLE ENABLE/DISABLE
    if (action === 'TOGGLE') {
      const existingConfig = await prisma.telegramConfig.findUnique({
        where: { username },
      });

      if (!existingConfig) {
        return NextResponse.json({ error: 'Chưa có cấu hình Telegram để bật/tắt' }, { status: 404 });
      }

      const newStatus = body.isEnabled !== undefined ? Boolean(body.isEnabled) : !existingConfig.isEnabled;
      const updated = await prisma.telegramConfig.update({
        where: { username },
        data: { isEnabled: newStatus },
      });

      await logActivity({
        req,
        action: 'TOGGLE_TELEGRAM_CONFIG',
        targetType: 'TELEGRAM_CONFIG',
        targetId: username,
        description: `${newStatus ? 'Bật' : 'Tắt'} nhận thông báo Telegram cho ${username}`,
      });

      return NextResponse.json({
        success: true,
        message: `Đã ${newStatus ? 'bật' : 'tắt'} nhận thông báo Telegram.`,
        config: updated,
      });
    }

    // 6. ACTION: DELETE CONFIGURATION (Hủy liên kết)
    if (action === 'DELETE') {
      await prisma.telegramConfig.deleteMany({
        where: { username },
      });

      await logActivity({
        req,
        action: 'DELETE_TELEGRAM_CONFIG',
        targetType: 'TELEGRAM_CONFIG',
        targetId: username,
        description: `Xóa cấu hình thông báo Telegram cho tài khoản ${username}`,
      });

      return NextResponse.json({
        success: true,
        message: 'Đã xóa cấu hình thông báo Telegram thành công!',
      });
    }

    return NextResponse.json({ error: `Hành động ${action} không được hỗ trợ` }, { status: 400 });
  } catch (err: any) {
    console.error('POST /api/telegram-config error:', err);
    return NextResponse.json({ error: 'Lỗi máy chủ khi xử lý cấu hình Telegram', details: err.message }, { status: 500 });
  }
}
