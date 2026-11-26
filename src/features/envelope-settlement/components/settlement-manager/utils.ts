import { ExamRecord } from '../../../../types';
import { isActiveClassMember } from '../../../../utils/dataModel';
import { calculateRoomPrice } from '../../../../config/pricingConfig';
import {
  ActiveDetailCalc,
  AvailableClasses,
  ClassCountItem,
  DebtDetail,
} from './types';

export const getExclusionKey = (sessionId: string, maSV: string) => `${sessionId}||${maSV}`;

export function computeRoomRecords(selectedDetail: DebtDetail | null, records: ExamRecord[]): ExamRecord[] {
  if (!selectedDetail) return [];
  const sess = selectedDetail.session;
  const room = sess.room || sess.MAPTHI;
  const date = sess.date || sess.NgayThi;
  const time = sess.time || sess.GioThi;
  const subject = sess.subject || sess.TenMH;
  return records.filter(
    r =>
      isActiveClassMember(r) &&
      r.MAPTHI === room &&
      r.NgayThi === date &&
      r.GioThi === time &&
      r.TenMH === subject
  );
}

export function filterStudentRecords(
  currentRoomRecords: ExamRecord[],
  studentClassFilter: string,
  studentSearchQuery: string
): ExamRecord[] {
  return currentRoomRecords.filter(r => {
    if (studentClassFilter !== 'ALL' && r.MaLop !== studentClassFilter) {
      return false;
    }
    if (studentSearchQuery.trim()) {
      const q = studentSearchQuery.toLowerCase().trim();
      const fullName = `${r.HoLotSV || ''} ${r.TenSV || ''}`.toLowerCase();
      const mssv = (r.MaSV || '').toLowerCase();
      return fullName.includes(q) || mssv.includes(q);
    }
    return true;
  });
}

export function computeModalClassCounts(
  selectedDetail: DebtDetail | null,
  currentRoomRecords: ExamRecord[]
): ClassCountItem[] {
  if (!selectedDetail) return [];
  const countsMap = new Map<string, number>();
  currentRoomRecords.forEach(r => {
    const cls = r.MaLop || 'Khác';
    countsMap.set(cls, (countsMap.get(cls) || 0) + 1);
  });
  if (selectedDetail.toClass && !countsMap.has(selectedDetail.toClass)) {
    countsMap.set(selectedDetail.toClass, 0);
  }
  if (selectedDetail.fromClass && !countsMap.has(selectedDetail.fromClass)) {
    countsMap.set(selectedDetail.fromClass, 0);
  }
  return Array.from(countsMap.entries())
    .map(([className, count]) => ({ className, count }))
    .sort((a, b) => b.count - a.count);
}

export function computeAvailableClasses(
  monitorClasses: Set<string>,
  records: ExamRecord[]
): AvailableClasses {
  const monClasses = Array.from(monitorClasses).sort((a, b) => a.localeCompare(b));
  const recordClassesSet = new Set<string>();
  records.forEach((r) => {
    if (r.MaLop && r.MaLop.trim()) {
      const cls = r.MaLop.trim();
      if (!monitorClasses.has(cls)) {
        recordClassesSet.add(cls);
      }
    }
  });
  const otherClasses = Array.from(recordClassesSet).sort((a, b) => a.localeCompare(b));
  return {
    monClasses,
    otherClasses,
    allClasses: [...monClasses, ...otherClasses],
  };
}

export function computeActiveDetailCalc(
  selectedDetail: DebtDetail | null,
  effectiveClassCountsForModal: Map<string, number>
): ActiveDetailCalc | null {
  if (!selectedDetail) return null;
  const sess = selectedDetail.session;
  const responsibleClass = selectedDetail.toClass;
  const totalStudents = Array.from(effectiveClassCountsForModal.values()).reduce((sum, cnt) => sum + cnt, 0);
  const roomPrice = calculateRoomPrice({
    subject: sess.subject,
    subjectCode: sess.subjectCode,
    room: sess.room,
    examFormat: sess.examFormat,
    sessionKey: sess.id,
  });
  const pricePerStudent = totalStudents > 0 ? roomPrice / totalStudents : 0;
  const fromClassCount = effectiveClassCountsForModal.get(selectedDetail.fromClass) || 0;
  const amount = fromClassCount * pricePerStudent;

  return {
    responsibleClass,
    totalMonitoredStudents: totalStudents,
    pricePerStudent,
    totalRoomPrice: roomPrice,
    fromClassCount,
    amount,
  };
}
