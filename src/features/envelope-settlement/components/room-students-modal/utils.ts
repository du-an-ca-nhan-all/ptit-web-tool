import { ExamRecord, ExamSession } from '../../../../types';
import { isActiveClassMember } from '../../../../utils/dataModel';
import { ClassBreakdownItem } from './types';

export function extractRoomRecords(
  session: ExamSession | null,
  records: ExamRecord[]
): ExamRecord[] {
  if (!session) return [];
  if (session.records && session.records.length > 0) {
    return session.records.filter(isActiveClassMember);
  }
  if (records && records.length > 0) {
    return records.filter(
      (r) =>
        isActiveClassMember(r) &&
        (r.MAPTHI === session.room || r.MAPTHI === (session as any).MAPTHI) &&
        (r.NgayThi === session.date || r.NgayThi === (session as any).NgayThi) &&
        (r.GioThi === session.time || r.GioThi === (session as any).GioThi) &&
        (r.TenMH === session.subject || r.TenMH === (session as any).TenMH)
    );
  }
  return [];
}

export function computeClassBreakdown(roomRecords: ExamRecord[]): ClassBreakdownItem[] {
  const countsMap = new Map<string, number>();
  roomRecords.forEach((r) => {
    const cls = r.MaLop || 'Khác';
    countsMap.set(cls, (countsMap.get(cls) || 0) + 1);
  });
  return Array.from(countsMap.entries())
    .map(([className, count]) => ({ className, count }))
    .sort((a, b) => b.count - a.count || a.className.localeCompare(b.className));
}

export function filterAndSortStudents(
  roomRecords: ExamRecord[],
  selectedClass: string,
  searchQuery: string
): ExamRecord[] {
  let result = roomRecords;

  if (selectedClass && selectedClass !== 'ALL') {
    const cleanCls = selectedClass.trim().toUpperCase();
    result = result.filter((r) => (r.MaLop || '').trim().toUpperCase() === cleanCls);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter((r) => {
      const mssv = (r.MaSV || '').toLowerCase();
      const fullName = `${r.HoLotSV || r.HoDem || ''} ${r.TenSV || r.Ten || ''}`.toLowerCase();
      const lop = (r.MaLop || '').toLowerCase();
      return mssv.includes(q) || fullName.includes(q) || lop.includes(q);
    });
  }

  return [...result].sort((a, b) => {
    const nameA = (a.TenSV || a.Ten || '').toLowerCase();
    const nameB = (b.TenSV || b.Ten || '').toLowerCase();
    if (nameA !== nameB) return nameA.localeCompare(nameB, 'vi');
    const hoA = (a.HoLotSV || a.HoDem || '').toLowerCase();
    const hoB = (b.HoLotSV || b.HoDem || '').toLowerCase();
    return hoA.localeCompare(hoB, 'vi');
  });
}

export function getStudentFullName(student: ExamRecord): string {
  return `${student.HoLotSV || student.HoDem || ''} ${student.TenSV || student.Ten || ''}`.trim();
}
