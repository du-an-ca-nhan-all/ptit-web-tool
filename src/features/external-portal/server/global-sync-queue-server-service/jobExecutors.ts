import { prisma } from '@/src/lib/prisma';
import { getStudentTimetableCalendar } from '../studentTimetableServerService';
import { getStudentGrades } from '../studentGradesServerService';
import { getOrFetchStudentLmsOverview } from '../lmsServerService';
import { getStudentQldtExamSchedule } from '../studentExamScheduleServerService';
import { getStudentSlinkGrades } from '../slinkGradesServerService';
import { syncStudentProfileFromQLDTTX } from '../studentProfileSyncService';
import { GlobalJobType } from '../../types/globalSyncQueue.types';

export async function executeTimetableSync(itemId: string, normUsername: string) {
  const res = await getStudentTimetableCalendar(normUsername, { forceRefresh: true });
  if (res.success) {
    const msg = `Đã đồng bộ thành công ${res.totalEvents} buổi học (${res.uniqueSubjectsCount} môn)`;
    await prisma.globalSyncQueueItem.update({
      where: { id: itemId },
      data: {
        status: 'SUCCESS',
        resultMessage: msg,
        resultData: JSON.stringify({
          totalEvents: res.totalEvents,
          uniqueSubjectsCount: res.uniqueSubjectsCount,
          totalCredits: res.totalCredits,
        }),
        finishedAt: new Date(),
      },
    });
  } else {
    await prisma.globalSyncQueueItem.update({
      where: { id: itemId },
      data: {
        status: res.errorType === 'NOT_CONFIGURED' ? 'SKIPPED' : 'FAILED',
        resultMessage: res.error || 'Lỗi khi kéo lịch học từ Cổng QLDTTX',
        finishedAt: new Date(),
      },
    });
  }
}

export async function executeGradesSync(itemId: string, normUsername: string) {
  const res = await getStudentGrades(normUsername, { forceRefresh: true });
  if (res.success) {
    const gpa10Str = res.summary.gpa10 !== null ? res.summary.gpa10.toFixed(2) : 'N/A';
    const gpa4Str = res.summary.gpa4 !== null ? res.summary.gpa4.toFixed(2) : 'N/A';
    const msg = `Đã đồng bộ GPA 10: ${gpa10Str} | GPA 4: ${gpa4Str} (${res.summary.totalPassedCredits} TC đạt / ${res.summary.totalCreditsRegistered} TC)`;
    await prisma.globalSyncQueueItem.update({
      where: { id: itemId },
      data: {
        status: 'SUCCESS',
        resultMessage: msg,
        resultData: JSON.stringify({
          gpa10: res.summary.gpa10,
          gpa4: res.summary.gpa4,
          totalPassedCredits: res.summary.totalPassedCredits,
          totalSubjects: res.summary.totalSubjects,
          classification: res.summary.classification,
        }),
        finishedAt: new Date(),
      },
    });
  } else {
    await prisma.globalSyncQueueItem.update({
      where: { id: itemId },
      data: {
        status: res.errorType === 'NOT_CONFIGURED' ? 'SKIPPED' : 'FAILED',
        resultMessage: res.error || 'Lỗi khi kéo bảng điểm từ Cổng QLDTTX',
        finishedAt: new Date(),
      },
    });
  }
}

export async function executeLmsSync(itemId: string, normUsername: string) {
  const res = await getOrFetchStudentLmsOverview(normUsername, { forceRefresh: true });
  const enrolled = res.stats?.enrolledCourses ?? res.courses?.length ?? 0;
  const completedAct = res.stats?.completedActivities ?? 0;
  const completedCourses = res.stats?.completedCourses ?? 0;
  const msg = `Đã đồng bộ ${enrolled} khóa học LMS (${completedCourses} hoàn thành, ${completedAct} hoạt động xong)`;

  await prisma.globalSyncQueueItem.update({
    where: { id: itemId },
    data: {
      status: 'SUCCESS',
      resultMessage: msg,
      resultData: JSON.stringify({
        enrolledCourses: enrolled,
        completedCourses,
        completedActivities: completedAct,
      }),
      finishedAt: new Date(),
    },
  });
}

