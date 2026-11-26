import { prisma } from '@/src/lib/prisma';
import {
  CreateReminderInput,
  ReminderItemDto,
} from '../../types/reminder.types';
import { REMINDER_INCLUDE } from './constants';
import { mapReminderToDto } from './mapper';
import {
  buildAlertCreateData,
  buildUpdateReminderData,
  normalizeUsername,
} from './utils';

export interface UpdateReminderParams {
  id: number;
  username: string;
  input: Partial<CreateReminderInput>;
  isAdmin?: boolean;
}

/**
 * Chỉnh sửa một lịch nhắc hẹn
 */
export async function updateReminder({
  id,
  username,
  input,
  isAdmin = false,
}: UpdateReminderParams): Promise<ReminderItemDto> {
  const cleanUsername = normalizeUsername(username);

  const existing = await prisma.reminderItem.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new Error('Không tìm thấy lịch nhắc hẹn');
  }

  if (existing.creatorUsername !== cleanUsername && !isAdmin) {
    throw new Error('Bạn không có quyền chỉnh sửa nhắc hẹn này');
  }

  const { updateData, eventDate } = buildUpdateReminderData(input, existing.eventTime);

  await prisma.reminderItem.update({
    where: { id },
    data: updateData,
  });

  // Cập nhật lại các mốc cảnh báo nếu offsetMinutesList hoặc eventTime thay đổi
  if (input.offsetMinutesList || input.eventTime) {
    const offsets =
      input.offsetMinutesList ||
      (await prisma.reminderAlert.findMany({ where: { reminderId: id } })).map(
        (a) => a.offsetMinutes
      );

    // Xóa alert cũ
    await prisma.reminderAlert.deleteMany({ where: { reminderId: id } });

    // Tạo alert mới
    const alertData = buildAlertCreateData(id, eventDate, offsets);

    if (alertData.length > 0) {
      await prisma.reminderAlert.createMany({ data: alertData });
    }
  }

  const updated = await prisma.reminderItem.findUnique({
    where: { id },
    include: REMINDER_INCLUDE,
  });

  return await mapReminderToDto(updated, cleanUsername);
}

/**
 * Xóa một lịch nhắc hẹn
 */
export async function deleteReminder(
  id: number,
  username: string,
  isAdmin = false
): Promise<boolean> {
  const cleanUsername = normalizeUsername(username);

  const existing = await prisma.reminderItem.findUnique({ where: { id } });
  if (!existing) return true;

  if (existing.creatorUsername !== cleanUsername && !isAdmin) {
    throw new Error('Bạn không có quyền xóa nhắc hẹn này');
  }

  await prisma.reminderItem.delete({ where: { id } });
  return true;
}

/**
 * Đổi trạng thái Hoàn thành / Chưa hoàn thành
 */
export async function toggleReminderComplete(
  id: number,
  username: string
): Promise<ReminderItemDto> {
  const cleanUsername = normalizeUsername(username);
  const existing = await prisma.reminderItem.findUnique({ where: { id } });
  if (!existing) throw new Error('Không tìm thấy lịch nhắc hẹn');

  const newCompleted = !existing.isCompleted;
  const updated = await prisma.reminderItem.update({
    where: { id },
    data: {
      isCompleted: newCompleted,
      status: newCompleted ? 'COMPLETED' : 'ACTIVE',
    },
    include: REMINDER_INCLUDE,
  });

  return await mapReminderToDto(updated, cleanUsername);
}

/**
 * Sinh viên tự ẩn nhắc hẹn khỏi lịch cá nhân của mình
 */
export async function dismissReminderForUser(
  reminderId: number,
  username: string
): Promise<boolean> {
  const cleanUsername = normalizeUsername(username);
  await prisma.reminderParticipant.updateMany({
    where: { reminderId, username: cleanUsername },
    data: { isDismissed: true },
  });
  return true;
}
