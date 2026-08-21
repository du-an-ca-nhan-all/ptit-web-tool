import { prisma } from '@/src/lib/prisma';
import {
  registerCourseGroupQLDTTX,
  cancelCourseGroupQLDTTX,
  fetchOpenCourseGroupsFromQLDTTX,
  fetchRegisteredCoursesFromQLDTTX,
} from '@/src/features/external-portal/server/courseRegistrationServerService';

export interface FollowerStudentItem {
  maSV: string;
  hoTen: string;
  soDienThoai?: string | null;
  maLop: string;
  isMonitor: boolean;
  // External Account Status
  isExternalConfigured: boolean;
  externalStatus: string;
  externalUsername?: string;
  // Flow Configuration
  isEnabled: boolean;
  allowRegisterCourse: boolean;
  allowCancelCourse: boolean;
  autoSyncOnAction: boolean;
  note?: string | null;
  // Last Action Record
  lastActionAt?: string | null;
  lastActionType?: string | null;
  lastActionResult?: string | null;
  lastActionMessage?: string | null;
}

/**
 * Lấy danh sách thành viên trong lớp kèm cấu hình Flow Action theo Lớp trưởng
 */
export async function getMonitorFlowList(
  monitorUsername: string,
  classCode: string
): Promise<{
  monitorUsername: string;
  classCode: string;
  totalStudents: number;
  activeFollowersCount: number;
  configuredAccountsCount: number;
  students: FollowerStudentItem[];
}> {
  const normMonitor = monitorUsername.trim().toUpperCase();
  const normClass = classCode.trim().toUpperCase();

  // 1. Lấy danh sách tất cả sinh viên thuộc lớp
  const classStudents = await prisma.student.findMany({
    where: { maLop: normClass },
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

  // 2. Lấy danh sách cấu hình flow đã lưu
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

  let activeFollowersCount = 0;
  let configuredAccountsCount = 0;

  const students: FollowerStudentItem[] = classStudents
    .filter((st) => st.maSV.toUpperCase() !== normMonitor) // Không bao gồm chính lớp trưởng trong danh sách follow
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
        lastActionAt: cfg?.lastActionAt?.toISOString() || null,
        lastActionType: cfg?.lastActionType || null,
        lastActionResult: cfg?.lastActionResult || null,
        lastActionMessage: cfg?.lastActionMessage || null,
      };
    });

  return {
    monitorUsername: normMonitor,
    classCode: normClass,
    totalStudents: students.length,
    activeFollowersCount,
    configuredAccountsCount,
    students,
  };
}

/**
 * Lưu danh sách cấu hình Flow Action cho các sinh viên trong lớp
 */
export async function saveMonitorFlowConfigs(
  monitorUsername: string,
  classCode: string,
  configs: Array<{
    followerUsername: string;
    isEnabled: boolean;
    allowRegisterCourse?: boolean;
    allowCancelCourse?: boolean;
    autoSyncOnAction?: boolean;
    note?: string;
  }>
) {
  const normMonitor = monitorUsername.trim().toUpperCase();
  const normClass = classCode.trim().toUpperCase();

  const results = [];

  for (const item of configs) {
    const normFollower = item.followerUsername.trim().toUpperCase();
    if (normFollower === normMonitor) continue;

    const saved = await prisma.monitorFlowConfig.upsert({
      where: {
        monitorUsername_followerUsername: {
          monitorUsername: normMonitor,
          followerUsername: normFollower,
        },
      },
      create: {
        classCode: normClass,
        monitorUsername: normMonitor,
        followerUsername: normFollower,
        isEnabled: item.isEnabled ?? false,
        allowRegisterCourse: item.allowRegisterCourse ?? true,
        allowCancelCourse: item.allowCancelCourse ?? true,
        autoSyncOnAction: item.autoSyncOnAction ?? false,
        note: item.note || null,
      },
      update: {
        classCode: normClass,
        isEnabled: item.isEnabled ?? false,
        allowRegisterCourse: item.allowRegisterCourse ?? true,
        allowCancelCourse: item.allowCancelCourse ?? true,
        autoSyncOnAction: item.autoSyncOnAction ?? false,
        ...(item.note !== undefined ? { note: item.note } : {}),
      },
    });

    results.push(saved);
  }

  return { success: true, count: results.length, configs: results };
}

/**
 * Thực thi Flow Action từ Lớp trưởng đến các thành viên được cấu hình
 */
