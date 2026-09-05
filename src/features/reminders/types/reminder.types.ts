export type ReminderType = 'PERSONAL' | 'COURSE' | 'CLASS';
export type ReminderStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface ReminderAlertDto {
  id?: number;
  offsetMinutes: number;
  label?: string | null;
  triggerTime?: string;
  isSent?: boolean;
  sentAt?: string | null;
}

export interface ReminderParticipantDto {
  id?: number;
  username: string;
  studentName?: string;
  className?: string;
  isCreator: boolean;
  isDismissed?: boolean;
  hasTelegram?: boolean;
  telegramEnabled?: boolean;
}

export interface ReminderItemDto {
  id: number;
  title: string;
  description?: string | null;
  location?: string | null;
  type: ReminderType;
  
  // Thông tin tổ học / môn học (QLDTTX)
  idToHoc?: string | null;
  idMon?: string | null;
  maMon?: string | null;
  tenMon?: string | null;
  nhomTo?: string | null;
  lop?: string | null;
  tkbRaw?: string | null;
  giangVien?: string | null;
  
  eventTime: string; // ISO string
  creatorUsername: string;
  creatorName?: string;
  status: ReminderStatus;
  isCompleted: boolean;
  
  alerts: ReminderAlertDto[];
  participants: ReminderParticipantDto[];
  totalParticipants?: number;
  telegramRecipientCount?: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderInput {
  title: string;
  description?: string;
  location?: string;
  type: ReminderType;
  
  // Thông tin môn học nếu type === 'COURSE'
  idToHoc?: string;
  idMon?: string;
  maMon?: string;
  tenMon?: string;
  nhomTo?: string;
  lop?: string;
  tkbRaw?: string;
  giangVien?: string;
  
  eventTime: string; // ISO format
  offsetMinutesList: number[]; // Danh sách các mốc báo trước tính bằng phút
}

export interface EnrolledCourseOption {
  idToHoc: string;
  idMon?: string;
  maMon: string;
  tenMon: string;
  nhomTo: string;
  lop?: string;
  tkb?: string;
  giangVien?: string;
  soTc?: number;
}

export const PRESET_REMINDER_OFFSETS = [
  { value: 4320, label: 'Trước 3 ngày', shortLabel: '3 ngày' },
  { value: 2880, label: 'Trước 2 ngày', shortLabel: '2 ngày' },
  { value: 1440, label: 'Trước 1 ngày', shortLabel: '1 ngày' },
  { value: 360, label: 'Trước 6 giờ', shortLabel: '6 giờ' },
  { value: 300, label: 'Trước 5 giờ', shortLabel: '5 giờ' },
  { value: 120, label: 'Trước 2 giờ', shortLabel: '2 giờ' },
  { value: 60, label: 'Trước 1 giờ', shortLabel: '1 giờ' },
  { value: 30, label: 'Trước 30 phút', shortLabel: '30 phút' },
  { value: 0, label: 'Đúng giờ diễn ra', shortLabel: 'Đúng giờ' },
] as const;

export function formatOffsetMinutes(minutes: number): string {
  if (minutes === 0) return 'Đúng giờ diễn ra';
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `Trước ${days} ngày`;
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `Trước ${hours} giờ`;
  }
  return `Trước ${minutes} phút`;
}
