export type GlobalJobType =
  | 'SYNC_TIMETABLE'
  | 'SYNC_GRADES'
  | 'SYNC_LMS'
  | 'SYNC_EXAMS'
  | 'SYNC_SLINK_GRADES'
  | 'SYNC_TODAY_EXAMS'
  | 'SYNC_ALL';

export interface EnqueueGlobalSyncOptions {
  jobType: GlobalJobType;
  title?: string;
  triggeredBy?: string; // 'SYSTEM_CRON' | 'ADMIN_MANUAL' | username
  targetUsernames?: string[];
  scheduledTime?: string;
}

/**
 * Định nghĩa nhãn & tiêu đề cho từng loại Job Global
 */
export const GLOBAL_JOB_DEFINITIONS: Record<
  string,
  { key: string; name: string; shortName: string; description: string; icon: string }
> = {
  SYNC_TIMETABLE: {
    key: 'SYNC_TIMETABLE',
    name: 'Đồng Bộ Lịch Học & Thời Khóa Biểu',
    shortName: 'Đồng bộ Lịch học',
    description: 'Kéo thời khóa biểu & lịch học cá nhân từ Cổng QLDTTX cho toàn bộ sinh viên',
    icon: 'Calendar',
  },
  SYNC_GRADES: {
    key: 'SYNC_GRADES',
    name: 'Đồng Bộ Điểm & Kết Quả Học Tập',
    shortName: 'Đồng bộ Điểm số',
    description: 'Kéo bảng điểm, điểm thành phần & GPA từ Cổng QLDTTX cho toàn bộ sinh viên',
    icon: 'GraduationCap',
  },
  SYNC_LMS: {
    key: 'SYNC_LMS',
    name: 'Đồng Bộ Kết Quả Học Tập LMS PTTC1',
    shortName: 'Đồng bộ LMS',
    description: 'Kéo danh sách khóa học, tiến độ % và điểm quá trình từ Cổng LMS PTTC1',
    icon: 'BookOpen',
  },
  SYNC_EXAMS: {
    key: 'SYNC_EXAMS',
    name: 'Đồng Bộ Lịch Thi Cá Nhân QLDTTX',
    shortName: 'Đồng bộ Lịch thi',
    description: 'Kéo lịch thi cá nhân, phòng thi & báo thay đổi từ Cổng QLDTTX cho toàn bộ sinh viên (7h sáng)',
    icon: 'CalendarDays',
  },
  SYNC_SLINK_GRADES: {
    key: 'SYNC_SLINK_GRADES',
    name: 'Đồng Bộ Kết Quả Học Tập PTIT S-Link',
    shortName: 'Đồng bộ Điểm S-Link',
    description: 'Kéo kết quả học tập, điểm chi tiết & GPA từ Cổng PTIT S-Link cho toàn bộ sinh viên',
    icon: 'Award',
  },
  SYNC_TODAY_EXAMS: {
    key: 'SYNC_TODAY_EXAMS',
    name: 'Quét Ca Thi Hôm Nay (QLDTTX)',
    shortName: 'Quét ca thi hôm nay',
    description: 'Kiểm tra biến động phòng thi / ca thi hôm nay cho sinh viên có lịch thi (20-30 phút/lần)',
    icon: 'Flame',
  },
  SYNC_ALL: {
    key: 'SYNC_ALL',
    name: 'Đồng Bộ Toàn Diện (Lịch học + Điểm + LMS + Lịch thi + S-Link)',
    shortName: 'Đồng bộ Tất cả',
    description: 'Đồng bộ đồng thời tất cả tác vụ: Lịch học, Điểm số QLDTTX, Khóa học LMS, Lịch thi và Điểm S-Link',
    icon: 'Layers',
  },
};
