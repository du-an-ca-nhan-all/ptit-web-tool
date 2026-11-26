import { ExamRecord } from '../../types/class.types';
import { RoomDetailItem } from './types';

export function parseExamDateTime(dateStr?: string, timeStr?: string): number {
  if (!dateStr) return 0;
  const parts = dateStr.split(/[\/\-]/);
  let d = 1, m = 1, y = 1970;
  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);
    y = p2;
    if (p1 > 12) {
      m = p0; d = p1;
    } else if (p0 > 12) {
      d = p0; m = p1;
    } else {
      m = p0; d = p1; // Assume M/D/YYYY by default
    }
  }
  let hour = 0, min = 0;
  if (timeStr) {
    const timeParts = timeStr.toLowerCase().replace('g', ':').replace('h', ':').split(':');
    hour = parseInt(timeParts[0], 10) || 0;
    min = parseInt(timeParts[1], 10) || 0;
  }
  return new Date(y, m - 1, d, hour, min).getTime();
}

export function buildRoomDetails(classRecords: ExamRecord[]): RoomDetailItem[] {
  if (classRecords.length === 0) return [];

  const groups = new Map<string, RoomDetailItem>();
  classRecords.forEach(r => {
    const key = `${r.MAPTHI}-${r.MaMH}-${r.NgayThi}-${r.GioThi}`;
    if (!groups.has(key)) {
      groups.set(key, {
        room: r.MAPTHI,
        subjectCode: r.MaMH,
        subjectName: r.TenMH,
        date: r.NgayThi,
        time: r.GioThi,
        format: r.MaHTThi,
        students: 1
      });
    } else {
      groups.get(key)!.students += 1;
    }
  });

  return Array.from(groups.values()).sort((a, b) => {
    const timeA = parseExamDateTime(a.date, a.time);
    const timeB = parseExamDateTime(b.date, b.time);
    if (timeA !== timeB) return timeA - timeB;
    return (a.room || '').localeCompare(b.room || '');
  });
}

export function buildAnnouncementText(classRecords: ExamRecord[], selectedClass: string): string {
  if (classRecords.length === 0) return '';

  // Group exams by Subject
  const examsBySubject = classRecords.reduce((acc, curr) => {
    const key = curr.MaMH;
    if (!acc[key]) {
      acc[key] = {
        subjectName: curr.TenMH,
        date: curr.NgayThi,
        time: curr.GioThi,
        room: curr.MAPTHI,
        format: curr.MaHTThi,
        students: 1
      };
    } else {
      acc[key].students += 1;
    }
    return acc;
  }, {} as Record<string, any>);

  const subjectList = Object.values(examsBySubject).map((exam: any) =>
    `- ${exam.subjectName} (${exam.format || 'Thi'}):\n  + Ngày: ${exam.date} | Giờ: ${exam.time}\n  + Phòng: ${exam.room}\n  + Số lượng: ${exam.students} SV`
  ).join('\n\n');

  return `📢 THÔNG BÁO LỊCH THI LỚP ${selectedClass}\n\nChào các bạn, đây là tổng hợp lịch thi sắp tới của lớp mình:\n\n${subjectList}\n\nCác bạn nhớ mang thẻ SV và đến đúng giờ nhé! Chúc cả lớp thi tốt! 🍀`;
}

export function exportClassRecordsToCSV(classRecords: ExamRecord[], selectedClass: string): void {
  if (classRecords.length === 0) return;
  const headers = Object.keys(classRecords[0]).join(',');
  const rows = classRecords.map(record =>
    Object.values(record).map(val => `"${val || ''}"`).join(',')
  ).join('\n');

  const csvContent = `${headers}\n${rows}`;
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `LichThi_${selectedClass}.csv`;
  link.click();
}
