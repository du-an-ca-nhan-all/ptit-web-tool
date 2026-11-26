export interface RunPendingAlertsResult {
  success: boolean;
  totalAlertsProcessed: number;
  totalMessagesSent: number;
  errors: string[];
}

export interface SendReminderCreatedResult {
  success: boolean;
  sentCount: number;
  recipientUsernames: string[];
  errors: string[];
}

export interface ReminderMessageData {
  type: string;
  title: string;
  location?: string | null;
  description?: string | null;
  tenMon?: string | null;
  maMon?: string | null;
  nhomTo?: string | null;
  lop?: string | null;
  giangVien?: string | null;
  creatorUsername: string;
}

export interface PendingAlertMessageParams {
  reminder: ReminderMessageData;
  studentName: string;
  username: string;
  creatorName: string;
  formattedEventTime: string;
  reminderOffsetLabel: string;
}

export interface CreatedReminderMessageParams {
  reminder: ReminderMessageData;
  studentName: string;
  username: string;
  creatorName: string;
  formattedEventTime: string;
  offsetLabels: string;
}
