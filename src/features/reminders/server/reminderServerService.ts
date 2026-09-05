import { prisma } from '@/src/lib/prisma';
import {
  CreateReminderInput,
  ReminderItemDto,
  formatOffsetMinutes,
} from '../types/reminder.types';
import { findEnrolledStudentsForCourse } from './reminderParticipantService';
import { sendReminderCreatedNotification } from './reminderDispatcher';

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

/**
 * Tạo mới một lịch nhắc hẹn (Cá nhân hoặc Môn học)
 */
export async function createReminder(
  creatorUsername: string,
  input: CreateReminderInput
): Promise<ReminderItemDto> {
  const cleanCreator = creatorUsername.trim().toUpperCase();
  const eventDate = new Date(input.eventTime);

  if (isNaN(eventDate.getTime())) {
    throw new Error('Thời gian sự kiện không hợp lệ');
  }
  if (!input.title || !input.title.trim()) {
    throw new Error('Tiêu đề nhắc hẹn không được để trống');
  }

  // 1. Tạo ReminderItem
  const reminder = await prisma.reminderItem.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      location: input.location?.trim() || null,
      type: input.type || 'PERSONAL',
      idToHoc: input.idToHoc || null,
      idMon: input.idMon || null,
      maMon: input.maMon?.trim().toUpperCase() || null,
      tenMon: input.tenMon?.trim() || null,
      nhomTo: input.nhomTo?.trim() || null,
      lop: input.lop?.trim() || null,
      tkbRaw: input.tkbRaw?.trim() || null,
      giangVien: input.giangVien?.trim() || null,
      eventTime: eventDate,
      creatorUsername: cleanCreator,
      status: 'ACTIVE',
      isCompleted: false,
    },
  });

  // 2. Tạo các mốc ReminderAlert
  const offsets = Array.isArray(input.offsetMinutesList) && input.offsetMinutesList.length > 0
    ? Array.from(new Set(input.offsetMinutesList)).sort((a, b) => b - a)
    : [1440, 60]; // Mặc định trước 1 ngày và trước 1 giờ

  const alertData = offsets.map((offset) => {
    const triggerTime = new Date(eventDate.getTime() - offset * 60 * 1000);
    return {
      reminderId: reminder.id,
      offsetMinutes: offset,
      label: formatOffsetMinutes(offset),
      triggerTime,
      isSent: false,
    };
  });

  if (alertData.length > 0) {
    await prisma.reminderAlert.createMany({
      data: alertData,
    });
  }

  // 3. Xác định danh sách sinh viên tham gia và thêm vào lịch cá nhân
  let participantUsernames: string[] = [cleanCreator];

  if (input.type === 'COURSE' || input.type === 'CLASS') {
    // Tìm tất cả bạn học cùng lớp, môn, tổ...
    const enrolledStudents = await findEnrolledStudentsForCourse({
      idToHoc: input.idToHoc,
      idMon: input.idMon,
      maMon: input.maMon,
      nhomTo: input.nhomTo,
      lop: input.lop,
      creatorUsername: cleanCreator,
    });
    participantUsernames = enrolledStudents;
  }

  // Đảm bảo các user có trong bảng User để tránh lỗi FK
  const existingUsers = await prisma.user.findMany({
    where: { username: { in: participantUsernames } },
    select: { username: true },
  });
  const validUsernames = new Set(existingUsers.map((u) => u.username));
  // Nếu người tạo chưa có trong tập hợp (rất hiếm), giữ lại
  validUsernames.add(cleanCreator);

  const participantData = Array.from(validUsernames).map((username) => ({
    reminderId: reminder.id,
    username,
    isCreator: username === cleanCreator,
    isDismissed: false,
  }));

  if (participantData.length > 0) {
    await prisma.reminderParticipant.createMany({
      data: participantData,
      skipDuplicates: true,
    });
  }

  // 4. Lấy lại bản ghi đầy đủ để trả về
  const fullReminder = await prisma.reminderItem.findUnique({
    where: { id: reminder.id },
    include: {
      creator: { include: { student: true } },
      alerts: { orderBy: { triggerTime: 'asc' } },
      participants: { include: { user: { include: { student: true } } } },
    },
  });

  // 5. Gửi thông báo ngay sau khi tạo lịch về Telegram:
  // - Cá nhân: gửi riêng cho người tạo (nếu bật Telegram)
  // - Môn học: gửi cho tất cả bạn cùng lớp/tổ đã liên kết Telegram
  sendReminderCreatedNotification(reminder.id).catch((notifErr) => {
    console.warn('[createReminder] sendReminderCreatedNotification error:', notifErr);
  });

  return await mapReminderToDto(fullReminder, cleanCreator);
}