export async function executeExamsSync(
  itemId: string,
  normUsername: string,
  jobType: GlobalJobType
) {
  const res = await getStudentQldtExamSchedule(normUsername, { forceRefresh: true });
  if (res.success) {
    const isTodayJob = jobType === 'SYNC_TODAY_EXAMS';
    const msg = isTodayJob
      ? `Đã kiểm tra ca thi hôm nay (${res.totalExams} môn thi, ${res.upcomingExams.length} môn sắp diễn ra)`
      : `Đã đồng bộ ${res.totalExams} môn thi (${res.upcomingExams.length} môn sắp thi)`;

    await prisma.globalSyncQueueItem.update({
      where: { id: itemId },
      data: {
        status: 'SUCCESS',
        resultMessage: msg,
        resultData: JSON.stringify({
          totalExams: res.totalExams,
          upcomingExams: res.upcomingExams.length,
          pastExams: res.pastExams.length,
          semesterId: res.semesterId,
          isTodayJob,
        }),
        finishedAt: new Date(),
      },
    });
  } else {
    await prisma.globalSyncQueueItem.update({
      where: { id: itemId },
      data: {
        status: res.errorType === 'NOT_CONFIGURED' ? 'SKIPPED' : 'FAILED',
        resultMessage: res.error || 'Lỗi khi kéo lịch thi cá nhân từ Cổng QLDTTX',
        finishedAt: new Date(),
      },
    });
  }
}

export async function executeSlinkGradesSync(itemId: string, normUsername: string) {
  const res = await getStudentSlinkGrades(normUsername, { forceRefresh: true });
  if (res.success) {
    const gpa10Str = res.summary.gpa10 !== null ? res.summary.gpa10.toFixed(2) : 'N/A';
    const gpa4Str = res.summary.gpa4 !== null ? res.summary.gpa4.toFixed(2) : 'N/A';
    const msg = `Đã đồng bộ S-Link GPA 10: ${gpa10Str} | GPA 4: ${gpa4Str} (${res.summary.totalPassedCredits} TC đạt / ${res.summary.totalCreditsRegistered} TC)`;

    await prisma.globalSyncQueueItem.update({
      where: { id: itemId },
      data: {
        status: 'SUCCESS',
        resultMessage: msg,
        resultData: JSON.stringify({
          gpa10: res.summary.gpa10,
          gpa4: res.summary.gpa4,
          totalPassedCredits: res.summary.totalPassedCredits,
          totalSubjects: res.summary.totalSubjects,
          classification: res.summary.classification,
        }),
        finishedAt: new Date(),
      },
    });
  } else {
    await prisma.globalSyncQueueItem.update({
      where: { id: itemId },
      data: {
        status: res.errorType === 'NOT_CONFIGURED' ? 'SKIPPED' : 'FAILED',
        resultMessage: res.error || 'Lỗi khi kéo kết quả học tập từ PTIT S-Link',
        finishedAt: new Date(),
      },
    });
  }
}

export async function executeProfileSync(
  itemId: string,
  normUsername: string,
  extAcc: { token: string | null; extUsername: string; extPassword: string | null }
) {
  const res = await syncStudentProfileFromQLDTTX({
    username: normUsername,
    token: extAcc.token,
    extUsername: extAcc.extUsername,
    extPassword: extAcc.extPassword || undefined,
  });

  if (res.synced && res.student) {
    const filledFields = [
      res.student.ngaySinh ? 'Ngày sinh' : null,
      res.student.gioiTinh ? 'Giới tính' : null,
      res.student.soDienThoai ? 'SĐT' : null,
      res.student.soCMND ? 'CMND' : null,
      res.student.email1 ? 'Email 1' : null,
      res.student.email2 ? 'Email 2' : null,
      res.student.noiSinh ? 'Nơi sinh' : null,
      res.student.quocTich ? 'Quốc tịch' : null,
    ].filter(Boolean);

    const msg = `Đã đồng bộ hồ sơ QLHT (${filledFields.length}/8 trường có dữ liệu: ${filledFields.join(', ') || 'trống'})`;

    await prisma.globalSyncQueueItem.update({
      where: { id: itemId },
      data: {
        status: 'SUCCESS',
        resultMessage: msg,
        resultData: JSON.stringify(res.student),
        finishedAt: new Date(),
      },
    });
  } else {
    await prisma.globalSyncQueueItem.update({
      where: { id: itemId },
      data: {
        status: res.reason === 'STUDENT_NOT_FOUND' ? 'SKIPPED' : 'FAILED',
        resultMessage:
          res.reason === 'STUDENT_NOT_FOUND'
            ? 'Bỏ qua: Không tìm thấy hồ sơ sinh viên trong bảng Student'
            : 'Không thể đồng bộ thông tin sinh viên từ QLHT',
        finishedAt: new Date(),
      },
    });
  }
}
