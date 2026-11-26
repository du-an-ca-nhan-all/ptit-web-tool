import type { ImportClassMemberRow, ParseClassMembersResult } from './types';
import {
  MA_SV_REGEX,
  detectHeaderMapping,
  normalizeGender,
  normalizeHeader,
  splitVietnameseFullName,
} from './normalize';

export function parseRows(rawRows: unknown[][]): ParseClassMembersResult {
  const rows = rawRows
    .map((r) => (Array.isArray(r) ? r.map((c) => String(c ?? '').trim()) : []))
    .filter((r) => r.some((cell) => cell.length > 0));

  if (rows.length === 0) {
    return { items: [], duplicateCount: 0, skippedCount: 0, error: 'Không có dữ liệu hợp lệ để phân tích.' };
  }

  const headerMap = detectHeaderMapping(rows[0]);
  const startIndex = headerMap ? 1 : 0;

  const items: ImportClassMemberRow[] = [];
  const seen = new Set<string>();
  let duplicateCount = 0;
  let skippedCount = 0;

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => !c)) continue;

    let maSV = '';
    let hoLot = '';
    let ten = '';
    let hoTen = '';
    let gioiTinh: string | undefined;
    let ngaySinh = '';
    let soDienThoai = '';
    let ghiChu = '';

    if (headerMap) {
      maSV = (row[headerMap.maSV] || '').trim().toUpperCase();
      hoLot = headerMap.hoLot >= 0 ? (row[headerMap.hoLot] || '').trim() : '';
      ten = headerMap.ten >= 0 ? (row[headerMap.ten] || '').trim() : '';
      hoTen = headerMap.hoTen >= 0 ? (row[headerMap.hoTen] || '').trim() : '';
      gioiTinh = headerMap.gioiTinh >= 0 ? normalizeGender(row[headerMap.gioiTinh]) : undefined;
      ngaySinh = headerMap.ngaySinh >= 0 ? (row[headerMap.ngaySinh] || '').trim() : '';
      soDienThoai = headerMap.soDienThoai >= 0 ? (row[headerMap.soDienThoai] || '').trim() : '';
      ghiChu = headerMap.ghiChu >= 0 ? (row[headerMap.ghiChu] || '').trim() : '';
    } else {
      // Headerless heuristic: check if col 0 is numeric STT and col 1 is MaSV
      let offset = 0;
      if (row.length >= 2 && /^\d+$/.test(row[0]) && MA_SV_REGEX.test(row[1])) {
        offset = 1;
      }

      maSV = (row[offset] || '').trim().toUpperCase();
      const remaining = row.slice(offset + 1);

      if (remaining.length === 1) {
        hoTen = remaining[0];
      } else if (remaining.length >= 2) {
        // Check if remaining[0] & remaining[1] look like HoLot + Ten (common PTIT format)
        // vs HoTen + Gender/DOB
        const secondNorm = normalizeHeader(remaining[1]);
        const isSecondGenderOrDate =
          secondNorm === 'nam' ||
          secondNorm === 'nu' ||
          /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(remaining[1]);

        if (isSecondGenderOrDate) {
          hoTen = remaining[0];
          if (secondNorm === 'nam' || secondNorm === 'nu') {
            gioiTinh = normalizeGender(remaining[1]);
            ngaySinh = remaining[2] || '';
            soDienThoai = remaining[3] || '';
            ghiChu = remaining[4] || '';
          } else {
            ngaySinh = remaining[1];
            soDienThoai = remaining[2] || '';
            ghiChu = remaining[3] || '';
          }
        } else {
          hoLot = remaining[0];
          ten = remaining[1];
          gioiTinh = normalizeGender(remaining[2]);
          ngaySinh = remaining[3] || '';
          soDienThoai = remaining[4] || '';
          ghiChu = remaining[5] || '';
        }
      }
    }

    if (!maSV || !MA_SV_REGEX.test(maSV)) {
      skippedCount++;
      continue;
    }

    if (seen.has(maSV)) {
      duplicateCount++;
      continue;
    }
    seen.add(maSV);

    if (hoTen && (!hoLot || !ten)) {
      const split = splitVietnameseFullName(hoTen);
      hoLot = hoLot || split.hoLot;
      ten = ten || split.ten;
      hoTen = split.hoTen;
    } else if (!hoTen && (hoLot || ten)) {
      hoTen = `${hoLot} ${ten}`.trim();
    }

    items.push({
      maSV,
      hoLot: hoLot || undefined,
      ten: ten || undefined,
      hoTen: hoTen || undefined,
      gioiTinh,
      ngaySinh: ngaySinh || undefined,
      soDienThoai: soDienThoai || undefined,
      ghiChu: ghiChu || undefined,
    });
  }

  if (items.length === 0) {
    return {
      items: [],
      duplicateCount,
      skippedCount,
      error: 'Không tìm thấy Mã SV hợp lệ nào (ví dụ: B21DCCN001, D25TXCN001...).',
    };
  }

  return { items, duplicateCount, skippedCount };
}
