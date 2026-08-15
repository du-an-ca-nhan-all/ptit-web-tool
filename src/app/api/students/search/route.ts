import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { ensureDatabaseSeeded } from '@/src/lib/dbSeeder';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded(false);

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!q) {
      return NextResponse.json({ students: [] });
    }

    const studentsRaw = await prisma.student.findMany({
      where: {
        OR: [
          { maSV: { contains: q.toUpperCase() } },
          { ten: { contains: q } },
          { hoLot: { contains: q } },
          { hoTen: { contains: q } },
          { maLop: { contains: q } },
        ],
      },
      include: {
        examRecords: {
          select: { id: true },
        },
      },
      take: limit,
      orderBy: [{ ten: 'asc' }, { hoLot: 'asc' }],
    });

    const students = studentsRaw.map((s) => ({
      maSV: s.maSV,
      hoLot: s.hoLot || '',
      ten: s.ten || '',
      hoTen: s.hoTen || `${s.hoLot || ''} ${s.ten || ''}`.trim(),
      gioiTinh: s.gioiTinh || 'Nam',
      ngaySinh: s.ngaySinh || '',
      maLop: s.maLop || 'Chưa phân lớp',
      soDienThoai: s.soDienThoai || '',
      ghiChu: s.ghiChu || '',
      examCount: s.examRecords.length,
    }));

    return NextResponse.json({ students, total: students.length });
  } catch (error: any) {
    console.error('Students search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
