import { NextRequest, NextResponse } from 'next/server';
import { ensureDatabaseSeeded } from '@/src/lib/dbSeeder';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    const studentCount = await prisma.student.count();
    const userCount = await prisma.user.count();
    const examCount = await prisma.examRecord.count();
    const meta = await prisma.systemMeta.findUnique({ where: { key: 'initial_seeded' } });

    return NextResponse.json({
      initialized: !!meta,
      lastSeeded: meta?.value || null,
      stats: {
        students: studentCount,
        users: userCount,
        examRecords: examCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const force = body.force === true;

    const result = await ensureDatabaseSeeded(force);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
