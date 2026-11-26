import { prisma } from '@/src/lib/prisma';
import {
  ReminderItemDto,
  formatOffsetMinutes,
} from '../../types/reminder.types';

/**
 * Chuyển đổi bản ghi DB sang ReminderItemDto hoàn chỉnh
 */
export async function mapReminderToDto(
  reminder: any,
  currentUsername?: string
): Promise<ReminderItemDto> {
  const alerts = (reminder.alerts || []).map((a: any) => ({
    id: a.id,
    offsetMinutes: a.offsetMinutes,
    label: a.label || formatOffsetMinutes(a.offsetMinutes),
    triggerTime: a.triggerTime?.toISOString ? a.triggerTime.toISOString() : String(a.triggerTime),
    isSent: a.isSent,
    sentAt: a.sentAt ? (a.sentAt.toISOString ? a.sentAt.toISOString() : String(a.sentAt)) : null,
  }));

  // Lấy cấu hình telegram của các participant để hiển thị
  const participantUsernames = (reminder.participants || []).map((p: any) => p.username);
  const telegramConfigs = await prisma.telegramConfig.findMany({
    where: {
      username: { in: participantUsernames },
      isEnabled: true,
      chatId: { not: '' },
    },
    select: { username: true },
  });
  const telegramUserSet = new Set(telegramConfigs.map((t) => t.username));

  const participants = (reminder.participants || []).map((p: any) => ({
    id: p.id,
    username: p.username,
    studentName: p.user?.student?.hoTen || p.user?.student?.ten || p.username,
    className: p.user?.student?.maLop || '',
    isCreator: p.isCreator || p.username === reminder.creatorUsername,
    isDismissed: p.isDismissed,
    hasTelegram: telegramUserSet.has(p.username),
    telegramEnabled: telegramUserSet.has(p.username),
  }));

  return {
    id: reminder.id,
    title: reminder.title,
    description: reminder.description,
    location: reminder.location,
    type: reminder.type as any,
    idToHoc: reminder.idToHoc,
    idMon: reminder.idMon,
    maMon: reminder.maMon,
    tenMon: reminder.tenMon,
    nhomTo: reminder.nhomTo,
    lop: reminder.lop,
    tkbRaw: reminder.tkbRaw,
    giangVien: reminder.giangVien,
    eventTime: reminder.eventTime.toISOString ? reminder.eventTime.toISOString() : String(reminder.eventTime),
    creatorUsername: reminder.creatorUsername,
    creatorName: reminder.creator?.student?.hoTen || reminder.creatorUsername,
    status: reminder.status as any,
    isCompleted: reminder.isCompleted,
    alerts,
    participants,
    totalParticipants: participants.length,
    telegramRecipientCount: participants.filter((p: any) => p.hasTelegram).length,
    createdAt: reminder.createdAt.toISOString ? reminder.createdAt.toISOString() : String(reminder.createdAt),
    updatedAt: reminder.updatedAt.toISOString ? reminder.updatedAt.toISOString() : String(reminder.updatedAt),
  };
}
