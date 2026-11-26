import { prisma } from '@/src/lib/prisma';
import {
  FollowerStudentItem,
  MonitorFlowListResult,
  MonitorProfileData,
} from './types';
import { calculateCourseDiff, extractCourseListFromData } from './utils';

/**
 * Lấy danh sách thành viên trong lớp kèm cấu hình Flow Action và Dữ liệu So Sánh Môn Học
 */
export async function getMonitorFlowList(
  monitorUsername: string,
  classCode: string
): Promise<MonitorFlowListResult> {
  const normMonitor = monitorUsername.trim().toUpperCase();
  const normClass = classCode.trim().toUpperCase();

  // 1. Lấy thông tin lớp trưởng
  const monitorStudent = await prisma.student.findFirst({
    where: { maSV: normMonitor },
    include: {
      user: {
        include: {
          externalAccounts: { where: { systemKey: 'QLDTTX_PTTC1' } },
        },
      },
    },
  });

  // 2. Lấy danh sách sinh viên đang theo học (trangThai: DANG_HOC) và đã liên kết QLDTTX thuộc lớp
  const classStudents = await prisma.student.findMany({
    where: {
      maLop: normClass,
      trangThai: 'DANG_HOC',
      user: {
        externalAccounts: {
          some: {
            systemKey: 'QLDTTX_PTTC1',
            extUsername: { not: '' },
          },
        },
      },
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
    orderBy: { ten: 'asc' },
  });

  // 3. Lấy cấu hình flow
  const existingConfigs = await prisma.monitorFlowConfig.findMany({
    where: {
      classCode: normClass,
      monitorUsername: normMonitor,
    },
  });

  const configMap = new Map<string, any>();
  existingConfigs.forEach((cfg) => {
    configMap.set(cfg.followerUsername.toUpperCase(), cfg);
  });

  // 4. Lấy dữ liệu CourseRegistration đã lưu cho cả lớp
  const registrations = await prisma.courseRegistration.findMany({
    where: { classCode: normClass },
  });

  const regMap = new Map<string, any>();
  registrations.forEach((r) => {
    regMap.set(r.username.toUpperCase(), r);
  });

  // Trích xuất môn học của Lớp trưởng
  const monitorReg = regMap.get(normMonitor);
  const monitorCourses = extractCourseListFromData(monitorReg?.data);
  const monitorFullName =
    monitorStudent?.hoTen || `${monitorStudent?.hoLot || ''} ${monitorStudent?.ten || ''}`.trim() || normMonitor;

  let monitorTotalCredits = monitorReg?.totalCredits || 0;
  let monitorTuitionFee = monitorReg?.tuitionFee || 0;

  if (monitorCourses.length > 0 && monitorTotalCredits === 0) {
    monitorTotalCredits = monitorCourses.reduce((acc, cur) => acc + (cur.so_tc || 0), 0);
  }
  if (monitorCourses.length > 0 && monitorTuitionFee === 0) {
    monitorTuitionFee = monitorCourses.reduce((acc, cur) => acc + (cur.phai_dong || 0), 0);
  }

  const monitorData: MonitorProfileData = {
    username: normMonitor,
    hoTen: monitorFullName,
    maLop: normClass,
    totalCourses: monitorCourses.length,
    totalCredits: monitorTotalCredits,
    tuitionFee: monitorTuitionFee,
    lastPulledAt: monitorReg?.lastPulledAt?.toISOString() || null,
    courses: monitorCourses,
  };

  let activeFollowersCount = 0;
  let configuredAccountsCount = 0;

  const students: FollowerStudentItem[] = classStudents
    .filter((st) => {
      if (st.maSV.toUpperCase() === normMonitor) return false;
      const extAcc = st.user?.externalAccounts?.[0];
      const isExtConfigured = Boolean(extAcc && extAcc.extUsername);
      return isExtConfigured;
    })
    .map((st) => {
      const maSVUpper = st.maSV.toUpperCase();
      const extAcc = st.user?.externalAccounts?.[0];
      const isExtConfigured = Boolean(extAcc && extAcc.extUsername);
      if (isExtConfigured) configuredAccountsCount++;

      const cfg = configMap.get(maSVUpper);
      const isEnabled = cfg ? Boolean(cfg.isEnabled) : false;
      const allowRegisterCourse = cfg ? Boolean(cfg.allowRegisterCourse) : true;
      const allowCancelCourse = cfg ? Boolean(cfg.allowCancelCourse) : true;
      const autoSyncOnAction = cfg ? Boolean(cfg.autoSyncOnAction) : false;

      if (isEnabled) activeFollowersCount++;

      const isStudentMonitor = Boolean(st.user?.role?.includes('lop_truong'));

      // Course Registration data
      const studentReg = regMap.get(maSVUpper);
      const followerCourses = extractCourseListFromData(studentReg?.data);
      let totalCredits = studentReg?.totalCredits || 0;
      let tuitionFee = studentReg?.tuitionFee || 0;

      if (followerCourses.length > 0 && totalCredits === 0) {
        totalCredits = followerCourses.reduce((acc, cur) => acc + (cur.so_tc || 0), 0);
      }
      if (followerCourses.length > 0 && tuitionFee === 0) {
        tuitionFee = followerCourses.reduce((acc, cur) => acc + (cur.phai_dong || 0), 0);
      }

      // Calculate diff vs monitor
      const diffSummary = calculateCourseDiff(monitorCourses, followerCourses);

      return {
        maSV: st.maSV,
        hoTen: st.hoTen || `${st.hoLot || ''} ${st.ten || ''}`.trim() || st.maSV,
        soDienThoai: st.soDienThoai,
        maLop: st.maLop || normClass,
        isMonitor: isStudentMonitor,
        isExternalConfigured: isExtConfigured,
        externalStatus: extAcc?.status || 'DISCONNECTED',
        externalUsername: extAcc?.extUsername,
        isEnabled,
        allowRegisterCourse,
        allowCancelCourse,
        autoSyncOnAction,
        note: cfg?.note || null,
        totalCourses: followerCourses.length,
        totalCredits,
        tuitionFee,
        lastPulledAt: studentReg?.lastPulledAt?.toISOString() || null,
        courses: followerCourses,
        diffSummary,
        lastActionAt: cfg?.lastActionAt?.toISOString() || null,
        lastActionType: cfg?.lastActionType || null,
        lastActionResult: cfg?.lastActionResult || null,
        lastActionMessage: cfg?.lastActionMessage || null,
      };
    });

  return {
    monitorUsername: normMonitor,
    classCode: normClass,
    monitorData,
    totalStudents: students.length,
    activeFollowersCount,
    configuredAccountsCount,
    students,
  };
}
