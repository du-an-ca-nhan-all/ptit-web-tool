import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { ensureDatabaseSeeded } from '@/src/lib/dbSeeder';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded(false);

    const { searchParams } = new URL(req.url);
    const classCode = searchParams.get('classCode');
    const username = searchParams.get('username')?.toLowerCase();

    if (!classCode) {
      return NextResponse.json({ error: 'Mã lớp (classCode) là bắt buộc' }, { status: 400 });
    }

    const mainReg = await prisma.courseRegistration.findFirst({
      where: { classCode, type: 'main' },
    });

    const subRegs = await prisma.courseRegistration.findMany({
      where: { classCode, type: 'sub' },
    });

    let mainData = null;
    if (mainReg) {
      try {
        mainData = JSON.parse(mainReg.data);
      } catch (e) {}
    }

    const allSubAccounts: any[] = [];
    subRegs.forEach((sub) => {
      try {
        allSubAccounts.push(JSON.parse(sub.data));
      } catch (e) {}
    });

    let userSubAccount = null;
    if (username) {
      userSubAccount =
        allSubAccounts.find(
          (acc: any) => (acc.username || '').toLowerCase() === username
        ) || null;
    }

    return NextResponse.json({
      main: mainData,
      subAccount: userSubAccount,
      allSubAccounts,
      hasData: !!(mainData && allSubAccounts.length > 0),
    });
  } catch (error: any) {
    console.error('Course compare API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
