import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { ensureDatabaseSeeded } from '@/src/lib/dbSeeder';

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

    // 2. Add classes from ClassConfig
    const configs = await prisma.classConfig.findMany();
    configs.forEach((c) => classNames.add(c.classCode));

    // 3. Find monitors
    const monitors = await prisma.user.findMany({
      where: { role: 'lop_truong' },
      include: { student: true },
    });

    const monitorMap = new Map<string, any>();
    monitors.forEach((m) => {
      if (m.student?.maLop) {
        monitorMap.set(m.student.maLop, m);
      }
    });

    const sortedClasses = Array.from(classNames).sort();

    const classesWithInfo = sortedClasses.map((cls) => {
      const monitor = monitorMap.get(cls) || null;
      const config = configs.find((c) => c.classCode === cls) || null;

      return {
        classCode: cls,
        monitorName: monitor?.student?.hoTen || monitor?.student?.ten || monitor?.username || null,
        monitorPhone: monitor?.student?.soDienThoai || config?.monitorPhone || null,
      };
    });

    return NextResponse.json({ classes: sortedClasses, details: classesWithInfo });
  } catch (error: any) {
    console.error('Classes API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
