import { prisma } from '@/src/lib/prisma';
import { checkIsMonitor } from '@/src/lib/auth';
import type { ImportClassMemberRow } from '../../utils/classMemberImportParser';
import type {
  ClassMemberImportPreview,
  PreviewDroppedStudent,
  PreviewNewStudent,
  PreviewRestoredStudent,
  PreviewTransferredStudent,
  PreviewUnchangedStudent,
} from './types';
import { normalizeImportItems } from './utils';

export async function previewClassMemberImport(
  classCode: string,
  rawItems: ImportClassMemberRow[]
): Promise<ClassMemberImportPreview> {
  const cleanClassCode = classCode.trim();
  const items = normalizeImportItems(rawItems);
  const importedMaSVs = items.map((i) => i.maSV);
  const importedSet = new Set(importedMaSVs);

  const [currentActiveStudents, matchedDbStudents] = await Promise.all([
    prisma.student.findMany({
      where: {
        maLop: cleanClassCode,
        trangThai: 'DANG_HOC',
      },
      include: {
        user: { select: { role: true } },
      },
      orderBy: [{ ten: 'asc' }, { hoLot: 'asc' }],
    }),
    importedMaSVs.length > 0
      ? prisma.student.findMany({
          where: {
            maSV: { in: importedMaSVs },
          },
        })
      : Promise.resolve([]),
  ]);

  const dbByMaSV = new Map(matchedDbStudents.map((s) => [s.maSV.toUpperCase(), s]));

  const droppedOut: PreviewDroppedStudent[] = [];
  for (const st of currentActiveStudents) {
    if (!importedSet.has(st.maSV.toUpperCase())) {
      droppedOut.push({
        maSV: st.maSV,
        hoTen: st.hoTen || `${st.hoLot || ''} ${st.ten || ''}`.trim() || st.maSV,
        gioiTinh: st.gioiTinh || 'Nam',
        ngaySinh: st.ngaySinh || '',
        soDienThoai: st.soDienThoai || '',
        isMonitor: checkIsMonitor(st.user?.role),
      });
    }
  }

  const transferred: PreviewTransferredStudent[] = [];
  const restored: PreviewRestoredStudent[] = [];
  const newStudents: PreviewNewStudent[] = [];
  const unchanged: PreviewUnchangedStudent[] = [];

  for (const item of items) {
    const existing = dbByMaSV.get(item.maSV);
    if (!existing) {
      newStudents.push({
        maSV: item.maSV,
        hoTen: item.hoTen || item.maSV,
        gioiTinh: item.gioiTinh || 'Nam',
        ngaySinh: item.ngaySinh || '',
        soDienThoai: item.soDienThoai || '',
      });
      continue;
    }

    const displayName = existing.hoTen || item.hoTen || `${existing.hoLot || ''} ${existing.ten || ''}`.trim() || item.maSV;
    const displayGender = existing.gioiTinh || item.gioiTinh || 'Nam';
    const displayDob = existing.ngaySinh || item.ngaySinh || '';
    const existingClass = (existing.maLop || '').trim();
    const existingStatus = existing.trangThai || 'DANG_HOC';

    if (existingClass !== cleanClassCode) {
      transferred.push({
        maSV: item.maSV,
        hoTen: displayName,
        fromClass: existingClass || 'Chưa rõ lớp',
        previousStatus: existingStatus,
        gioiTinh: displayGender,
        ngaySinh: displayDob,
      });
    } else if (existingStatus !== 'DANG_HOC') {
      restored.push({
        maSV: item.maSV,
        hoTen: displayName,
        previousStatus: existingStatus,
        gioiTinh: displayGender,
        ngaySinh: displayDob,
      });
    } else {
      unchanged.push({
        maSV: item.maSV,
        hoTen: displayName,
        gioiTinh: displayGender,
        ngaySinh: displayDob,
      });
    }
  }

  return {
    classCode: cleanClassCode,
    currentActiveCount: currentActiveStudents.length,
    importedCount: items.length,
    expectedActiveCountAfter: items.length,
    droppedOut,
    transferred,
    restored,
    newStudents,
    unchanged,
    hasMonitorInDroppedOut: droppedOut.some((s) => s.isMonitor),
  };
}
