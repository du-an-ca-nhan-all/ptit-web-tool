import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { AuthUser } from '@/src/lib/auth';
import { fetchAllSemestersCoursesFromQLDTTX } from '@/src/features/external-portal/server/qldttxServerService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { buildRegistrationStoragePayload } from './helpers';

// ACTION: BATCH PULL (For Admin / Monitor - Pull all semesters for all students in class)
export async function handleBatchPullCourseRegistrations(
  req: NextRequest,
  authUser: AuthUser,
  reqClassCode?: string
) {
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
      const storagePayload = buildRegistrationStoragePayload(fetched);

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
