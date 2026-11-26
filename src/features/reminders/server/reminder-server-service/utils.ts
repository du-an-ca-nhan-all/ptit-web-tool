import {
  CreateReminderInput,
  formatOffsetMinutes,
} from '../../types/reminder.types';
import { UPCOMING_GRACE_WINDOW_MS } from './constants';
import { GetRemindersOptions } from './types';

export function normalizeUsername(username: string): string {
  return username.trim().toUpperCase();
}

export function buildAlertCreateData(
  reminderId: number,
  eventDate: Date,
  offsets: number[]
) {
  const uniqueOffsets = Array.from(new Set(offsets)).sort((a, b) => b - a);
  return uniqueOffsets.map((offset) => {
    const triggerTime = new Date(eventDate.getTime() - offset * 60 * 1000);
    return {
      reminderId,
      offsetMinutes: offset,
      label: formatOffsetMinutes(offset),
      triggerTime,
      isSent: false,
    };
  });
}

export function buildUpdateReminderData(
  input: Partial<CreateReminderInput>,
  existingEventTime: Date
): { updateData: any; eventDate: Date } {
  const updateData: any = {};
  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.description !== undefined) updateData.description = input.description?.trim() || null;
  if (input.location !== undefined) updateData.location = input.location?.trim() || null;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.idToHoc !== undefined) updateData.idToHoc = input.idToHoc;
  if (input.idMon !== undefined) updateData.idMon = input.idMon;
  if (input.maMon !== undefined) updateData.maMon = input.maMon?.trim().toUpperCase() || null;
  if (input.tenMon !== undefined) updateData.tenMon = input.tenMon?.trim() || null;
  if (input.nhomTo !== undefined) updateData.nhomTo = input.nhomTo?.trim() || null;
  if (input.lop !== undefined) updateData.lop = input.lop?.trim() || null;
  if (input.tkbRaw !== undefined) updateData.tkbRaw = input.tkbRaw?.trim() || null;
  if (input.giangVien !== undefined) updateData.giangVien = input.giangVien?.trim() || null;

  let eventDate = existingEventTime;
  if (input.eventTime) {
    eventDate = new Date(input.eventTime);
    if (isNaN(eventDate.getTime())) {
      throw new Error('Thời gian sự kiện không hợp lệ');
    }
    updateData.eventTime = eventDate;
  }

  return { updateData, eventDate };
}

export function buildUserRemindersWhereClause(
  cleanUsername: string,
  options?: GetRemindersOptions
): any {
  const whereClause: any = {
    OR: [
      { creatorUsername: cleanUsername },
      {
        participants: {
          some: {
            username: cleanUsername,
            isDismissed: false,
          },
        },
      },
    ],
  };

  if (options?.type && options.type !== 'ALL') {
    whereClause.type = options.type;
  }

  if (options?.status && options.status !== 'ALL') {
    whereClause.status = options.status;
  }

  if (options?.upcomingOnly) {
    whereClause.eventTime = { gte: new Date(Date.now() - UPCOMING_GRACE_WINDOW_MS) }; // Trong vòng 2h qua hoặc tương lai
  }

  if (options?.startDate || options?.endDate) {
    whereClause.eventTime = {
      ...(options.startDate ? { gte: options.startDate } : {}),
      ...(options.endDate ? { lte: options.endDate } : {}),
    };
  }

  return whereClause;
}
