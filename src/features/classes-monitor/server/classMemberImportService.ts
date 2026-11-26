import { prisma } from '@/src/lib/prisma';
import { checkIsMonitor } from '@/src/lib/auth';
import { splitVietnameseFullName, type ImportClassMemberRow } from '../utils/classMemberImportParser';

export interface PreviewDroppedStudent {
  maSV: string;
  hoTen: string;
  gioiTinh: string;
  ngaySinh: string;
  soDienThoai: string;
  isMonitor: boolean;
}

export interface PreviewTransferredStudent {
  maSV: string;
  hoTen: string;
  fromClass: string;
  previousStatus: string;
  gioiTinh: string;
  ngaySinh: string;
}

export interface PreviewRestoredStudent {
  maSV: string;
  hoTen: string;
  previousStatus: string;
  gioiTinh: string;
  ngaySinh: string;
}

export interface PreviewNewStudent {
  maSV: string;
  hoTen: string;
  gioiTinh: string;
  ngaySinh: string;
  soDienThoai: string;
}

export interface PreviewUnchangedStudent {
  maSV: string;
  hoTen: string;
  gioiTinh: string;
  ngaySinh: string;
}

export interface ClassMemberImportPreview {
  classCode: string;
  currentActiveCount: number;
  importedCount: number;
  expectedActiveCountAfter: number;
  droppedOut: PreviewDroppedStudent[];
  transferred: PreviewTransferredStudent[];
  restored: PreviewRestoredStudent[];
  newStudents: PreviewNewStudent[];
  unchanged: PreviewUnchangedStudent[];
  hasMonitorInDroppedOut: boolean;
}

function normalizeImportItems(items: ImportClassMemberRow[]): ImportClassMemberRow[] {
  const map = new Map<string, ImportClassMemberRow>();
  for (const item of items) {
    const cleanMaSV = String(item.maSV || '').trim().toUpperCase();
    if (!cleanMaSV || map.has(cleanMaSV)) continue;

    let hoLot = item.hoLot?.trim() || '';
    let ten = item.ten?.trim() || '';
    let hoTen = item.hoTen?.trim() || '';

    if (hoTen && (!hoLot || !ten)) {
      const split = splitVietnameseFullName(hoTen);
      hoLot = hoLot || split.hoLot;
      ten = ten || split.ten;
      hoTen = split.hoTen;
    } else if (!hoTen && (hoLot || ten)) {
      hoTen = `${hoLot} ${ten}`.trim();
    }

    map.set(cleanMaSV, {
      maSV: cleanMaSV,
      hoLot: hoLot || undefined,
      ten: ten || undefined,
      hoTen: hoTen || undefined,
      gioiTinh: item.gioiTinh?.trim() || undefined,
      ngaySinh: item.ngaySinh?.trim() || undefined,
      soDienThoai: item.soDienThoai?.trim() || undefined,
      ghiChu: item.ghiChu?.trim() || undefined,
    });
  }
  return Array.from(map.values());
}

function appendNote(existingNote: string | null | undefined, extraNote: string): string {
  const trimmedExisting = (existingNote || '').trim();
  const trimmedExtra = extraNote.trim();
  if (!trimmedExtra) return trimmedExisting;
  if (!trimmedExisting) return trimmedExtra;
  return `${trimmedExisting} • ${trimmedExtra}`;
}

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

        const profileUpdates: {
          hoLot?: string;
          ten?: string;
          hoTen?: string;
          gioiTinh?: string;
          ngaySinh?: string;
          soDienThoai?: string;
        } = {};

        if (item.hoLot && !existing.hoLot) profileUpdates.hoLot = item.hoLot;
        if (item.ten && (!existing.ten || existing.ten === existing.maSV)) profileUpdates.ten = item.ten;
        if (item.hoTen && (!existing.hoTen || existing.hoTen === existing.maSV)) profileUpdates.hoTen = item.hoTen;
        if (item.gioiTinh && !existing.gioiTinh) profileUpdates.gioiTinh = item.gioiTinh;
        if (item.ngaySinh && !existing.ngaySinh) profileUpdates.ngaySinh = item.ngaySinh;
        if (item.soDienThoai && !existing.soDienThoai) profileUpdates.soDienThoai = item.soDienThoai;

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
