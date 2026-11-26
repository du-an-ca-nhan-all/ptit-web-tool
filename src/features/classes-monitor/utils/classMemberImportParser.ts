import Papa from 'papaparse';

export interface ImportClassMemberRow {
  maSV: string;
  hoLot?: string;
  ten?: string;
  hoTen?: string;
  gioiTinh?: string;
  ngaySinh?: string;
  soDienThoai?: string;
  ghiChu?: string;
}

export interface ParseClassMembersResult {
  items: ImportClassMemberRow[];
  duplicateCount: number;
  skippedCount: number;
  error?: string;
}

const MA_SV_REGEX = /^[A-Z][A-Z0-9_-]{4,19}$/i;

function normalizeHeader(value: string): string {
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

function normalizeGender(raw?: string): string | undefined {
  if (!raw) return undefined;
  const val = normalizeHeader(raw);
  if (!val) return undefined;
  if (val === 'nu' || val === 'female' || val === 'f' || val === '0') return 'Nữ';
  if (val === 'nam' || val === 'male' || val === 'm' || val === '1') return 'Nam';
  return String(raw).trim();
}

interface ColumnMapping {
  maSV: number;
  hoLot: number;
  ten: number;
  hoTen: number;
  gioiTinh: number;
  ngaySinh: number;
  soDienThoai: number;
  ghiChu: number;
}

function detectHeaderMapping(firstRow: string[]): ColumnMapping | null {
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

function parseRows(rawRows: unknown[][]): ParseClassMembersResult {
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

export function parseClassMembersText(text: string): ParseClassMembersResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { items: [], duplicateCount: 0, skippedCount: 0 };
  }

  const parsed = Papa.parse(trimmed, { skipEmptyLines: true });
  const rawRows = (parsed.data as unknown[][]) || [];

  const expandedRows: unknown[][] = [];
  rawRows.forEach((row) => {
    if (row.length === 1 && typeof row[0] === 'string') {
      const cell = row[0].trim();
      if (cell.includes(',') || cell.includes(';') || cell.includes('\t')) {
        const parts = cell
          .split(/[,;\t]/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (parts.length > 1 && parts.every((p) => MA_SV_REGEX.test(p))) {
          parts.forEach((id) => expandedRows.push([id]));
          return;
        }
        expandedRows.push(parts);
        return;
      }
      expandedRows.push([cell]);
      return;
    }
    expandedRows.push(row);
  });

  return parseRows(expandedRows);
}

export function parseClassMembersFile(file: File): Promise<ParseClassMembersResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors?.length > 0 && (!results.data || results.data.length === 0)) {
          resolve({
            items: [],
            duplicateCount: 0,
            skippedCount: 0,
            error: 'Không thể đọc file CSV. Vui lòng kiểm tra lại định dạng file.',
          });
          return;
        }
        resolve(parseRows(results.data as unknown[][]));
      },
      error: (err) => {
        resolve({
          items: [],
          duplicateCount: 0,
          skippedCount: 0,
          error: `Lỗi đọc file: ${err.message}`,
        });
      },
    });
  });
}

export function downloadClassMembersSampleCsv(
  classCode: string,
  sampleStudents: Array<{
    MaSV: string;
    HoLotSV?: string;
    TenSV?: string;
    PHAI?: string;
    NgaySinhC?: string;
    phone?: string;
    note?: string;
  }>
) {
  const headers = ['STT', 'Mã SV', 'Họ lót', 'Tên', 'Giới tính', 'Ngày sinh', 'SĐT', 'Ghi chú'];
  const rows =
    sampleStudents.length > 0
      ? sampleStudents.slice(0, 5).map((s, idx) => [
          idx + 1,
          s.MaSV,
          s.HoLotSV || '',
          s.TenSV || '',
          s.PHAI || 'Nam',
          s.NgaySinhC || '',
          s.phone || '',
          s.note || '',
        ])
      : [
          [1, 'B21DCCN001', 'Nguyễn Văn', 'An', 'Nam', '01/01/2003', '0912345678', ''],
          [2, 'B21DCCN002', 'Trần Thị', 'Bình', 'Nữ', '15/05/2003', '0987654321', ''],
          [3, 'B21DCCN003', 'Lê Minh', 'Cường', 'Nam', '20/10/2003', '', ''],
        ];

  const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Mau_Import_ThanhVien_Lop_${classCode}.csv`;
  link.click();
}
