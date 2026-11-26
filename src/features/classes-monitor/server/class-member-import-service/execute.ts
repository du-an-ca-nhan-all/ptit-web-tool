import { prisma } from '@/src/lib/prisma';
import type { ImportClassMemberRow } from '../../utils/classMemberImportParser';
import { appendNote, buildProfileUpdates, normalizeImportItems } from './utils';

export async function executeClassMemberImport(
  classCode: string,
  rawItems: ImportClassMemberRow[]
) {
  const cleanClassCode = classCode.trim();
  const items = normalizeImportItems(rawItems);
  const importedByMaSV = new Map(items.map((i) => [i.maSV, i]));
  const importedMaSVs = items.map((i) => i.maSV);
  const importedSet = new Set(importedMaSVs);

  const [currentActiveStudents, matchedDbStudents] = await Promise.all([
    prisma.student.findMany({
      where: {
        maLop: cleanClassCode,
        trangThai: 'DANG_HOC',
      },
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

  const droppedList = currentActiveStudents.filter((s) => !importedSet.has(s.maSV.toUpperCase()));
  const transferredMaSVs: string[] = [];
  const restoredMaSVs: string[] = [];
  const createdMaSVs: string[] = [];
  const updatedUnchangedMaSVs: string[] = [];

  await prisma.$transaction(
    async (tx) => {
      // 1. Mark missing students as NGHI_HOC (Thôi học)
      for (const st of droppedList) {
        const dropNote = `[Import lớp ${cleanClassCode}: Thôi học do không có trong danh sách]`;
        await tx.student.update({
          where: { maSV: st.maSV },
          data: {
            trangThai: 'NGHI_HOC',
            ghiChu: appendNote(st.ghiChu, dropNote),
          },
        });
      }

      // 2. Process all imported students
      for (const item of items) {
        const existing = dbByMaSV.get(item.maSV);

        if (!existing) {
          await tx.student.create({
            data: {
              maSV: item.maSV,
              hoLot: item.hoLot || '',
              ten: item.ten || item.maSV,
              hoTen: item.hoTen || item.maSV,
              gioiTinh: item.gioiTinh || 'Nam',
              ngaySinh: item.ngaySinh || null,
              maLop: cleanClassCode,
              trangThai: 'DANG_HOC',
              soDienThoai: item.soDienThoai || null,
              ghiChu: appendNote(item.ghiChu, `[Import vào lớp ${cleanClassCode}]`) || null,
            },
          });

          await tx.user.upsert({
            where: { username: item.maSV },
            update: {},
            create: {
              username: item.maSV,
              passwordHash: '',
              role: 'sinh_vien',
            },
          });

          createdMaSVs.push(item.maSV);
          continue;
        }

        const existingClass = (existing.maLop || '').trim();
        const existingStatus = existing.trangThai || 'DANG_HOC';
        const profileUpdates = buildProfileUpdates(item, existing);

        if (existingClass !== cleanClassCode) {
          const oldClass = existingClass || 'Chưa rõ lớp';
          const transferNote = `[Tiếp nhận từ ${oldClass} qua Import lớp ${cleanClassCode}]`;
          await tx.student.update({
            where: { maSV: existing.maSV },
            data: {
              ...profileUpdates,
              maLop: cleanClassCode,
              trangThai: 'DANG_HOC',
              ghiChu: appendNote(existing.ghiChu, item.ghiChu ? `${transferNote} ${item.ghiChu}` : transferNote),
            },
          });
          transferredMaSVs.push(existing.maSV);
        } else if (existingStatus !== 'DANG_HOC') {
          const restoreNote = `[Khôi phục vào lớp ${cleanClassCode} qua Import]`;
          await tx.student.update({
            where: { maSV: existing.maSV },
            data: {
              ...profileUpdates,
              maLop: cleanClassCode,
              trangThai: 'DANG_HOC',
              ghiChu: appendNote(existing.ghiChu, item.ghiChu ? `${restoreNote} ${item.ghiChu}` : restoreNote),
            },
          });
          restoredMaSVs.push(existing.maSV);
        } else {
          if (Object.keys(profileUpdates).length > 0) {
            await tx.student.update({
              where: { maSV: existing.maSV },
              data: profileUpdates,
            });
          }
          updatedUnchangedMaSVs.push(existing.maSV);
        }
      }
    },
    { timeout: 60000 }
  );

  return {
    classCode: cleanClassCode,
    totalImported: items.length,
    droppedOutCount: droppedList.length,
    transferredCount: transferredMaSVs.length,
    restoredCount: restoredMaSVs.length,
    createdCount: createdMaSVs.length,
    unchangedCount: updatedUnchangedMaSVs.length,
    droppedOutMaSVs: droppedList.map((s) => s.maSV),
    transferredMaSVs,
    restoredMaSVs,
    createdMaSVs,
    importedByMaSVCount: importedByMaSV.size,
  };
}
