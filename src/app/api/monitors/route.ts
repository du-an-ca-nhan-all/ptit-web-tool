import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { ensureDatabaseSeeded } from '@/src/lib/dbSeeder';
import { checkIsAdmin, checkIsMonitor } from '@/src/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded(false);

    const usersRaw = await prisma.user.findMany({
      include: {
        student: true,
      },
      orderBy: [{ student: { maLop: 'asc' } }, { username: 'asc' }],
    });

    const users = usersRaw.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      isAdmin: checkIsAdmin(u.role),
      isMonitor: checkIsMonitor(u.role),
      fullName: u.student?.hoTen || u.student?.ten || u.username,
      phoneNumber: u.student?.soDienThoai || null,
      lop: u.student?.maLop || null,
    }));

    const monitors = users.filter((u) => u.isMonitor);

    return NextResponse.json({ users, monitors });
  } catch (error: any) {
    console.error('Monitors API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