/**
 * Lấy danh sách lịch nhắc hẹn của sinh viên (gồm cả cá nhân và các môn học được gán vào lịch)
 */
export async function getRemindersForUser(
  username: string,
  options?: {
    type?: string;
    status?: string;
    upcomingOnly?: boolean;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<ReminderItemDto[]> {
  const cleanUsername = username.trim().toUpperCase();

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
    whereClause.eventTime = { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }; // Trong vòng 2h qua hoặc tương lai
  }

  if (options?.startDate || options?.endDate) {
    whereClause.eventTime = {
      ...(options.startDate ? { gte: options.startDate } : {}),
      ...(options.endDate ? { lte: options.endDate } : {}),
    };
  }

  const list = await prisma.reminderItem.findMany({
    where: whereClause,
    include: {
      creator: { include: { student: true } },
      alerts: { orderBy: { triggerTime: 'asc' } },
      participants: { include: { user: { include: { student: true } } } },
    },
    orderBy: { eventTime: 'asc' },
  });

  const dtos = await Promise.all(list.map((item) => mapReminderToDto(item, cleanUsername)));
  return dtos;
}

/**
 * Chỉnh sửa một lịch nhắc hẹn
 */
export async function updateReminder(
  id: number,
  username: string,
  input: Partial<CreateReminderInput>,
  isAdmin = false
): Promise<ReminderItemDto> {
  const cleanUsername = username.trim().toUpperCase();

  const existing = await prisma.reminderItem.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new Error('Không tìm thấy lịch nhắc hẹn');
  }

  if (existing.creatorUsername !== cleanUsername && !isAdmin) {
    throw new Error('Bạn không có quyền chỉnh sửa nhắc hẹn này');
  }

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

  let eventDate = existing.eventTime;
  if (input.eventTime) {
    eventDate = new Date(input.eventTime);
    if (isNaN(eventDate.getTime())) {
      throw new Error('Thời gian sự kiện không hợp lệ');
    }
    updateData.eventTime = eventDate;
  }

  await prisma.reminderItem.update({
    where: { id },
    data: updateData,
  });

  // Cập nhật lại các mốc cảnh báo nếu offsetMinutesList hoặc eventTime thay đổi
  if (input.offsetMinutesList || input.eventTime) {
    const offsets = input.offsetMinutesList || (await prisma.reminderAlert.findMany({ where: { reminderId: id } })).map((a) => a.offsetMinutes);
    const uniqueOffsets = Array.from(new Set(offsets)).sort((a, b) => b - a);

    // Xóa alert cũ
    await prisma.reminderAlert.deleteMany({ where: { reminderId: id } });

    // Tạo alert mới
    const alertData = uniqueOffsets.map((offset) => {
      const triggerTime = new Date(eventDate.getTime() - offset * 60 * 1000);
      return {
        reminderId: id,
        offsetMinutes: offset,
        label: formatOffsetMinutes(offset),
        triggerTime,
        isSent: false,
      };
    });

    if (alertData.length > 0) {
      await prisma.reminderAlert.createMany({ data: alertData });
    }
  }

  const updated = await prisma.reminderItem.findUnique({
    where: { id },
    include: {
      creator: { include: { student: true } },
      alerts: { orderBy: { triggerTime: 'asc' } },
      participants: { include: { user: { include: { student: true } } } },
    },
  });

  return await mapReminderToDto(updated, cleanUsername);
}

/**
 * Xóa một lịch nhắc hẹn
 */
export async function deleteReminder(id: number, username: string, isAdmin = false): Promise<boolean> {
  const cleanUsername = username.trim().toUpperCase();

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
export async function toggleReminderComplete(id: number, username: string): Promise<ReminderItemDto> {
  const cleanUsername = username.trim().toUpperCase();
  const existing = await prisma.reminderItem.findUnique({ where: { id } });
  if (!existing) throw new Error('Không tìm thấy lịch nhắc hẹn');

  const newCompleted = !existing.isCompleted;
  const updated = await prisma.reminderItem.update({
    where: { id },
    data: {
      isCompleted: newCompleted,
      status: newCompleted ? 'COMPLETED' : 'ACTIVE',
    },
    include: {
      creator: { include: { student: true } },
      alerts: { orderBy: { triggerTime: 'asc' } },
      participants: { include: { user: { include: { student: true } } } },
    },
  });

  return await mapReminderToDto(updated, cleanUsername);
}

/**
 * Sinh viên tự ẩn nhắc hẹn khỏi lịch cá nhân của mình
 */
export async function dismissReminderForUser(reminderId: number, username: string): Promise<boolean> {
  const cleanUsername = username.trim().toUpperCase();
  await prisma.reminderParticipant.updateMany({
    where: { reminderId, username: cleanUsername },
    data: { isDismissed: true },
  });
  return true;
}
