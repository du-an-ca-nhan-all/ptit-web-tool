import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import {
  sendTelegramMessage,
  sendTestNotification,
  verifyTelegramBot,
  pullForumTopics,
  createTelegramForumTopic,
  getSystemTelegramBotPublicInfo,
  getSystemTelegramBotConfig,
  saveSystemTelegramBot,
  toggleSystemTelegramBot,
  resolveEffectiveBotToken,
} from '@/src/lib/telegram-service';
import { logActivity } from '@/src/lib/activityLog';
import {
  checkAndDispatchQldtAnnouncements,
  runClassScheduleReminders,
  findNearestStudentClassSchedule,
  dispatchNearestClassScheduleNotification,
} from '@/src/lib/telegram-dispatcher';

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

// GET /api/telegram-config?view=all OR /api/telegram-config?targetUsername=K25...
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view');
    const targetUsername = searchParams.get('targetUsername')?.trim();

    const systemBotPublic = await getSystemTelegramBotPublicInfo();

    // If Admin requests full list of subscribers
    if (view === 'all') {
      if (!authUser.isAdmin) {
        return NextResponse.json({ error: 'Chỉ Quản trị viên mới có quyền xem danh sách tất cả tài khoản' }, { status: 403 });
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

      const systemBotFull = await getSystemTelegramBotConfig();

      const formattedConfigs = allConfigs.map((cfg) => {
        const student = cfg.user?.student;
        return {
          id: cfg.id,
          username: cfg.username,
          fullName: student?.hoTen || cfg.username,
          maLop: student?.maLop || 'Chưa phân lớp',
          soDienThoai: student?.soDienThoai || '',
          isCustomBot: !!cfg.botToken,
          botToken: cfg.botToken ? `${cfg.botToken.substring(0, 10)}...${cfg.botToken.slice(-5)}` : '',
          rawBotToken: cfg.botToken,
          chatId: cfg.chatId,
          threadId: cfg.threadId,
          isEnabled: cfg.isEnabled,
          notifyExamSchedule: cfg.notifyExamSchedule,
          notifyCourseRegistration: cfg.notifyCourseRegistration,
          notifyClassActivity: cfg.notifyClassActivity,
          notifyQldtAnnouncements: cfg.notifyQldtAnnouncements,
          qldtCheckInterval: cfg.qldtCheckInterval,
          lastQldtCheckedAt: cfg.lastQldtCheckedAt ? cfg.lastQldtCheckedAt.toISOString() : null,
          notifyClassSchedule: cfg.notifyClassSchedule,
          classReminderBefore: cfg.classReminderBefore,
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
        systemBot: systemBotPublic,
        systemBotConfig: systemBotFull,
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

    const systemBotFull = authUser.isAdmin ? await getSystemTelegramBotConfig() : null;

    return NextResponse.json({
      success: true,
      systemBot: systemBotPublic,
      systemBotConfig: systemBotFull,
      config: config
        ? {
            id: config.id,
            username: config.username,
            isCustomBot: !!config.botToken,
            botToken: config.botToken || null,
            chatId: config.chatId,
            threadId: config.threadId,
            isEnabled: config.isEnabled,
            notifyExamSchedule: config.notifyExamSchedule,
            notifyCourseRegistration: config.notifyCourseRegistration,
            notifyClassActivity: config.notifyClassActivity,
            notifyQldtAnnouncements: config.notifyQldtAnnouncements,
            qldtCheckInterval: config.qldtCheckInterval,
            lastQldtCheckedAt: config.lastQldtCheckedAt ? config.lastQldtCheckedAt.toISOString() : null,
            notifyClassSchedule: config.notifyClassSchedule,
            classReminderBefore: config.classReminderBefore,
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
    const { action, targetUsername } = body;

    // Target username check: Normal users can only configure their own account, admin can configure anyone
    let username = authUser.username;
    if (targetUsername && targetUsername !== authUser.username) {
      if (!authUser.isAdmin) {
        return NextResponse.json({ error: 'Bạn không có quyền thao tác cấu hình của tài khoản khác' }, { status: 403 });
      }
      username = targetUsername;
    }

    // ─────────────────────────────────────────────────────────────
    // GLOBAL SYSTEM BOT ACTIONS (ADMIN ONLY)
    // ─────────────────────────────────────────────────────────────
    if (action === 'GET_SYSTEM_BOT') {
      const systemBotInfo = await getSystemTelegramBotPublicInfo();
      const systemBotConfig = authUser.isAdmin ? await getSystemTelegramBotConfig() : null;
      return NextResponse.json({
        success: true,
        systemBot: systemBotInfo,
        systemBotConfig,
      });
    }

    if (action === 'SAVE_SYSTEM_BOT') {
      if (!authUser.isAdmin) {
        return NextResponse.json({ error: 'Chỉ Quản trị viên mới có quyền cấu hình Bot hệ thống toàn cục' }, { status: 403 });
      }

      const botToken = body.botToken?.trim();
      const description = body.description?.trim();

      if (!botToken) {
        return NextResponse.json({ error: 'Vui lòng nhập Telegram Bot Token' }, { status: 400 });
      }

      try {
        const saveRes = await saveSystemTelegramBot(botToken, description);

        await logActivity({
          req,
          action: 'SAVE_SYSTEM_TELEGRAM_BOT',
          targetType: 'TELEGRAM_GLOBAL_CONFIG',
          targetId: 'SYSTEM_BOT',
          description: `Admin ${authUser.username} cập nhật cấu hình Bot Telegram toàn cục (@${saveRes.config?.botUsername})`,
          metadata: {
            botUsername: saveRes.config?.botUsername,
            botFirstName: saveRes.config?.botFirstName,
          },
        });

        return NextResponse.json({
          success: true,
          message: `Đã cấu hình thành công Bot hệ thống: @${saveRes.config?.botUsername} (${saveRes.config?.botFirstName})`,
          config: saveRes.config,
          systemBot: await getSystemTelegramBotPublicInfo(),
        });
      } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Lỗi khi lưu cấu hình Bot hệ thống' }, { status: 400 });
      }
    }

    if (action === 'TOGGLE_SYSTEM_BOT') {
      if (!authUser.isAdmin) {
        return NextResponse.json({ error: 'Chỉ Quản trị viên mới có quyền bật/tắt Bot hệ thống' }, { status: 403 });
      }

      const isActive = Boolean(body.isActive);
      try {
        const updatedConfig = await toggleSystemTelegramBot(isActive);

        await logActivity({
          req,
          action: 'TOGGLE_SYSTEM_TELEGRAM_BOT',
          targetType: 'TELEGRAM_GLOBAL_CONFIG',
          targetId: 'SYSTEM_BOT',
          description: `Admin ${authUser.username} ${isActive ? 'bật' : 'tắt'} Bot Telegram toàn cục`,
        });

        return NextResponse.json({
          success: true,
          message: `Đã ${isActive ? 'kích hoạt' : 'tạm dừng'} Bot hệ thống thành công!`,
          config: updatedConfig,
          systemBot: await getSystemTelegramBotPublicInfo(),
        });
      } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Lỗi khi cập nhật trạng thái Bot hệ thống' }, { status: 400 });
      }
    }

    if (action === 'BROADCAST') {
      if (!authUser.isAdmin) {
        return NextResponse.json({ error: 'Chỉ Quản trị viên mới có quyền phát thông báo toàn trường' }, { status: 403 });
      }

      const title = body.title?.trim();
      const content = body.content?.trim();
      if (!title || !content) {
        return NextResponse.json({ error: 'Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo' }, { status: 400 });
      }

      const sysConfig = await getSystemTelegramBotConfig();
      if (!sysConfig || !sysConfig.botToken || !sysConfig.isActive) {
        return NextResponse.json({ error: 'Bot Hệ Thống chưa được cấu hình hoặc đang tạm dừng' }, { status: 400 });
      }

      const subscribers = await prisma.telegramConfig.findMany({
        where: { isEnabled: true },
        include: {
          user: {
            include: {
              student: true,
            },
          },
        },
      });

      if (subscribers.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'Chưa có sinh viên nào kích hoạt nhận thông báo Telegram.',
          totalSent: 0,
          totalFailed: 0,
        });
      }

      const formattedBroadcast = `📢 <b>THÔNG BÁO TỪ QUẢN TRỊ VIÊN - PTIT EDUSYNC</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📌 <b>${title}</b>\n\n${content}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Gửi lúc: ${new Date().toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}</i>`;

      let sentCount = 0;
      let failCount = 0;

      for (const sub of subscribers) {
        let tokenToUse = sub.botToken?.trim();
        if (!tokenToUse) {
          try {
            const resolved = await resolveEffectiveBotToken(null);
            tokenToUse = resolved.token;
          } catch {
            tokenToUse = sysConfig.botToken;
          }
        }

        const sendRes = await sendTelegramMessage(tokenToUse, sub.chatId, formattedBroadcast, {
          threadId: sub.threadId ? Number(sub.threadId) : undefined,
        });

        if (sendRes.success) {
          sentCount++;
        } else {
          failCount++;
        }
      }

      await logActivity({
        req,
        action: 'BROADCAST_TELEGRAM',
        targetType: 'TELEGRAM_GLOBAL_CONFIG',
        targetId: 'BROADCAST',
        description: `Admin gửi broadcast Telegram "${title}" tới ${sentCount} tài khoản (Thất bại: ${failCount})`,
        metadata: { title, sentCount, failCount },
      });

      return NextResponse.json({
        success: true,
        message: `Đã gửi phát sóng thông báo tới ${sentCount} tài khoản (Thất bại: ${failCount}).`,
        totalSent: sentCount,
        totalFailed: failCount,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // INDIVIDUAL USER TELEGRAM ACTIONS
    // ─────────────────────────────────────────────────────────────

    // 1. ACTION: SEND TEST NOTIFICATION
    if (action === 'TEST') {
      const customToken = body.botToken?.trim() || null;
      const chatId = body.chatId?.trim();
      const threadId = body.threadId ? String(body.threadId).trim() : null;

      if (!chatId) {
        return NextResponse.json({ error: 'Vui lòng nhập Chat ID nhận thông báo' }, { status: 400 });
      }

      let effectiveToken: string;
      try {
        const resolved = await resolveEffectiveBotToken(customToken);
        effectiveToken = resolved.token;
      } catch (tokenErr: any) {
        return NextResponse.json({ error: tokenErr.message }, { status: 400 });
      }

      const student = await prisma.student.findUnique({
        where: { maSV: username },
      });

      const testResult = await sendTestNotification(effectiveToken, chatId, threadId, {
        username,
        fullName: student?.hoTen || username,
        maLop: student?.maLop,
      });

      // Update test status in user's TelegramConfig
      await prisma.telegramConfig.upsert({
        where: { username },
        create: {
          username,
          botToken: customToken,
          chatId,
          threadId,
          lastTestedAt: new Date(),
          lastTestStatus: testResult.success ? 'SUCCESS' : 'FAILED',
          lastTestError: testResult.error || null,
          botUsername: testResult.botInfo?.username || null,
          botFirstName: testResult.botInfo?.firstName || null,
        },
        update: {
          lastTestedAt: new Date(),
          lastTestStatus: testResult.success ? 'SUCCESS' : 'FAILED',
          lastTestError: testResult.error || null,
          botUsername: testResult.botInfo?.username ?? undefined,
          botFirstName: testResult.botInfo?.firstName ?? undefined,
        },
      });

      if (!testResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: testResult.error || 'Gửi tin nhắn thử nghiệm thất bại. Vui lòng kiểm tra lại Chat ID hoặc quyền của Bot.',
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

    // 2. ACTION: SAVE CONFIGURATION (Lưu cấu hình cho từng account)
    if (action === 'SAVE') {
      const customToken = body.botToken?.trim() || null;
      const chatId = body.chatId?.trim();
      const threadId = body.threadId ? String(body.threadId).trim() : null;
      const isEnabled = body.isEnabled !== undefined ? Boolean(body.isEnabled) : true;
      const notifyExamSchedule = body.notifyExamSchedule !== undefined ? Boolean(body.notifyExamSchedule) : true;
      const notifyCourseRegistration = body.notifyCourseRegistration !== undefined ? Boolean(body.notifyCourseRegistration) : true;
      const notifyClassActivity = body.notifyClassActivity !== undefined ? Boolean(body.notifyClassActivity) : true;
      const notifyQldtAnnouncements = body.notifyQldtAnnouncements !== undefined ? Boolean(body.notifyQldtAnnouncements) : true;
      const qldtCheckInterval = [1, 2, 5].includes(Number(body.qldtCheckInterval)) ? Number(body.qldtCheckInterval) : 2;
      const notifyClassSchedule = body.notifyClassSchedule !== undefined ? Boolean(body.notifyClassSchedule) : true;
      const classReminderBefore = [0, 30, 60].includes(Number(body.classReminderBefore)) ? Number(body.classReminderBefore) : 30;

      if (!chatId) {
        return NextResponse.json({ error: 'Vui lòng nhập Chat ID nhận thông báo' }, { status: 400 });
      }

      let botUsername: string | null = null;
      let botFirstName: string | null = null;

      if (customToken) {
        const verifyRes = await verifyTelegramBot(customToken);
        if (!verifyRes.success || !verifyRes.botInfo) {
          return NextResponse.json({ error: verifyRes.error || 'Token Bot riêng không hợp lệ' }, { status: 400 });
        }
        botUsername = verifyRes.botInfo.username || null;
        botFirstName = verifyRes.botInfo.firstName || null;
      } else {
        // Global System Bot
        const sysPublic = await getSystemTelegramBotPublicInfo();
        if (!sysPublic.isConfigured) {
          return NextResponse.json(
            { error: 'Bot Hệ Thống chưa được Admin thiết lập trong bảng TelegramGlobalConfig. Vui lòng liên hệ Admin hoặc nhập Bot Token riêng.' },
            { status: 400 }
          );
        }
        botUsername = sysPublic.botUsername || null;
        botFirstName = sysPublic.botFirstName || 'PTIT EduSync Official Bot';
      }

      const savedConfig = await prisma.telegramConfig.upsert({
        where: { username },
        create: {
          username,
          botToken: customToken,
          chatId,
          threadId,
          isEnabled,
          notifyExamSchedule,
          notifyCourseRegistration,
          notifyClassActivity,
          notifyQldtAnnouncements,
          qldtCheckInterval,
          notifyClassSchedule,
          classReminderBefore,
          botUsername,
          botFirstName,
        },
        update: {
          botToken: customToken,
          chatId,
          threadId,
          isEnabled,
          notifyExamSchedule,
          notifyCourseRegistration,
          notifyClassActivity,
          notifyQldtAnnouncements,
          qldtCheckInterval,
          notifyClassSchedule,
          classReminderBefore,
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
          isCustomBot: !!customToken,
          botUsername,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã lưu cấu hình thông báo Telegram thành công!',
        config: savedConfig,
      });
    }

    // 2.5 ACTION: CHECK QLDTTX ANNOUNCEMENTS NOW (Kiểm tra thông báo QLDTTX tức thì)
    if (action === 'CHECK_QLDT_ANNOUNCEMENTS') {
      const result = await checkAndDispatchQldtAnnouncements({
        username,
        forceCheck: true,
      });
      return NextResponse.json(result);
    }

    // 2.6 ACTION: CHECK CLASS SCHEDULE NOW (Kiểm tra lịch học hôm nay & gửi tin nhắn ngay)
    if (action === 'CHECK_CLASS_SCHEDULE_NOW') {
      const result = await runClassScheduleReminders({
        username,
        forceCheck: true,
        forceMorningSummary: true,
        forcePreClassAlert: true,
      });
      return NextResponse.json(result);
    }

    // 2.7 ACTION: CHECK NEAREST CLASS SCHEDULE (Quét lịch học gần nhất trong 10 ngày tới & gửi Telegram)
    if (action === 'CHECK_NEAREST_CLASS_SCHEDULE') {
      const maxDays = Number(body.maxDays) || 10;
      const result = await dispatchNearestClassScheduleNotification({
        username,
        maxDays,
        forceSend: true,
      });

      await logActivity({
        req,
        action: 'CHECK_NEAREST_CLASS_SCHEDULE',
        targetType: 'TELEGRAM_CONFIG',
        targetId: username,
        description: `Quét lịch học gần nhất trong ${maxDays} ngày tới cho tài khoản ${username}`,
        metadata: result,
      });

      return NextResponse.json(result);
    }

    // 3. ACTION: PULL FORUM TOPICS (Lấy danh sách topic từ nhóm)
    if (action === 'PULL_TOPICS') {
      const customToken = body.botToken?.trim() || null;
      const chatId = body.chatId?.trim();

      if (!chatId) {
        return NextResponse.json({ error: 'Vui lòng nhập Chat ID nhóm để quét Topic' }, { status: 400 });
      }

      let effectiveToken: string;
      try {
        const resolved = await resolveEffectiveBotToken(customToken);
        effectiveToken = resolved.token;
      } catch (tokenErr: any) {
        return NextResponse.json({ error: tokenErr.message }, { status: 400 });
      }

      const pullResult = await pullForumTopics(effectiveToken, chatId);

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
      const customToken = body.botToken?.trim() || null;
      const chatId = body.chatId?.trim();
      const topicName = body.topicName?.trim();
      const iconColor = body.iconColor;

      if (!chatId) {
        return NextResponse.json({ error: 'Vui lòng nhập Chat ID nhóm' }, { status: 400 });
      }
      if (!topicName) {
        return NextResponse.json({ error: 'Vui lòng nhập tên Topic cần tạo' }, { status: 400 });
      }

      let effectiveToken: string;
      try {
        const resolved = await resolveEffectiveBotToken(customToken);
        effectiveToken = resolved.token;
      } catch (tokenErr: any) {
        return NextResponse.json({ error: tokenErr.message }, { status: 400 });
      }

      const createRes = await createTelegramForumTopic(effectiveToken, chatId, topicName, iconColor);
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
