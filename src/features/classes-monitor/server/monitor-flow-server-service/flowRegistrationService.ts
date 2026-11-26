import { prisma } from '@/src/lib/prisma';
import { fetchRegisteredCoursesFromQLDTTX } from '@/src/features/external-portal/server/courseRegistrationServerService';

/**
 * Kéo dữ liệu ĐKMH mới nhất từ Cổng QLDTTX cho Lớp trưởng và tất cả thành viên trong lớp
 */
export async function pullClassCourseRegistrations(monitorUsername: string, classCode: string) {
  const normMonitor = monitorUsername.trim().toUpperCase();
  const normClass = classCode.trim().toUpperCase();
  void normMonitor;

  const classStudents = await prisma.student.findMany({
    where: {
      maLop: normClass,
      trangThai: 'DANG_HOC',
    },
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

  let pulledCount = 0;
  let failCount = 0;

  for (const st of classStudents) {
    const extAcc = st.user?.externalAccounts?.[0];
    if (!extAcc || !extAcc.extUsername || !extAcc.extPassword) continue;

    try {
      const res = await fetchRegisteredCoursesFromQLDTTX({
        username: extAcc.extUsername,
        password: extAcc.extPassword,
        token: extAcc.token,
      });

      if (res.newToken && res.newToken !== extAcc.token) {
        await prisma.externalAccount.update({
          where: { id: extAcc.id },
          data: { token: res.newToken, lastSyncAt: new Date() },
        });
      }

      const totalCredits = res.totalCredits || 0;
      const tuitionFee = res.tuitionFee || 0;
      const totalCourses = res.totalCourses || (res.ds_kqdkmh || []).length;
      const rawDataJson = JSON.stringify(res.rawResponse || { data: { ds_kqdkmh: res.ds_kqdkmh } });

      await prisma.courseRegistration.upsert({
        where: {
          classCode_username: {
            classCode: normClass,
            username: st.maSV.toUpperCase(),
          },
        },
        create: {
          classCode: normClass,
          username: st.maSV.toUpperCase(),
          data: rawDataJson,
          totalCourses,
          totalCredits,
          tuitionFee,
          lastPulledAt: new Date(),
        },
        update: {
          data: rawDataJson,
          totalCourses,
          totalCredits,
          tuitionFee,
          lastPulledAt: new Date(),
        },
      });

      pulledCount++;
    } catch (err) {
      failCount++;
      console.error(`Lỗi khi kéo môn học cho ${st.maSV}:`, err);
    }
  }

  return { success: true, pulledCount, failCount };
}
