import { splitVietnameseFullName, type ImportClassMemberRow } from '../../utils/classMemberImportParser';
import type { StudentProfileUpdates } from './types';

export function normalizeImportItems(items: ImportClassMemberRow[]): ImportClassMemberRow[] {
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

export function appendNote(existingNote: string | null | undefined, extraNote: string): string {
  const trimmedExisting = (existingNote || '').trim();
  const trimmedExtra = extraNote.trim();
  if (!trimmedExtra) return trimmedExisting;
  if (!trimmedExisting) return trimmedExtra;
  return `${trimmedExisting} • ${trimmedExtra}`;
}

export function buildProfileUpdates(
  item: ImportClassMemberRow,
  existing: {
    maSV: string;
    hoLot?: string | null;
    ten?: string | null;
    hoTen?: string | null;
    gioiTinh?: string | null;
    ngaySinh?: string | null;
    soDienThoai?: string | null;
  }
): StudentProfileUpdates {
  const profileUpdates: StudentProfileUpdates = {};

  if (item.hoLot && !existing.hoLot) profileUpdates.hoLot = item.hoLot;
  if (item.ten && (!existing.ten || existing.ten === existing.maSV)) profileUpdates.ten = item.ten;
  if (item.hoTen && (!existing.hoTen || existing.hoTen === existing.maSV)) profileUpdates.hoTen = item.hoTen;
  if (item.gioiTinh && !existing.gioiTinh) profileUpdates.gioiTinh = item.gioiTinh;
  if (item.ngaySinh && !existing.ngaySinh) profileUpdates.ngaySinh = item.ngaySinh;
  if (item.soDienThoai && !existing.soDienThoai) profileUpdates.soDienThoai = item.soDienThoai;

  return profileUpdates;
}
