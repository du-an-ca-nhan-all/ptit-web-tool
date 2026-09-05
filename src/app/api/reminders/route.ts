import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookie } from '@/src/lib/auth';
import {
  createReminder,
  getRemindersForUser,
  runPendingReminderAlerts,
  sendReminderCreatedNotification,
} from '@/src/features/reminders';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'ALL';
    const status = searchParams.get('status') || 'ALL';
    const upcomingOnly = searchParams.get('upcomingOnly') === 'true';

    const reminders = await getRemindersForUser(user.username, {
      type,
      status,
      upcomingOnly,
    });

    return NextResponse.json({
      success: true,
      reminders,
      total: reminders.length,
    });
  } catch (err: any) {
    console.error('[API /api/reminders GET] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Lỗi khi tải danh sách nhắc hẹn' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const body = await req.json();
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập tiêu đề nhắc hẹn' },
        { status: 400 }
      );
    }
    if (!body.eventTime) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng chọn thời gian diễn ra nhắc hẹn' },
        { status: 400 }
      );
    }

    const reminder = await createReminder(user.username, {
      title: body.title,
      description: body.description,
      location: body.location,
      type: body.type || 'PERSONAL',
      idToHoc: body.idToHoc,
      idMon: body.idMon,
      maMon: body.maMon,
      tenMon: body.tenMon,
      nhomTo: body.nhomTo,
      lop: body.lop,
      tkbRaw: body.tkbRaw,
      giangVien: body.giangVien,
      eventTime: body.eventTime,
      offsetMinutesList: Array.isArray(body.offsetMinutesList) ? body.offsetMinutesList : [1440, 60],
    });

    // 1. Gửi thông báo tức thì về Telegram:
    // - Cá nhân: gửi riêng cho người tạo (nếu bật Telegram)
    // - Môn học: gửi cho toàn bộ bạn cùng lớp/tổ đã liên kết Telegram
    sendReminderCreatedNotification(reminder.id).catch((notifErr) => {
      console.warn('[API /api/reminders POST] sendReminderCreatedNotification error:', notifErr);
    });

    // 2. Kích hoạt quét phát thông báo nếu có mốc trùng giờ hiện tại
    runPendingReminderAlerts().catch((alertErr) => {
      console.warn('[API /api/reminders POST] Background alert trigger error:', alertErr);
    });

    return NextResponse.json({
      success: true,
      message: 'Tạo lịch nhắc hẹn thành công',
      reminder,
    });
  } catch (err: any) {
    console.error('[API /api/reminders POST] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Lỗi khi tạo lịch nhắc hẹn' },
      { status: 500 }
    );
  }
}
