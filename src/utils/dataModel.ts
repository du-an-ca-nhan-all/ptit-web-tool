import { ExamRecord, ExamSession, SessionClassCount } from '../types';

/**
 * Kiểm tra sinh viên có đang thuộc diện đang theo học (DANG_HOC) dưới sự quản lý của lớp trưởng không.
 * Bỏ qua các trạng thái thôi học (NGHI_HOC), bảo lưu (BAO_LUU), chuyển lớp (CHUYEN_LOP), loại bỏ (LOAI_BO).
 */
export function isActiveClassMember(record: ExamRecord): boolean {
  return !record.studentStatus || record.studentStatus === 'DANG_HOC';
}

export function buildSessions(records: ExamRecord[]): ExamSession[] {
  const sessionMap = new Map<string, ExamSession>();

  records.forEach(r => {
    // Bỏ qua sinh viên đã thôi học / bảo lưu / không còn thuộc quản lý của lớp trưởng
    if (!isActiveClassMember(r)) return;

    const key = `${r.MAPTHI}|${r.NgayThi}|${r.GioThi}|${r.TenMH}`;
    if (!sessionMap.has(key)) {
      sessionMap.set(key, {
        id: key,
        room: r.MAPTHI,
        date: r.NgayThi,
        time: r.GioThi,
        subject: r.TenMH,
        subjectCode: r.MaMH,
        examFormat: r.MaHTThi || '',
        classCounts: [],
        totalStudents: 0,
        records: []
      });
    }
    const session = sessionMap.get(key)!;
    session.records.push(r);
    session.totalStudents++;
  });

  // Calculate class counts for each session (excluding postponed students from active head count)
  const result = Array.from(sessionMap.values());
  result.forEach(session => {
    const counts = new Map<string, number>();
    session.records.forEach(r => {
      const cls = r.MaLop || 'Khác';
      if (!counts.has(cls)) {
        counts.set(cls, 0);
      }
      if (!r.isPostponed) {
        counts.set(cls, counts.get(cls)! + 1);
      }
    });

    session.classCounts = Array.from(counts.entries())
      .map(([className, count]) => ({ className, count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.className.localeCompare(b.className);
      });
  });

  return result;
}
