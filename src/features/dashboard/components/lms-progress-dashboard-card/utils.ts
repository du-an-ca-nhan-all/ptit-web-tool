export interface ProgressMotivation {
  text: string;
  badgeColor: string;
  barColor: string;
}

/**
 * Motivational message and color theme based on overall progress percentage.
 */
export function getProgressMotivation(percent: number): ProgressMotivation {
  if (percent >= 100) {
    return {
      text: 'Xuất sắc! Đã hoàn thành 100% tất cả hoạt động',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      barColor: 'from-emerald-500 to-teal-600',
    };
  }
  if (percent >= 75) {
    return {
      text: 'Tiến độ rất tốt! Hãy tiếp tục duy trì nhé',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      barColor: 'from-sky-500 to-indigo-600',
    };
  }
  if (percent >= 40) {
    return {
      text: 'Đang học tập. Hãy dành thời gian xem tiếp bài giảng',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      barColor: 'from-indigo-500 to-blue-600',
    };
  }
  return {
    text: 'Cần tăng tốc! Còn nhiều bài giảng & bài tập chưa hoàn thành',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    barColor: 'from-amber-500 to-orange-500',
  };
}

/**
 * Formats an ISO sync timestamp into HH:mm:ss DD/MM/YYYY.
 */
export function formatSyncDate(lastSyncAt?: string | null): string {
  if (!lastSyncAt) return 'Chưa cập nhật';
  try {
    const d = new Date(lastSyncAt);
    if (isNaN(d.getTime())) return 'Chưa cập nhật';
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    const secs = d.getSeconds().toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${mins}:${secs} ${day}/${month}/${year}`;
  } catch {
    return 'Chưa cập nhật';
  }
}
