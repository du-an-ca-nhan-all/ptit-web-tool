import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import {
  checkAndDispatchQldtAnnouncements,
  checkAndDispatchSlinkAnnouncements,
  runClassScheduleReminders,
  dispatchNearestClassScheduleNotification,
} from '@/src/features/telegram/server/telegramDispatcher';
import {
  findQldttxAccount,
  isQldttxAccountValid,
  findSlinkAccount,
  isSlinkAccountValid,
} from './helpers';

const QLDTTX_INVALID_ERROR =
  'Chưa cấu hình tài khoản Cổng Quản Lý Đào Tạo Từ Xa (PTTC1) hoặc thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại tài khoản trước khi thực hiện.';

const SLINK_INVALID_ERROR =
  'Chưa cấu hình tài khoản Cổng Thông Tin PTIT S-Link hoặc thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại tài khoản trước khi thực hiện.';

export async function handleUserCheckAction(
  req: NextRequest,
  username: string,
  action: string,
  body: any
): Promise<NextResponse | null> {
  // 2.5 ACTION: CHECK QLDTTX ANNOUNCEMENTS NOW (Kiểm tra thông báo QLDTTX tức thì)
  if (action === 'CHECK_QLDT_ANNOUNCEMENTS') {
    const extAccount = await findQldttxAccount(username);
    if (!isQldttxAccountValid(extAccount)) {
      return NextResponse.json({ success: false, error: QLDTTX_INVALID_ERROR }, { status: 400 });
    }

    const result = await checkAndDispatchQldtAnnouncements({
      username,
      forceCheck: true,
    });
    return NextResponse.json(result);
  }

  // 2.55 ACTION: CHECK PTIT S-LINK ANNOUNCEMENTS NOW (Kiểm tra thông báo S-Link tức thì và đánh dấu đã đọc)
  if (action === 'CHECK_SLINK_ANNOUNCEMENTS') {
    const slinkAccount = await findSlinkAccount(username);
    if (!isSlinkAccountValid(slinkAccount)) {
      return NextResponse.json({ success: false, error: SLINK_INVALID_ERROR }, { status: 400 });
    }

    const result = await checkAndDispatchSlinkAnnouncements({
      username,
      forceCheck: true,
    });
    return NextResponse.json(result);
  }

  // 2.6 ACTION: CHECK CLASS SCHEDULE NOW (Kiểm tra lịch học hôm nay & gửi tin nhắn ngay)
  if (action === 'CHECK_CLASS_SCHEDULE_NOW') {
    const extAccount = await findQldttxAccount(username);
    if (!isQldttxAccountValid(extAccount)) {
      return NextResponse.json({ success: false, error: QLDTTX_INVALID_ERROR }, { status: 400 });
    }

    const result = await runClassScheduleReminders({
      username,
      forceCheck: true,
      forceMorningSummary: true,
      forcePreClassAlert: false,
    });
    return NextResponse.json(result);
  }

  // 2.7 ACTION: CHECK NEAREST CLASS SCHEDULE (Quét lịch học gần nhất trong 10 ngày tới & gửi Telegram)
  if (action === 'CHECK_NEAREST_CLASS_SCHEDULE') {
    const extAccount = await findQldttxAccount(username);
    if (!isQldttxAccountValid(extAccount)) {
      return NextResponse.json({ success: false, error: QLDTTX_INVALID_ERROR }, { status: 400 });
    }

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

  return null;
}
