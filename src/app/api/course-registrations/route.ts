import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import { fetchAllSemestersCoursesFromQLDTTX, fetchStudentCoursesFromQLDTTX } from '@/src/features/external-portal/server/qldttxServerService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';

async function getAuthUser(req: NextRequest) {
  let authUser = await getCurrentUserFromCookie();
  if (!authUser) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      authUser = await verifyAuthToken(token);
    }
  }
  return authUser;
}

// GET /api/course-registrations
// Returns registered courses for a student or class (supports multi-semester & past semesters)
export async function GET(req: NextRequest) {
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

    let parsedData: any = null;
    let currentCoursesList: any[] = [];
    let semestersList: any[] = [];
    let allCoursesList: any[] = [];

    if (registration?.data) {
      try {
        parsedData = JSON.parse(registration.data);
        currentCoursesList = parsedData?.data?.ds_kqdkmh || parsedData?.ds_kqdkmh || [];
        semestersList = parsedData?.semesters || [];
        allCoursesList = parsedData?.allCourses || [];
      } catch (e) {
        console.error('Parse registration data error:', e);
      }
    }

    // Build available semesters metadata for the dropdown
    const availableSemesters = semestersList.map((s: any) => ({
      hoc_ky: s.hoc_ky,
      ten_hoc_ky: s.ten_hoc_ky,
      totalCourses: s.totalCourses || (s.courses || []).length,
      totalCredits: s.totalCredits || 0,
      ngay_bat_dau_hk: s.ngay_bat_dau_hk,
      ngay_ket_thuc_hk: s.ngay_ket_thuc_hk,
    }));

    let coursesList: any[] = [];
    let totalCourses = registration?.totalCourses || 0;
    let totalCredits = registration?.totalCredits || 0;
    let tuitionFee = registration?.tuitionFee || 0;
    let selectedSemester: string | number = 'CURRENT';
    let selectedSemesterName = 'Đợt ĐKMH Hiện Tại';

    if (requestedSemester && requestedSemester !== 'CURRENT') {
      if (requestedSemester === 'ALL') {
        selectedSemester = 'ALL';
        selectedSemesterName = 'Tất Cả Các Học Kỳ';
        if (allCoursesList.length > 0) {
          coursesList = allCoursesList;
        } else {
          // Combine all courses from semesters
          const combined: any[] = [];
          semestersList.forEach((sem: any) => {
            (sem.courses || []).forEach((c: any) => {
              combined.push({
                ...c,
                semesterHocKy: sem.hoc_ky,
                semesterName: sem.ten_hoc_ky,
              });
            });
          });
          coursesList = combined.length > 0 ? combined : currentCoursesList;
        }
        totalCourses = coursesList.length;
        totalCredits = coursesList.reduce((acc, c) => acc + (c.so_tc || c.to_hoc?.so_tc || 0), 0);
      } else {
        // Specific semester requested by hoc_ky (e.g. 20261, 20252, 20251)
        const targetSem = semestersList.find((s: any) => String(s.hoc_ky) === String(requestedSemester));
        if (targetSem) {
          selectedSemester = targetSem.hoc_ky;
          selectedSemesterName = targetSem.ten_hoc_ky;
          coursesList = targetSem.courses || [];
          totalCourses = targetSem.totalCourses || coursesList.length;
          totalCredits = targetSem.totalCredits || coursesList.reduce((acc, c) => acc + (c.so_tc || c.to_hoc?.so_tc || 0), 0);
        } else {
          coursesList = currentCoursesList;
        }
      }
    } else {
      // Default: Current registration courses, or latest semester courses if current registration is empty
      if (currentCoursesList.length > 0) {
        coursesList = currentCoursesList;
        totalCourses = registration?.totalCourses || currentCoursesList.length;
        totalCredits = registration?.totalCredits || 0;
        tuitionFee = registration?.tuitionFee || 0;
        selectedSemester = 'CURRENT';
        selectedSemesterName = 'Đợt ĐKMH Hiện Tại';
      } else if (semestersList.length > 0) {
        const latestSem = semestersList[0];
        coursesList = latestSem.courses || [];
        totalCourses = latestSem.totalCourses || coursesList.length;
        totalCredits = latestSem.totalCredits || 0;
        selectedSemester = latestSem.hoc_ky;
        selectedSemesterName = latestSem.ten_hoc_ky;
      }
    }

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

// POST /api/course-registrations
// Pull (Sync) registered courses from QLDTTX (including all past semesters & current registration) and save to CourseRegistration
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện thao tác' }, { status: 401 });
    }

    const body = await req.json();
    const { action = 'PULL', targetUsername, classCode: reqClassCode } = body;

    const effectiveUsername = (targetUsername || authUser.username).toUpperCase();
    
    // Permission check
    if (effectiveUsername !== authUser.username.toUpperCase() && !authUser.isAdmin && !authUser.isMonitor) {
      return NextResponse.json({ error: 'Bạn không có quyền đồng bộ cho sinh viên khác' }, { status: 403 });
    }

    // 1. ACTION: BATCH PULL (For Admin / Monitor - Pull all semesters for all students in class)
    if (action === 'BATCH_PULL') {
      if (!authUser.isAdmin && !authUser.isMonitor) {
        return NextResponse.json({ error: 'Chỉ Admin hoặc Lớp trưởng mới có quyền đồng bộ hàng loạt' }, { status: 403 });
      }

      const targetClass = reqClassCode || authUser.lop;
      if (!targetClass) {
        return NextResponse.json({ error: 'Mã lớp (classCode) là bắt buộc' }, { status: 400 });
      }

      // Find all students in this class who have configured QLDTTX external accounts
      const classStudents = await prisma.student.findMany({
        where: { maLop: targetClass },
        include: {
          user: {
            include: {
              externalAccounts: {
                where: { systemKey: 'QLDTTX_PTTC1' },
              },
            },
          },
        },
      });

      let successCount = 0;
      let failCount = 0;
      const results: any[] = [];

      for (const st of classStudents) {
        const ext = st.user?.externalAccounts?.[0];
        if (!ext) continue;

        try {
          const fetched = await fetchAllSemestersCoursesFromQLDTTX({
            username: ext.extUsername,
            password: ext.extPassword,
            token: ext.token,
          });

          // Build storage payload preserving ds_kqdkmh and rich semesters
          const storagePayload = {
            data: {
              ds_kqdkmh: fetched.currentRegistration.courses,
            },
            semesters: fetched.semesters,
            allCourses: fetched.allCourses,
            lastPulledAt: new Date(),
          };

          await prisma.courseRegistration.upsert({
            where: {
              classCode_username: {
                classCode: targetClass,
                username: st.maSV.toUpperCase(),
              },
            },
            create: {
              classCode: targetClass,
              username: st.maSV.toUpperCase(),
              data: JSON.stringify(storagePayload),
              totalCourses: fetched.totalCourses,
              totalCredits: fetched.totalCredits,
              tuitionFee: fetched.tuitionFee,
              lastPulledAt: new Date(),
            },
            update: {
              data: JSON.stringify(storagePayload),
              totalCourses: fetched.totalCourses,
              totalCredits: fetched.totalCredits,
              tuitionFee: fetched.tuitionFee,
              lastPulledAt: new Date(),
            },
          });

          successCount++;
          results.push({
            username: st.maSV,
            success: true,
            courses: fetched.totalCourses,
            semestersCount: fetched.semesters.length,
          });
        } catch (err: any) {
          failCount++;
          results.push({ username: st.maSV, success: false, error: err.message });
        }
      }

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'SYNC_CLASS_REGISTRATION',
        targetType: 'COURSE_REGISTRATION',
        targetId: targetClass,
        description: `Đồng bộ ĐKMH & các học kỳ cũ từ QLDTTX cho cả lớp ${targetClass}: ${successCount} SV thành công, ${failCount} thất bại`,
        metadata: { targetClass, successCount, failCount },
      });

      return NextResponse.json({
        success: true,
        message: `Đã đồng bộ kết quả ĐKMH & các kỳ cũ cho lớp ${targetClass}: ${successCount} thành công, ${failCount} thất bại.`,
        successCount,
        failCount,
        results,
      });
    }

    // 2. ACTION: SINGLE PULL (Pull for one student: current registration + all past semesters)
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
    const storagePayload = {
      data: {
        ds_kqdkmh: fetchedResult.currentRegistration.courses,
      },
      semesters: fetchedResult.semesters,
      allCourses: fetchedResult.allCourses,
      lastPulledAt: new Date(),
    };

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

    const coursesList = fetchedResult.currentRegistration.courses.length > 0
      ? fetchedResult.currentRegistration.courses
      : (fetchedResult.semesters[0]?.courses || []);

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
  } catch (error: any) {
    console.error('Course registration action error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi đồng bộ môn học từ QLDTTX' }, { status: 500 });
  }
}

