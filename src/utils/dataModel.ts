import { ExamRecord, ExamSession, SessionClassCount } from '../types';

export function buildSessions(records: ExamRecord[]): ExamSession[] {
  const sessionMap = new Map<string, ExamSession>();

  records.forEach(r => {
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

  // Calculate class counts for each session
  const result = Array.from(sessionMap.values());
  result.forEach(session => {
    const counts = new Map<string, number>();
    session.records.forEach(r => {
      const cls = r.MaLop || 'Khác';
      counts.set(cls, (counts.get(cls) || 0) + 1);
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
