import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import {
  getAuthUser,
  mapAvailableSemesters,
  parseRegistrationData,
  resolveSelectedSemesterCourses,
} from './helpers';

// GET /api/course-registrations
// Returns registered courses for a student or class (supports multi-semester & past semesters)
export async function handleGetCourseRegistrations(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để xem thông tin' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUsername = (searchParams.get('username') || authUser.username).toUpperCase();
    const classCode = searchParams.get('classCode') || authUser.lop || '';
    const requestedSemester = searchParams.get('semester') || searchParams.get('hocKy') || '';

    // Check permissions if requesting another student's data
    if (targetUsername !== authUser.username.toUpperCase() && !authUser.isAdmin && !authUser.isMonitor) {
      return NextResponse.json({ error: 'Bạn không có quyền xem thông tin của sinh viên khác' }, { status: 403 });
    }

    // Get registration record from database
    const registration = await prisma.courseRegistration.findFirst({
      where: {
        username: targetUsername,
        ...(classCode ? { classCode } : {}),
      },
    });

    // Check external account status
    const extAccount = await prisma.externalAccount.findFirst({
      where: {
        username: targetUsername,
        systemKey: 'QLDTTX_PTTC1',
      },
    });

    const { parsedData, currentCoursesList, semestersList, allCoursesList } = parseRegistrationData(
      registration?.data
    );

    // Build available semesters metadata for the dropdown
    const availableSemesters = mapAvailableSemesters(semestersList);

    const {
      coursesList,
      totalCourses,
      totalCredits,
      tuitionFee,
      selectedSemester,
      selectedSemesterName,
    } = resolveSelectedSemesterCourses({
      requestedSemester,
      currentCoursesList,
      semestersList,
      allCoursesList,
      registration,
    });

    return NextResponse.json({
      success: true,
      username: targetUsername,
      classCode: registration?.classCode || classCode,
      hasRegistration: !!registration,
      totalCourses,
      totalCredits,
      tuitionFee,
      lastPulledAt: registration?.lastPulledAt?.toISOString() || registration?.updatedAt?.toISOString() || null,
      courses: coursesList,
      semesters: availableSemesters,
      selectedSemester,
      selectedSemesterName,
      rawResponse: parsedData,
      externalAccount: {
        isConfigured: !!extAccount,
        status: extAccount?.status || 'DISCONNECTED',
        hasToken: !!extAccount?.token,
        lastSyncAt: extAccount?.lastSyncAt?.toISOString() || null,
      },
    });
  } catch (error: any) {
    console.error('Get course registrations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
