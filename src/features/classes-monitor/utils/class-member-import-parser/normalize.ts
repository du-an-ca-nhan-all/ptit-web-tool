import type { ColumnMapping } from './types';

export const MA_SV_REGEX = /^[A-Z][A-Z0-9_-]{4,19}$/i;

export function normalizeHeader(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function splitVietnameseFullName(fullName?: string): { hoLot: string; ten: string; hoTen: string } {
  const clean = String(fullName || '').trim().replace(/\s+/g, ' ');
  if (!clean) return { hoLot: '', ten: '', hoTen: '' };
  const parts = clean.split(' ');
  if (parts.length === 1) {
    return { hoLot: '', ten: parts[0], hoTen: clean };
  }
  const ten = parts[parts.length - 1];
  const hoLot = parts.slice(0, -1).join(' ');
  return { hoLot, ten, hoTen: clean };
}

export function normalizeGender(raw?: string): string | undefined {
  if (!raw) return undefined;
  const val = normalizeHeader(raw);
  if (!val) return undefined;
  if (val === 'nu' || val === 'female' || val === 'f' || val === '0') return 'Nữ';
  if (val === 'nam' || val === 'male' || val === 'm' || val === '1') return 'Nam';
  return String(raw).trim();
}

export function detectHeaderMapping(firstRow: string[]): ColumnMapping | null {
  const normalized = firstRow.map(normalizeHeader);
  const mapping: ColumnMapping = {
    maSV: -1,
    hoLot: -1,
    ten: -1,
    hoTen: -1,
    gioiTinh: -1,
    ngaySinh: -1,
    soDienThoai: -1,
    ghiChu: -1,
  };

  normalized.forEach((col, idx) => {
    if (!col) return;
    if (
      mapping.maSV === -1 &&
      (col === 'ma sv' ||
        col === 'masv' ||
        col === 'mssv' ||
        col === 'ma sinh vien' ||
        col === 'student id' ||
        col === 'student code')
    ) {
      mapping.maSV = idx;
    } else if (mapping.hoLot === -1 && (col === 'ho lot' || col === 'ho dem' || col === 'ho va ten dem' || col === 'ho')) {
      mapping.hoLot = idx;
    } else if (mapping.ten === -1 && (col === 'ten' || col === 'ten sv')) {
      mapping.ten = idx;
    } else if (mapping.hoTen === -1 && (col === 'ho ten' || col === 'ho va ten' || col === 'full name' || col === 'fullname')) {
      mapping.hoTen = idx;
    } else if (mapping.gioiTinh === -1 && (col === 'gioi tinh' || col === 'phai' || col === 'gender')) {
      mapping.gioiTinh = idx;
    } else if (mapping.ngaySinh === -1 && (col === 'ngay sinh' || col === 'dob' || col === 'birthday' || col === 'ngaysinh')) {
      mapping.ngaySinh = idx;
    } else if (
      mapping.soDienThoai === -1 &&
      (col === 'sdt' || col === 'so dien thoai' || col === 'dien thoai' || col === 'phone')
    ) {
      mapping.soDienThoai = idx;
    } else if (mapping.ghiChu === -1 && (col === 'ghi chu' || col === 'note' || col === 'notes')) {
      mapping.ghiChu = idx;
    }
  });

  if (mapping.maSV !== -1) return mapping;
  return null;
}
