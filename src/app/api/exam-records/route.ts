import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { ensureDatabaseSeeded } from '@/src/lib/dbSeeder';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded(false);

    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';
    const batchCode = searchParams.get('batchCode') || undefined;
    const classCode = searchParams.get('classCode') || undefined;
    const subjectCode = searchParams.get('subjectCode') || undefined;
    const date = searchParams.get('date') || undefined;
    const maSV = searchParams.get('maSV') || undefined;
    const search = searchParams.get('search') || undefined;
    const distinct = searchParams.get('distinct');

    // Distinct filter metadata
    if (distinct) {
      const classesRaw = await prisma.student.findMany({
        where: { maLop: { not: null } },
        distinct: ['maLop'],
        select: { maLop: true },
      });
      const classes = classesRaw.map((r) => r.maLop!).sort();

      const batchFilter = batchCode ? { batchCode } : {};

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

      return NextResponse.json({ classes, subjects, dates });
    }

    const where: any = {};
    if (batchCode) where.batchCode = batchCode;
    if (classCode) where.student = { maLop: classCode };
    if (subjectCode) where.maMH = subjectCode;
    if (date) where.ngayThi = date;
    if (maSV) where.maSV = maSV.toUpperCase();

    if (search) {
      const q = search.trim();
      where.OR = [
        { maSV: { contains: q } },
        { tenMH: { contains: q } },
        { maMH: { contains: q } },
        { mapThi: { contains: q } },
        { student: { ten: { contains: q } } },
        { student: { hoLot: { contains: q } } },
        { student: { hoTen: { contains: q } } },
      ];
    }

    const formatRecord = (r: any) => ({
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
    });

    if (all) {
      const records = await prisma.examRecord.findMany({
        where,
        include: {
          student: true,
        },
        orderBy: [{ ngayThi: 'asc' }, { gioThi: 'asc' }],
      });

      return NextResponse.json({
        records: records.map(formatRecord),
        total: records.length,
      });
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.examRecord.findMany({
        where,
        include: {
          student: true,
        },
        skip,
        take: limit,
        orderBy: [{ ngayThi: 'asc' }, { gioThi: 'asc' }],
      }),
      prisma.examRecord.count({ where }),
    ]);

    return NextResponse.json({
      records: records.map(formatRecord),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Exam records API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
