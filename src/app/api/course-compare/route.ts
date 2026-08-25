import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classCode = searchParams.get('classCode');
    const username = searchParams.get('username')?.toUpperCase();
    const requestedSemester = searchParams.get('semester') || searchParams.get('hocKy') || '';

    if (!classCode) {
      return NextResponse.json({ error: 'Mã lớp (classCode) là bắt buộc' }, { status: 400 });
    }

    // 1. Find class monitor user dynamically from User/Student role
    let monitorUser = await prisma.user.findFirst({
      where: {
        role: { contains: 'lop_truong', mode: 'insensitive' },
        student: { maLop: classCode },
      },
    });

    // Fallback if class not linked in student profile
    if (!monitorUser) {
      monitorUser = await prisma.user.findFirst({
        where: { role: { contains: 'lop_truong', mode: 'insensitive' } },
      });
    }

    // Get monitor registration
    let mainReg = null;
    if (monitorUser) {
      mainReg = await prisma.courseRegistration.findFirst({
        where: {
          username: monitorUser.username.toUpperCase(),
        },
      });
    }

    // 2. Get all registrations in this class
    const allRegs = await prisma.courseRegistration.findMany({
      where: { classCode },
      orderBy: { username: 'asc' },
    });

    let mainData: any = null;
    const allAvailableSemestersMap = new Map<string, any>();

    if (mainReg) {
      try {
        const parsed = JSON.parse(mainReg.data);
        if (Array.isArray(parsed.semesters)) {
          parsed.semesters.forEach((s: any) => {
            if (!allAvailableSemestersMap.has(String(s.hoc_ky))) {
              allAvailableSemestersMap.set(String(s.hoc_ky), {
                hoc_ky: s.hoc_ky,
                ten_hoc_ky: s.ten_hoc_ky,
                totalCourses: s.totalCourses,
                totalCredits: s.totalCredits,
              });
            }
          });
        }
        mainData = {
          username: mainReg.username,
          data: parsed.data ? parsed : { data: parsed },
          semesters: parsed.semesters || [],
          allCourses: parsed.allCourses || [],
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
        const isMonitor = monitorUser?.username?.toUpperCase() === reg.username?.toUpperCase();

        if (Array.isArray(parsed.semesters)) {
          parsed.semesters.forEach((s: any) => {
            if (!allAvailableSemestersMap.has(String(s.hoc_ky))) {
              allAvailableSemestersMap.set(String(s.hoc_ky), {
                hoc_ky: s.hoc_ky,
                ten_hoc_ky: s.ten_hoc_ky,
                totalCourses: s.totalCourses,
                totalCredits: s.totalCredits,
              });
            }
          });
        }

        allSubAccounts.push({
          username: reg.username,
          isMonitor,
          data: parsed.data ? parsed : { data: parsed },
          semesters: parsed.semesters || [],
          allCourses: parsed.allCourses || [],
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

    const availableSemesters = Array.from(allAvailableSemestersMap.values());

    return NextResponse.json({
      success: true,
      main: mainData,
      subAccount: userSubAccount,
      allSubAccounts,
      semesters: availableSemesters,
      selectedSemester: requestedSemester || 'CURRENT',
      hasData: !!(mainData || allSubAccounts.length > 0),
    });
  } catch (error: any) {
    console.error('Course compare API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

