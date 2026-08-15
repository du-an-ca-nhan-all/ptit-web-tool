import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import { fetchStudentCoursesFromQLDTTX } from '@/src/lib/qldttx-service';
import { logActivity } from '@/src/lib/activityLog';
import { dispatchCourseRegistrationSynced } from '@/src/lib/telegram-dispatcher';

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
// Returns registered courses for a student or class
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để xem thông tin' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUsername = (searchParams.get('username') || authUser.username).toUpperCase();
    const classCode = searchParams.get('classCode') || authUser.lop || '';

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

    let parsedData = null;
    let coursesList: any[] = [];

    if (registration?.data) {
      try {
        parsedData = JSON.parse(registration.data);
        coursesList = parsedData?.data?.ds_kqdkmh || [];
      } catch (e) {
        console.error('Parse registration data error:', e);
      }
    }

    return NextResponse.json({
      success: true,
      username: targetUsername,
      classCode: registration?.classCode || classCode,
      hasRegistration: !!registration,
      totalCourses: registration?.totalCourses || coursesList.length,
      totalCredits: registration?.totalCredits || 0,
      tuitionFee: registration?.tuitionFee || 0,
      lastPulledAt: registration?.lastPulledAt?.toISOString() || registration?.updatedAt?.toISOString() || null,
      courses: coursesList,
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
// Pull (Sync) registered courses from QLDTTX and save to CourseRegistration
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

    // 1. ACTION: BATCH PULL (For Admin / Monitor)
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
          const fetched = await fetchStudentCoursesFromQLDTTX({
            username: ext.extUsername,
            password: ext.extPassword,
            token: ext.token,
          });

          // Check if this student is monitor
          const isStudentMonitor = st.user?.role?.includes('lop_truong') || false;
          const regType = isStudentMonitor ? 'main' : 'sub';

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
              data: JSON.stringify(fetched.data),
              totalCourses: fetched.totalCourses,
              totalCredits: fetched.totalCredits,
              tuitionFee: fetched.tuitionFee,
              lastPulledAt: new Date(),
            },
            update: {
              data: JSON.stringify(fetched.data),
              totalCourses: fetched.totalCourses,
              totalCredits: fetched.totalCredits,
              tuitionFee: fetched.tuitionFee,
              lastPulledAt: new Date(),
            },
          });

          successCount++;
          results.push({ username: st.maSV, success: true, courses: fetched.totalCourses });
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
        description: `Đồng bộ ĐKMH từ QLDTTX cho cả lớp ${targetClass}: ${successCount} SV thành công, ${failCount} thất bại`,
        metadata: { targetClass, successCount, failCount },
      });

      return NextResponse.json({
        success: true,
        message: `Đã đồng bộ kết quả ĐKMH cho lớp ${targetClass}: ${successCount} thành công, ${failCount} thất bại.`,
        successCount,
        failCount,
        results,
      });
    }

    // 2. ACTION: SINGLE PULL (Pull for one student)
    // Find external account
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

    // Fetch from QLDTTX
    const fetchedResult = await fetchStudentCoursesFromQLDTTX({
      username: extAccount.extUsername,
      password: extAccount.extPassword,
      token: extAccount.token,
    });

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
        data: JSON.stringify(fetchedResult.data),
        totalCourses: fetchedResult.totalCourses,
        totalCredits: fetchedResult.totalCredits,
        tuitionFee: fetchedResult.tuitionFee,
        lastPulledAt: new Date(),
      },
      update: {
        data: JSON.stringify(fetchedResult.data),
        totalCourses: fetchedResult.totalCourses,
        totalCredits: fetchedResult.totalCredits,
        tuitionFee: fetchedResult.tuitionFee,
        lastPulledAt: new Date(),
      },
    });

    const coursesList = fetchedResult.data?.data?.ds_kqdkmh || [];

    await logActivity({
      req,
      userId: authUser.id,
      username: authUser.username,
      userRole: authUser.role,
      action: 'SYNC_COURSE_REGISTRATION',
      targetType: 'COURSE_REGISTRATION',
      targetId: effectiveUsername,
      description: `Đồng bộ ĐKMH từ QLDTTX cho sinh viên ${effectiveUsername} (${finalClassCode}): ${fetchedResult.totalCourses} môn (${fetchedResult.totalCredits} tín chỉ)`,
      metadata: { effectiveUsername, finalClassCode, totalCourses: fetchedResult.totalCourses, totalCredits: fetchedResult.totalCredits },
    });

    // Asynchronously dispatch Telegram notification to student
    dispatchCourseRegistrationSynced({
      username: effectiveUsername,
      courseList: coursesList,
      tuitionFee: fetchedResult.tuitionFee,
      totalCredits: fetchedResult.totalCredits,
    }).catch((err) => console.error('Dispatch course registration synced error:', err));

    return NextResponse.json({
      success: true,
      message: `Đã đồng bộ thành công ${fetchedResult.totalCourses} môn học (${fetchedResult.totalCredits} tín chỉ) từ cổng QLDTTX!`,
      username: effectiveUsername,
      classCode: finalClassCode,
      totalCourses: saved.totalCourses,
      totalCredits: saved.totalCredits,
      tuitionFee: saved.tuitionFee,
      lastPulledAt: saved.lastPulledAt?.toISOString(),
      courses: coursesList,
      rawResponse: fetchedResult.data,
    });
  } catch (error: any) {
    console.error('Course registration action error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi đồng bộ môn học từ QLDTTX' }, { status: 500 });
  }
}
