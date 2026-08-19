import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { ensureDatabaseSeeded } from '@/src/lib/dbSeeder';
import { checkIsMonitor } from '@/src/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded(false);

    // 1. Distinct classes from Student table
    const classRecords = await prisma.student.findMany({
      where: { maLop: { not: null } },
      distinct: ['maLop'],
      select: { maLop: true },
    });

    const classNames = new Set(classRecords.map((r) => r.maLop!).filter(Boolean));

    // 2. Find monitors
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { role: { contains: 'lop_truong', mode: 'insensitive' } },
          { role: { contains: 'admin', mode: 'insensitive' } },
        ],
      },
      include: { student: true },
    });

    const monitorMap = new Map<string, any>();
    users.forEach((u) => {
      if (checkIsMonitor(u.role) && u.student?.maLop) {
        monitorMap.set(u.student.maLop, u);
      }
    });

    const sortedClasses = Array.from(classNames).sort();

    const classesWithInfo = sortedClasses.map((cls) => {
      const monitor = monitorMap.get(cls) || null;

      return {
        classCode: cls,
        monitorName: monitor?.student?.hoTen || monitor?.student?.ten || monitor?.username || null,
        monitorPhone: monitor?.student?.soDienThoai || null,
      };
    });

    return NextResponse.json({ classes: sortedClasses, details: classesWithInfo });
  } catch (error: any) {
    console.error('Classes API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
