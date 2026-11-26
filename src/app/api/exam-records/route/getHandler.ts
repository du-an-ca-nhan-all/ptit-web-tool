import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { enrichWithRoomClassStats } from './roomStatsService';
import {
  buildExamRecordOrderBy,
  buildExamRecordWhere,
  compareVietnameseDateStrings,
  formatExamRecord,
} from './utils';

async function fetchDistinctExamMetadata(batchCode?: string) {
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
  const dates = datesRaw.map((r) => r.ngayThi!).sort(compareVietnameseDateStrings);

  return { classes, subjects, dates };
}

export async function handleGetExamRecords(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';
    const batchCode = searchParams.get('batchCode') || undefined;
    const includeClassmatesCount = searchParams.get('includeClassmatesCount') === 'true';
    const distinct = searchParams.get('distinct');

    // Distinct filter metadata
    if (distinct) {
      const metadata = await fetchDistinctExamMetadata(batchCode);
      return NextResponse.json(metadata);
    }

    const where = buildExamRecordWhere(searchParams);
    const orderBy = buildExamRecordOrderBy(searchParams);

    if (all) {
      const records = await prisma.examRecord.findMany({
        where,
        include: {
          student: true,
        },
        orderBy,
      });

      const formatted = await enrichWithRoomClassStats(
        records.map(formatExamRecord),
        includeClassmatesCount
      );

      return NextResponse.json({
        records: formatted,
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
        orderBy,
      }),
      prisma.examRecord.count({ where }),
    ]);

    const formatted = await enrichWithRoomClassStats(
      records.map(formatExamRecord),
      includeClassmatesCount
    );

    return NextResponse.json({
      records: formatted,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Exam records API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