export async function executeMonitorFlowAction(options: {
  monitorUsername: string;
  classCode?: string;
  flowAction: 'REGISTER' | 'CANCEL' | 'SYNC_ALL_COURSES';
  id_to_hoc?: string;
  id_rs?: string;
  ma_mon?: string;
  ten_mon?: string;
  nhom_to?: string;
  sv_nganh?: number;
  targetFollowerUsernames?: string[]; // Nếu truyền thì chỉ flow cho danh sách này, nếu không thì flow cho tất cả followers isEnabled
}): Promise<{
  success: boolean;
  flowAction: string;
  total: number;
  successCount: number;
  failCount: number;
  skippedCount: number;
  results: Array<{
    username: string;
    hoTen?: string;
    success: boolean;
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    message: string;
    data?: any;
  }>;
}> {
  const normMonitor = options.monitorUsername.trim().toUpperCase();
  const svNganh = options.sv_nganh ?? 1;

  // 1. Lấy danh sách cấu hình flow đang bật của Lớp trưởng
  const flowConfigs = await prisma.monitorFlowConfig.findMany({
    where: {
      monitorUsername: normMonitor,
      isEnabled: true,
      ...(options.classCode ? { classCode: options.classCode.trim().toUpperCase() } : {}),
      ...(options.flowAction === 'REGISTER' ? { allowRegisterCourse: true } : {}),
      ...(options.flowAction === 'CANCEL' ? { allowCancelCourse: true } : {}),
    },
  });

  let targetConfigs = flowConfigs;
  if (options.targetFollowerUsernames && options.targetFollowerUsernames.length > 0) {
    const filterSet = new Set(options.targetFollowerUsernames.map((u) => u.trim().toUpperCase()));
    targetConfigs = targetConfigs.filter((c) => filterSet.has(c.followerUsername.toUpperCase()));
  }

  // Lấy thông tin họ tên sinh viên
  const followerUsernames = targetConfigs.map((c) => c.followerUsername.toUpperCase());
  const studentsInfo = await prisma.student.findMany({
    where: {
      maSV: { in: followerUsernames },
    },
    select: {
      maSV: true,
      hoTen: true,
      hoLot: true,
      ten: true,
    },
  });

  const nameMap = new Map<string, string>();
  studentsInfo.forEach((st) => {
    const fullName = st.hoTen || `${st.hoLot || ''} ${st.ten || ''}`.trim() || st.maSV;
    nameMap.set(st.maSV.toUpperCase(), fullName);
  });

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  const executionResults: any[] = [];

  // 2. Nếu action là SYNC_ALL_COURSES: Lấy danh sách môn của lớp trưởng trước
  let monitorRegisteredCourses: any[] = [];
  if (options.flowAction === 'SYNC_ALL_COURSES') {
    const monitorExtAcc = await prisma.externalAccount.findFirst({
      where: { username: normMonitor, systemKey: 'QLDTTX_PTTC1' },
    });
    if (monitorExtAcc) {
      const regRes = await fetchRegisteredCoursesFromQLDTTX({
        username: monitorExtAcc.extUsername,
        password: monitorExtAcc.extPassword,
        token: monitorExtAcc.token,
      });
      monitorRegisteredCourses = regRes.ds_kqdkmh || [];
    }
  }

  // 3. Thực thi lần lượt cho từng sinh viên
  for (const cfg of targetConfigs) {
    const normFollower = cfg.followerUsername.toUpperCase();
    const studentName = nameMap.get(normFollower) || normFollower;

    // Kiểm tra tài khoản QLDTTX
    const extAcc = await prisma.externalAccount.findFirst({
      where: { username: normFollower, systemKey: 'QLDTTX_PTTC1' },
    });

    if (!extAcc || !extAcc.extUsername || !extAcc.extPassword) {
      skippedCount++;
      const msg = 'Chưa cấu hình tài khoản Cổng QLDTTX (không có mật khẩu)';
      executionResults.push({
        username: normFollower,
        hoTen: studentName,
        success: false,
        status: 'SKIPPED',
        message: msg,
      });

      // Cập nhật kết quả vào DB
      await prisma.monitorFlowConfig.updateMany({
        where: { monitorUsername: normMonitor, followerUsername: normFollower },
        data: {
          lastActionAt: new Date(),
          lastActionType: options.flowAction,
          lastActionResult: 'SKIPPED',
          lastActionMessage: msg,
        },
      });
      continue;
    }

    const creds = {
      username: extAcc.extUsername,
      password: extAcc.extPassword,
      token: extAcc.token,
    };

    try {
      if (options.flowAction === 'REGISTER') {
        if (!options.id_to_hoc) {
          throw new Error('Thiếu id_to_hoc để thực hiện Flow Đăng Ký');
        }

        const res = await registerCourseGroupQLDTTX(creds, {
          id_to_hoc: options.id_to_hoc,
          id_rs: options.id_rs,
          sv_nganh: svNganh,
        });

        if (res.success) {
          successCount++;
          executionResults.push({
            username: normFollower,
            hoTen: studentName,
            success: true,
            status: 'SUCCESS',
            message: `Đăng ký thành công tổ [${options.nhom_to || options.id_to_hoc}]`,
            data: res.ket_qua_dang_ky,
          });
        } else {
          failCount++;
          executionResults.push({
            username: normFollower,
            hoTen: studentName,
            success: false,
            status: 'FAILED',
            message: res.message || 'Đăng ký thất bại (bị trùng lịch hoặc hết slot)',
          });
        }

        await prisma.monitorFlowConfig.updateMany({
          where: { monitorUsername: normMonitor, followerUsername: normFollower },
          data: {
            lastActionAt: new Date(),
            lastActionType: 'REGISTER',
            lastActionResult: res.success ? 'SUCCESS' : 'FAILED',
            lastActionMessage: res.message || (res.success ? 'Đăng ký thành công' : 'Đăng ký thất bại'),
          },
        });
      } else if (options.flowAction === 'CANCEL') {
        if (!options.id_to_hoc) {
          throw new Error('Thiếu id_to_hoc để thực hiện Flow Hủy Môn');
        }

        const res = await cancelCourseGroupQLDTTX(creds, {
          id_to_hoc: options.id_to_hoc,
          id_rs: options.id_rs,
          sv_nganh: svNganh,
        });

        if (res.success) {
          successCount++;
          executionResults.push({
            username: normFollower,
            hoTen: studentName,
            success: true,
            status: 'SUCCESS',
            message: `Hủy thành công tổ [${options.nhom_to || options.id_to_hoc}]`,
          });
        } else {
          failCount++;
          executionResults.push({
            username: normFollower,
            hoTen: studentName,
            success: false,
            status: 'FAILED',
            message: res.message || 'Hủy môn thất bại',
          });
        }

        await prisma.monitorFlowConfig.updateMany({
          where: { monitorUsername: normMonitor, followerUsername: normFollower },
          data: {
            lastActionAt: new Date(),
            lastActionType: 'CANCEL',
            lastActionResult: res.success ? 'SUCCESS' : 'FAILED',
            lastActionMessage: res.message || (res.success ? 'Hủy môn thành công' : 'Hủy môn thất bại'),
          },
        });
      } else if (options.flowAction === 'SYNC_ALL_COURSES') {
        // Đồng bộ toàn bộ các môn của lớp trưởng cho sinh viên này
        let subSuccess = 0;
        let subFail = 0;

        for (const item of monitorRegisteredCourses) {
          const toHoc = item.to_hoc;
          if (!toHoc?.id_to_hoc) continue;

          try {
            const regRes = await registerCourseGroupQLDTTX(creds, {
              id_to_hoc: toHoc.id_to_hoc,
              sv_nganh: svNganh,
            });
            if (regRes.success) subSuccess++;
            else subFail++;
          } catch {
            subFail++;
          }
        }

        const isAllOk = subFail === 0 && subSuccess > 0;
        if (isAllOk || subSuccess > 0) successCount++;
        else failCount++;

        const summaryMsg = `Đã đồng bộ: ${subSuccess} môn thành công, ${subFail} thất bại`;
        executionResults.push({
          username: normFollower,
          hoTen: studentName,
          success: subSuccess > 0,
          status: isAllOk ? 'SUCCESS' : 'FAILED',
          message: summaryMsg,
        });

        await prisma.monitorFlowConfig.updateMany({
          where: { monitorUsername: normMonitor, followerUsername: normFollower },
          data: {
            lastActionAt: new Date(),
            lastActionType: 'SYNC_ALL_COURSES',
            lastActionResult: isAllOk ? 'SUCCESS' : 'PARTIAL',
            lastActionMessage: summaryMsg,
          },
        });
      }
    } catch (err: any) {
      failCount++;
      const errMsg = err.message || 'Lỗi ngoại lệ khi thực thi Flow';
      executionResults.push({
        username: normFollower,
        hoTen: studentName,
        success: false,
        status: 'FAILED',
        message: errMsg,
      });

      await prisma.monitorFlowConfig.updateMany({
        where: { monitorUsername: normMonitor, followerUsername: normFollower },
        data: {
          lastActionAt: new Date(),
          lastActionType: options.flowAction,
          lastActionResult: 'FAILED',
          lastActionMessage: errMsg,
        },
      });
    }
  }

  return {
    success: successCount > 0 || (failCount === 0 && skippedCount === 0),
    flowAction: options.flowAction,
    total: targetConfigs.length,
    successCount,
    failCount,
    skippedCount,
    results: executionResults,
  };
}
