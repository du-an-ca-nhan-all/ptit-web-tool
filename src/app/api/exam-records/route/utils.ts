import type { FormattedExamRecord, PatchPostponedPayload } from './types';

export function compareVietnameseDateStrings(a: string, b: string): number {
  const [d1, m1, y1] = a.split('/').map(Number);
  const [d2, m2, y2] = b.split('/').map(Number);
  if (y1 !== y2) return (y1 || 0) - (y2 || 0);
  if (m1 !== m2) return (m1 || 0) - (m2 || 0);
  return (d1 || 0) - (d2 || 0);
}

export function buildExamRecordWhere(searchParams: URLSearchParams): any {
  const batchCode = searchParams.get('batchCode') || undefined;
  const classCode =
    searchParams.get('classCode') ||
    searchParams.get('monitorClass') ||
    searchParams.get('maLop') ||
    undefined;
  const subjectCode = searchParams.get('subjectCode') || undefined;
  const date = searchParams.get('date') || undefined;
  const mapThi = searchParams.get('mapThi') || undefined;
  const gioThi = searchParams.get('gioThi') || undefined;
  const maSV = searchParams.get('maSV') || undefined;
  const search = searchParams.get('search') || undefined;

  const andConditions: any[] = [];
  if (batchCode && batchCode !== 'ALL') {
    andConditions.push({ batchCode });
  }
  if (classCode && classCode !== 'ALL') {
    andConditions.push({
      OR: [
        { student: { maLop: { equals: classCode, mode: 'insensitive' } } },
        { maLopMH: { equals: classCode, mode: 'insensitive' } },
      ],
    });
  }
  if (subjectCode) {
    andConditions.push({ maMH: subjectCode });
  }
  if (date) {
    andConditions.push({ ngayThi: date });
  }
  if (mapThi) {
    andConditions.push({ mapThi });
  }
  if (gioThi) {
    andConditions.push({ gioThi });
  }
  if (maSV) {
    andConditions.push({ maSV: { equals: maSV.toUpperCase(), mode: 'insensitive' } });
  }

  if (search) {
    const q = search.trim();
    andConditions.push({
      OR: [
        { maSV: { contains: q, mode: 'insensitive' } },
        { tenMH: { contains: q, mode: 'insensitive' } },
        { maMH: { contains: q, mode: 'insensitive' } },
        { mapThi: { contains: q, mode: 'insensitive' } },
        { student: { ten: { contains: q, mode: 'insensitive' } } },
        { student: { hoLot: { contains: q, mode: 'insensitive' } } },
        { student: { hoTen: { contains: q, mode: 'insensitive' } } },
      ],
    });
  }

  if (searchParams.get('isPostponed') !== null && searchParams.get('isPostponed') !== '') {
    andConditions.push({ isPostponed: searchParams.get('isPostponed') === 'true' });
  }

  return andConditions.length > 0 ? { AND: andConditions } : {};
}

export function buildExamRecordOrderBy(searchParams: URLSearchParams): any[] {
  const sortKey = searchParams.get('sortKey');
  const sortDir = (searchParams.get('sortDir') || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

  if (sortKey === 'MaSV') {
    return [{ maSV: sortDir }];
  }
  if (sortKey === 'Name') {
    return [{ student: { ten: sortDir } }, { student: { hoLot: sortDir } }];
  }
  if (sortKey === 'MaLop') {
    return [{ student: { maLop: sortDir } }, { maLopMH: sortDir }];
  }
  if (sortKey === 'MaMH') {
    return [{ tenMH: sortDir }, { maMH: sortDir }];
  }
  if (sortKey === 'DateTime') {
    return [{ ngayThi: sortDir }, { gioThi: sortDir }];
  }

  return [{ ngayThi: 'asc' }, { gioThi: 'asc' }];
}

export function formatExamRecord(r: any): FormattedExamRecord {
  return {
    id: r.id,
    MaSV: r.maSV,
    HoLotSV: r.student?.hoLot || '',
    TenSV: r.student?.ten || '',
    PHAI: r.student?.gioiTinh || 'Nam',
    NgaySinhC: r.student?.ngaySinh || '',
    NhomThi: r.nhomThi || '',
    MAPTHI: r.mapThi || '',
    MaMH: r.maMH || '',
    TenMH: r.tenMH || '',
    MaHTThi: r.maHTThi || '',
    NhomHoc: r.nhomHoc || '',
    'To thi': r.toThi || '',
    ToThi: r.toThi || '',
    MaLop: r.student?.maLop || r.maLopMH || '',
    NgayThi: r.ngayThi || '',
    GioThi: r.gioThi || '',
    SoPhutThi: r.soPhutThi || '',
    MaDotThi: r.maDotThi || r.batchCode || '',
    TenDotThi: r.tenDotThi || '',
    batchCode: r.batchCode || '',
    studentStatus: r.student?.trangThai || 'DANG_HOC',
    isPostponed: Boolean(r.isPostponed),
  };
}

export function makeRoomKey(b: string, mh: string, dt: string, tm: string, rm: string): string {
  return `${b}|${mh}|${dt}|${tm}|${rm}`;
}

export function sortMembersByName(
  a: { ten: string; hoTen: string; maSV: string },
  b: { ten: string; hoTen: string; maSV: string }
): number {
  const tCmp = a.ten.localeCompare(b.ten, 'vi');
  if (tCmp !== 0) return tCmp;
  const hCmp = a.hoTen.localeCompare(b.hoTen, 'vi');
  if (hCmp !== 0) return hCmp;
  return a.maSV.localeCompare(b.maSV);
}

export function parsePostponedBoolean(rawIsPostponed: unknown): boolean | null {
  if (typeof rawIsPostponed === 'boolean') {
    return rawIsPostponed;
  }
  if (rawIsPostponed === 'true' || rawIsPostponed === 1 || rawIsPostponed === '1') {
    return true;
  }
  if (rawIsPostponed === 'false' || rawIsPostponed === 0 || rawIsPostponed === '0') {
    return false;
  }
  return null;
}

export function parsePatchPayload(body: Record<string, any>): PatchPostponedPayload {
  const rawId = body.id ?? body.Id ?? body.ID;
  const rawIds = body.ids ?? body.Ids ?? body.IDS;
  const rawIsPostponed = body.isPostponed ?? body.IsPostponed ?? body.is_postponed;
  const rawMaSV = body.maSV ?? body.MaSV ?? body.MASV ?? body.studentId;
  const rawMaMH = body.maMH ?? body.MaMH ?? body.MAMH ?? body.subjectCode;
  const rawMapThi = body.mapThi ?? body.MAPTHI ?? body.MapThi ?? body.room;
  const rawNgayThi = body.ngayThi ?? body.NgayThi ?? body.NGAYTHI ?? body.date;
  const rawGioThi = body.gioThi ?? body.GioThi ?? body.GIOTHI ?? body.time;

  return {
    rawId,
    rawIds,
    rawIsPostponed,
    cleanMaSV: rawMaSV ? String(rawMaSV).trim().toUpperCase() : '',
    cleanMaMH: rawMaMH ? String(rawMaMH).trim() : '',
    cleanMapThi: rawMapThi ? String(rawMapThi).trim() : '',
    cleanNgayThi: rawNgayThi ? String(rawNgayThi).trim() : '',
    cleanGioThi: rawGioThi ? String(rawGioThi).trim() : '',
  };
}
