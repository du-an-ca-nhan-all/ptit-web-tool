import { NextRequest, NextResponse } from 'next/server';
import {
  pullForumTopics,
  createTelegramForumTopic,
  resolveTelegramChatInfo,
  detectRecentTelegramChats,
} from '@/src/features/telegram/server/telegramServerService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { resolveEffectiveTokenOrResponse } from './helpers';

export async function handleUserChatAction(
  req: NextRequest,
  username: string,
  action: string,
  body: any
): Promise<NextResponse | null> {
  // 3. ACTION: PULL FORUM TOPICS (Lấy danh sách topic từ nhóm)
  if (action === 'PULL_TOPICS') {
    const customToken = body.botToken?.trim() || null;
    const chatId = body.chatId?.trim();

    if (!chatId) {
      return NextResponse.json({ error: 'Vui lòng nhập Chat ID nhóm để quét Topic' }, { status: 400 });
    }

    const tokenRes = await resolveEffectiveTokenOrResponse(customToken);
    if (tokenRes.errorResponse) return tokenRes.errorResponse;

    const pullResult = await pullForumTopics(tokenRes.token, chatId);

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

    const tokenRes = await resolveEffectiveTokenOrResponse(customToken);
    if (tokenRes.errorResponse) return tokenRes.errorResponse;

    const createRes = await createTelegramForumTopic(tokenRes.token, chatId, topicName, iconColor);
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

  // ACTION: RESOLVE CHAT INFO (Lấy thông tin chi tiết và kiểm tra ID / Username)
  if (action === 'RESOLVE_CHAT') {
    const customToken = body.botToken?.trim() || null;
    const identifier = body.identifier?.trim() || body.chatId?.trim();

    if (!identifier) {
      return NextResponse.json(
        { error: 'Vui lòng nhập Chat ID hoặc Username/Link cần kiểm tra' },
        { status: 400 }
      );
    }

    const tokenRes = await resolveEffectiveTokenOrResponse(customToken);
    if (tokenRes.errorResponse) return tokenRes.errorResponse;

    const resolveRes = await resolveTelegramChatInfo(tokenRes.token, identifier);
    if (!resolveRes.success) {
      return NextResponse.json({ success: false, error: resolveRes.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      chat: resolveRes.chat,
      message: `Đã tìm thấy: ${resolveRes.chat?.title || identifier} (${resolveRes.chat?.type})`,
    });
  }

  // ACTION: DETECT RECENT CHATS / UPDATES (Trợ lý tự động quét các cuộc trò chuyện & topic mới nhất)
  if (action === 'DETECT_RECENT_CHATS') {
    const customToken = body.botToken?.trim() || null;

    const tokenRes = await resolveEffectiveTokenOrResponse(customToken);
    if (tokenRes.errorResponse) return tokenRes.errorResponse;

    const detectRes = await detectRecentTelegramChats(tokenRes.token);
    if (!detectRes.success) {
      return NextResponse.json({ success: false, error: detectRes.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      chats: detectRes.chats,
      total: detectRes.chats.length,
      message: `Đã phát hiện ${detectRes.chats.length} cuộc trò chuyện/kênh gần đây từ Telegram Bot.`,
    });
  }

  return null;
}
