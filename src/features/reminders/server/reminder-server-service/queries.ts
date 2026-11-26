import { prisma } from '@/src/lib/prisma';
import { ReminderItemDto } from '../../types/reminder.types';
import { REMINDER_INCLUDE } from './constants';
import { mapReminderToDto } from './mapper';
import { GetRemindersOptions } from './types';
import { buildUserRemindersWhereClause, normalizeUsername } from './utils';

/**
 * Lấy danh sách lịch nhắc hẹn của sinh viên (gồm cả cá nhân và các môn học được gán vào lịch)
 */
export async function getRemindersForUser(
  username: string,
  options?: GetRemindersOptions
): Promise<ReminderItemDto[]> {
  const cleanUsername = normalizeUsername(username);
  const whereClause = buildUserRemindersWhereClause(cleanUsername, options);

  const list = await prisma.reminderItem.findMany({
    where: whereClause,
    include: REMINDER_INCLUDE,
    orderBy: { eventTime: 'asc' },
  });

  const dtos = await Promise.all(list.map((item) => mapReminderToDto(item, cleanUsername)));
  return dtos;
}
