import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { AuthUser } from '@/src/lib/auth';
import { fetchAllSemestersCoursesFromQLDTTX } from '@/src/features/external-portal/server/qldttxServerService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { buildRegistrationStoragePayload } from './helpers';

export interface SinglePullCourseRegistrationsParams {
  req: NextRequest;
  authUser: AuthUser;
  effectiveUsername: string;
  reqClassCode?: string;
}

// ACTION: SINGLE PULL (Pull for one student: current registration + all past semesters)
export async function handleSinglePullCourseRegistrations({
  req,
  authUser,
  effectiveUsername,
  reqClassCode,
}: SinglePullCourseRegistrationsParams) {
  const extAccount = await prisma.externalAccount.findFirst({
    where: {
      username: effectiveUsername,
      systemKey: 'QLDTTX_PTTC1',
    },
  });

  if (!extAccount) {
    return NextResponse.json(
      {
        error: `Sinh viên ${effectiveUsername} chưa liên kết tài khoản cổng QLĐT Từ Xa. Vui lòng vào mục Hồ Sơ -> Liên Kết QLĐT để cấu hình trước.`,
      },
      { status: 400 }
    );
  }

  // Get student record to determine classCode
  const student = await prisma.student.findUnique({
    where: { maSV: effectiveUsername },
  });
  const finalClassCode = reqClassCode || student?.maLop || authUser.lop || 'CHUA_PHAN_LOP';

  // Fetch all semesters + current registration from QLDTTX
  const fetchedResult = await fetchAllSemestersCoursesFromQLDTTX({
    username: extAccount.extUsername,
    password: extAccount.extPassword,
    token: extAccount.token,
  });

  // Structure storage payload
  const storagePayload = buildRegistrationStoragePayload(fetchedResult);

  // Upsert into CourseRegistration
  const saved = await prisma.courseRegistration.upsert({
    where: {
      classCode_username: {
        classCode: finalClassCode,
        username: effectiveUsername,
      },
    },
    create: {
      classCode: finalClassCode,
      username: effectiveUsername,
      data: JSON.stringify(storagePayload),
      totalCourses: fetchedResult.totalCourses,
      totalCredits: fetchedResult.totalCredits,
      tuitionFee: fetchedResult.tuitionFee,
      lastPulledAt: new Date(),
    },
    update: {
      data: JSON.stringify(storagePayload),
      totalCourses: fetchedResult.totalCourses,
      totalCredits: fetchedResult.totalCredits,
      tuitionFee: fetchedResult.tuitionFee,
      lastPulledAt: new Date(),
    },
  });

  const coursesList =
    fetchedResult.currentRegistration.courses.length > 0
      ? fetchedResult.currentRegistration.courses
      : fetchedResult.semesters[0]?.courses || [];

  const availableSemesters = fetchedResult.semesters.map((s) => ({
    hoc_ky: s.hoc_ky,
    ten_hoc_ky: s.ten_hoc_ky,
    totalCourses: s.totalCourses,
    totalCredits: s.totalCredits,
    ngay_bat_dau_hk: s.ngay_bat_dau_hk,
    ngay_ket_thuc_hk: s.ngay_ket_thuc_hk,
  }));

  await logActivity({
    req,
    userId: authUser.id,
    username: authUser.username,
    userRole: authUser.role,
    action: 'SYNC_COURSE_REGISTRATION',
    targetType: 'COURSE_REGISTRATION',
    targetId: effectiveUsername,
    description: `Đồng bộ ĐKMH và ${fetchedResult.semesters.length} học kỳ từ QLDTTX cho sinh viên ${effectiveUsername} (${finalClassCode}): ${fetchedResult.totalCourses} môn (${fetchedResult.totalCredits} tín chỉ)`,
    metadata: {
      effectiveUsername,
      finalClassCode,
      totalCourses: fetchedResult.totalCourses,
      totalCredits: fetchedResult.totalCredits,
      semestersCount: fetchedResult.semesters.length,
    },
  });

  return NextResponse.json({
    success: true,
    message: `Đã đồng bộ thành công ${fetchedResult.totalCourses} môn học (${fetchedResult.totalCredits} tín chỉ) và dữ liệu ${fetchedResult.semesters.length} học kỳ từ cổng QLDTTX!`,
    username: effectiveUsername,
    classCode: finalClassCode,
    totalCourses: saved.totalCourses,
    totalCredits: saved.totalCredits,
    tuitionFee: saved.tuitionFee,
    lastPulledAt: saved.lastPulledAt?.toISOString(),
    courses: coursesList,
    semesters: availableSemesters,
    rawResponse: storagePayload,
  });
}
