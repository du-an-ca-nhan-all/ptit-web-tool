export interface ParsedClassSession {
  subjectName: string;
  subjectCode: string;
  group?: string;
  classCode?: string;
  dayOfWeekStr: string;
  dayOfWeekNum: number; // 2..7 = Thứ 2..Thứ 7, 8 = Chủ nhật
  periodStr: string;
  startPeriod: number;
  endPeriod: number;
  startTime: string;
  endTime: string;
  startMinutes: number; // Phút tính từ 00:00 của ngày
  room: string;
  onlineLink?: string;
  startDate: Date;
  endDate: Date;
}

export interface ParsedTkbSegment {
  raw: string;
  dayOfWeekStr: string;
  dayOfWeekNum: number;
  periodStr: string;
  startPeriod: number;
  endPeriod: number;
  startTime: string;
  endTime: string;
  startMinutes: number;
  room: string;
  startDate: Date;
  endDate: Date;
}

export interface NearestClassScheduleResult {
  found: boolean;
  maxDays: number;
  date?: Date;
  dateStr?: string;
  dowName?: string;
  dayOffset?: number;
  sessions?: ParsedClassSession[];
}

export interface QldtExamChangeItem {
  maMon: string;
  tenMon: string;
  type: 'NEW' | 'CANCELLED' | 'MODIFIED';
  diffs: Array<{
    field: string;
    label: string;
    oldVal: string;
    newVal: string;
  }>;
}
