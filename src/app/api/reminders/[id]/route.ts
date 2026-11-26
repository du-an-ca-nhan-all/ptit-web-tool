import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserFromCookie } from '@/src/lib/auth';
import { parseJsonBody } from '@/src/lib/requestValidation';
import {
  updateReminder,
  deleteReminder,
  toggleReminderComplete,
  dismissReminderForUser,
  runPendingReminderAlerts,
} from '@/src/features/reminders';

export const dynamic = 'force-dynamic';

const optionalString = z.string().nullish().transform((v) => v ?? undefined);

const updateReminderBodySchema = z
  .object({
    title: optionalString,
    description: optionalString,
    location: optionalString,
    type: z.enum(['PERSONAL', 'COURSE', 'CLASS']).nullish().transform((v) => v ?? undefined),
    idToHoc: optionalString,
    idMon: optionalString,
    maMon: optionalString,
    tenMon: optionalString,
    nhomTo: optionalString,
    lop: optionalString,
    tkbRaw: optionalString,
    giangVien: optionalString,
    eventTime: optionalString,
    offsetMinutesList: z.array(z.number()).nullish().transform((v) => v ?? undefined),
  })
  .passthrough();

const patchReminderBodySchema = z
  .object({
    action: z.string().nullish(),
  })
  .passthrough();

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { id: rawId } = await params;
    const reminderId = parseInt(rawId, 10);
    if (isNaN(reminderId)) {
      return NextResponse.json({ success: false, error: 'ID không hợp lệ' }, { status: 400 });
    }

    const parsed = await parseJsonBody(req, updateReminderBodySchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const updated = await updateReminder({
      id: reminderId,
      username: user.username,
      input: body,
      isAdmin: user.isAdmin,
    });

    runPendingReminderAlerts().catch((err) => console.warn("[route] Non-fatal async error:", err));

    return NextResponse.json({
      success: true,
      message: 'Cập nhật lịch nhắc hẹn thành công',
      reminder: updated,
    });
  } catch (err: any) {
    console.error('[API /api/reminders/[id] PUT] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Lỗi khi cập nhật nhắc hẹn' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { id: rawId } = await params;
    const reminderId = parseInt(rawId, 10);
    if (isNaN(reminderId)) {
      return NextResponse.json({ success: false, error: 'ID không hợp lệ' }, { status: 400 });
    }

    await deleteReminder(reminderId, user.username, user.isAdmin);

    return NextResponse.json({
      success: true,
      message: 'Đã xóa lịch nhắc hẹn thành công',
    });
  } catch (err: any) {
    console.error('[API /api/reminders/[id] DELETE] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Lỗi khi xóa nhắc hẹn' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { id: rawId } = await params;
    const reminderId = parseInt(rawId, 10);
    if (isNaN(reminderId)) {
      return NextResponse.json({ success: false, error: 'ID không hợp lệ' }, { status: 400 });
    }

    const parsed = await parseJsonBody(req, patchReminderBodySchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const action = body.action || 'TOGGLE_COMPLETE';

    if (action === 'DISMISS') {
      await dismissReminderForUser(reminderId, user.username);
      return NextResponse.json({
        success: true,
        message: 'Đã ẩn nhắc hẹn khỏi lịch cá nhân',
      });
    }

    const updated = await toggleReminderComplete(reminderId, user.username);
    return NextResponse.json({
      success: true,
      message: updated.isCompleted ? 'Đã đánh dấu hoàn thành' : 'Đã mở lại nhắc hẹn',
      reminder: updated,
    });
  } catch (err: any) {
    console.error('[API /api/reminders/[id] PATCH] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Lỗi khi thao tác nhắc hẹn' },
      { status: 500 }
    );
  }
}
