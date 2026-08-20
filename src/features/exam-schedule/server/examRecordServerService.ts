import { prisma } from '../../../lib/prisma';
import { ExamRecord } from '../types/exam.types';

export interface GetExamRecordsParams {
  batchCode?: string;
  classCode?: string;
  subjectCode?: string;
  date?: string;
  mapThi?: string;
  gioThi?: string;
  maSV?: string;
  search?: string;
  isPostponed?: boolean;
  page?: number;
  limit?: number;
  all?: boolean;
  sortKey?: string | null;
  sortDir?: 'asc' | 'desc';
}

export function formatExamRecord(r: any): ExamRecord {
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
    isPostponed: Boolean(r.isPostponed),
  };
}

export const examRecordService = {
  /**
   * Get distinct classes, subjects, and dates for filters
   */
  async getFilterMetadata(batchCode?: string) {
    const classesRaw = await prisma.student.findMany({
      where: { maLop: { not: null } },
      distinct: ['maLop'],
      select: { maLop: true },
    });
    const classes = classesRaw.map((r) => r.maLop!).sort();

    const batchFilter = batchCode && batchCode !== 'ALL' ? { batchCode } : {};

    const subjectsRaw = await prisma.examRecord.findMany({
      where: { ...batchFilter, maMH: { not: null }, tenMH: { not: null } },
      distinct: ['maMH'],
      select: { maMH: true, tenMH: true },
    });
    const subjects = subjectsRaw
      .map((r) => ({ code: r.maMH!, name: r.tenMH! }))
      .sort((a, b) => a.code.localeCompare(b.code));

    const datesRaw = await prisma.examRecord.findMany({
      where: { ...batchFilter, ngayThi: { not: null } },
      distinct: ['ngayThi'],
      select: { ngayThi: true },
    });
    const dates = datesRaw.map((r) => r.ngayThi!).sort((a, b) => {
      const [d1, m1, y1] = a.split('/').map(Number);
      const [d2, m2, y2] = b.split('/').map(Number);
      if (y1 !== y2) return (y1 || 0) - (y2 || 0);
      if (m1 !== m2) return (m1 || 0) - (m2 || 0);
      return (d1 || 0) - (d2 || 0);
    });

    return { classes, subjects, dates };
  },

  /**
   * Fetch exam records with filtering and pagination
   */
  async getExamRecords(params: GetExamRecordsParams) {
    const {
      batchCode,
      classCode,
      subjectCode,
      date,
      mapThi,
      gioThi,
      maSV,
      search,
      isPostponed,
      page = 1,
      limit = 50,
      all = false,
      sortKey,
      sortDir = 'asc',
    } = params;

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

    if (isPostponed !== undefined) {
      andConditions.push({ isPostponed });
    }

    const where: any = andConditions.length > 0 ? { AND: andConditions } : {};

    let orderBy: any[] = [{ ngayThi: 'asc' }, { gioThi: 'asc' }];
    if (sortKey === 'MaSV') {
      orderBy = [{ maSV: sortDir }];
    } else if (sortKey === 'Name') {
      orderBy = [{ student: { ten: sortDir } }, { student: { hoLot: sortDir } }];
    } else if (sortKey === 'MaLop') {
      orderBy = [{ student: { maLop: sortDir } }, { maLopMH: sortDir }];
    } else if (sortKey === 'MaMH') {
      orderBy = [{ tenMH: sortDir }, { maMH: sortDir }];
    } else if (sortKey === 'DateTime') {
      orderBy = [{ ngayThi: sortDir }, { gioThi: sortDir }];
    }

    if (all) {
      const records = await prisma.examRecord.findMany({
        where,
        include: { student: true },
        orderBy,
      });

      return {
        records: records.map(formatExamRecord),
        total: records.length,
      };
    }

    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      prisma.examRecord.findMany({
        where,
        include: { student: true },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.examRecord.count({ where }),
    ]);

    return {
      records: records.map(formatExamRecord),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Update postponement status
   */
  async updatePostponement(recordId: number, isPostponed: boolean) {
    return prisma.examRecord.update({
      where: { id: recordId },
      data: { isPostponed },
    });
  },
};
