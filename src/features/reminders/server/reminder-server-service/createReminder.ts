import { prisma } from '@/src/lib/prisma';
import {
  CreateReminderInput,
  ReminderItemDto,
} from '../../types/reminder.types';
import { findEnrolledStudentsForCourse } from '../reminderParticipantService';
import { sendReminderCreatedNotification } from '../reminderDispatcher';
import { DEFAULT_OFFSET_MINUTES, REMINDER_INCLUDE } from './constants';
import { mapReminderToDto } from './mapper';
import { buildAlertCreateData, normalizeUsername } from './utils';

/**
 * Tạo mới một lịch nhắc hẹn (Cá nhân hoặc Môn học)
 */
export async function createReminder(
  creatorUsername: string,
  input: CreateReminderInput
): Promise<ReminderItemDto> {
  const cleanCreator = normalizeUsername(creatorUsername);
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
  const offsets =
    Array.isArray(input.offsetMinutesList) && input.offsetMinutesList.length > 0
      ? input.offsetMinutesList
      : DEFAULT_OFFSET_MINUTES; // Mặc định trước 1 ngày và trước 1 giờ

  const alertData = buildAlertCreateData(reminder.id, eventDate, offsets);

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
    include: REMINDER_INCLUDE,
  });

  // 5. Gửi thông báo ngay sau khi tạo lịch về Telegram:
  // - Cá nhân: gửi riêng cho người tạo (nếu bật Telegram)
  // - Môn học: gửi cho tất cả bạn cùng lớp/tổ đã liên kết Telegram
  sendReminderCreatedNotification(reminder.id).catch((notifErr) => {
    console.warn('[createReminder] sendReminderCreatedNotification error:', notifErr);
  });

  return await mapReminderToDto(fullReminder, cleanCreator);
}
