import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classCode = searchParams.get('classCode');
    const username = searchParams.get('username')?.toUpperCase();

    if (!classCode) {
      return NextResponse.json({ error: 'Mã lớp (classCode) là bắt buộc' }, { status: 400 });
    }

    // 1. Get monitor (main) registration
    let mainReg = await prisma.courseRegistration.findFirst({
      where: { classCode, type: 'main' },
    });

    // Fallback: If no 'main' marked, find class monitor user
    if (!mainReg) {
      const monitorUser = await prisma.user.findFirst({
        where: {
          role: { contains: 'lop_truong' },
          student: { maLop: classCode },
        },
      });
      if (monitorUser) {
        mainReg = await prisma.courseRegistration.findFirst({
          where: { username: monitorUser.username.toUpperCase() },
        });
      }
    }

    // 2. Get all sub registrations in this class
    const allRegs = await prisma.courseRegistration.findMany({
      where: { classCode },
      orderBy: { username: 'asc' },
    });

    let mainData = null;
    if (mainReg) {
      try {
        const parsed = JSON.parse(mainReg.data);
        mainData = {
          username: mainReg.username,
          data: parsed.data ? parsed : { data: parsed },
          totalCourses: mainReg.totalCourses,
          totalCredits: mainReg.totalCredits,
          tuitionFee: mainReg.tuitionFee,
          lastPulledAt: mainReg.lastPulledAt?.toISOString() || null,
        };
      } catch (e) {}
    }

    const allSubAccounts: any[] = [];
    allRegs.forEach((reg) => {
      try {
        const parsed = JSON.parse(reg.data);
        allSubAccounts.push({
          username: reg.username,
          type: reg.type,
          data: parsed.data ? parsed : { data: parsed },
          totalCourses: reg.totalCourses,
          totalCredits: reg.totalCredits,
          tuitionFee: reg.tuitionFee,
          lastPulledAt: reg.lastPulledAt?.toISOString() || null,
        });
      } catch (e) {}
    });

    let userSubAccount = null;
    if (username) {
      userSubAccount =
        allSubAccounts.find(
          (acc: any) => (acc.username || '').toUpperCase() === username
        ) || (mainData?.username?.toUpperCase() === username ? mainData : null);
    }

    return NextResponse.json({
      main: mainData,
      subAccount: userSubAccount,
      allSubAccounts,
      hasData: !!(mainData || allSubAccounts.length > 0),
    });
  } catch (error: any) {
    console.error('Course compare API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
