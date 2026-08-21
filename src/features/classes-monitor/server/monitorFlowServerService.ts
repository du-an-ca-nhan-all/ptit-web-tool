import { prisma } from '@/src/lib/prisma';
import {
  registerCourseGroupQLDTTX,
  cancelCourseGroupQLDTTX,
  fetchOpenCourseGroupsFromQLDTTX,
  fetchRegisteredCoursesFromQLDTTX,
} from '@/src/features/external-portal/server/courseRegistrationServerService';
import {
  FlowActionType,
  normalizeFlowAction,
  getFlowActionDefinition,
} from '@/src/features/classes-monitor/types/flow.types';

export interface CourseItem {
  id_to_hoc: string;
  ma_mon: string;
  ten_mon: string;
  nhom_to: string;
  so_tc: number;
  lop?: string;
  tkb?: string;
  phai_dong?: number;
  ngay_dang_ky?: string | null;
  raw?: any;
}

export interface DiffSummary {
  matchedCount: number;      // Số môn trùng mã môn & đúng nhóm tổ
  diffGroupCount: number;    // Số môn trùng mã môn nhưng khác nhóm tổ
  missingCount: number;      // Số môn Lớp trưởng có nhưng sinh viên chưa có
  extraCount: number;        // Số môn sinh viên có nhưng Lớp trưởng không có
  matchPercent: number;      // % Trùng khớp (0 - 100)
}

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
  // Registered Courses Info
  totalCourses: number;
  totalCredits: number;
  tuitionFee: number;
  lastPulledAt?: string | null;
  courses: CourseItem[];
  // Comparison vs Monitor
  diffSummary: DiffSummary;
  // Last Action Record
  lastActionAt?: string | null;
  lastActionType?: string | null;
  lastActionResult?: string | null;
  lastActionMessage?: string | null;
}

export interface MonitorProfileData {
  username: string;
  hoTen: string;
  maLop: string;
  totalCourses: number;
  totalCredits: number;
  tuitionFee: number;
  lastPulledAt?: string | null;
  courses: CourseItem[];
}

/**
 * Trích xuất danh sách môn học từ chuỗi JSON CourseRegistration.data
 */
export function extractCourseListFromData(dataStr?: string | null): CourseItem[] {
  if (!dataStr) return [];
  try {
    const parsed = JSON.parse(dataStr);
    const rawList = parsed?.data?.ds_kqdkmh || parsed?.ds_kqdkmh || (Array.isArray(parsed) ? parsed : []);
    return rawList
      .map((item: any) => {
        const toHoc = item.to_hoc || item;
        const maMon = toHoc.ma_mon || toHoc.MaMH || '';
        const idToHoc = String(toHoc.id_to_hoc || item.id_to_hoc || '').trim();
        if (!maMon && !idToHoc) return null;

        return {
          id_to_hoc: idToHoc,
          ma_mon: maMon,
          ten_mon: toHoc.ten_mon || toHoc.TenMH || maMon,
          nhom_to: String(toHoc.nhom_to || toHoc.NhomHoc || '').trim(),
          so_tc: Number(toHoc.so_tc) || Number(toHoc.so_tc_hp) || 0,
          lop: toHoc.lop || toHoc.Lop || '',
          tkb: toHoc.tkb || '',
          phai_dong: Number(toHoc.phai_dong) || Number(item.hoc_phi_tam_tinh) || 0,
          ngay_dang_ky: item.ngay_dang_ky || null,
          raw: item,
        };
      })
      .filter(Boolean) as CourseItem[];
  } catch {
    return [];
  }
}

/**
 * Tính toán so sánh môn học giữa Lớp trưởng và Sinh viên
 */
export function calculateCourseDiff(monitorCourses: CourseItem[], followerCourses: CourseItem[]): DiffSummary {
  const monitorMapByCode = new Map<string, CourseItem>();
  monitorCourses.forEach((c) => {
    const code = String(c.ma_mon || '').trim().toUpperCase();
    if (code) monitorMapByCode.set(code, c);
  });

  const followerMapByCode = new Map<string, CourseItem>();
  followerCourses.forEach((c) => {
    const code = String(c.ma_mon || '').trim().toUpperCase();
    if (code) followerMapByCode.set(code, c);
  });

  let matchedCount = 0;
  let diffGroupCount = 0;
  let missingCount = 0;
  let extraCount = 0;

  // So sánh môn của Lớp trưởng với Sinh viên
  monitorMapByCode.forEach((monCourse, code) => {
    const folCourse = followerMapByCode.get(code);
    if (!folCourse) {
      missingCount++; // Sinh viên chưa đăng ký môn này
    } else {
      const monGroup = String(monCourse.nhom_to || '').trim().toUpperCase();
      const folGroup = String(folCourse.nhom_to || '').trim().toUpperCase();
      const monId = String(monCourse.id_to_hoc || '').trim();
      const folId = String(folCourse.id_to_hoc || '').trim();

      if ((monId && folId && monId === folId) || (monGroup && folGroup && monGroup === folGroup)) {
        matchedCount++; // Trùng cả mã môn và nhóm tổ
      } else {
        diffGroupCount++; // Trùng mã môn nhưng lệch nhóm tổ
      }
    }
  });

  // Môn sinh viên đăng ký mà Lớp trưởng không có
  followerMapByCode.forEach((_, code) => {
    if (!monitorMapByCode.has(code)) {
      extraCount++;
    }
  });

  const totalMon = monitorCourses.length;
  const matchPercent =
    totalMon > 0
      ? Math.round((matchedCount / totalMon) * 100)
      : followerCourses.length === 0
      ? 100
      : 0;

  return {
    matchedCount,
    diffGroupCount,
    missingCount,
    extraCount,
    matchPercent,
  };
}

/**
 * Lấy danh sách thành viên trong lớp kèm cấu hình Flow Action và Dữ liệu So Sánh Môn Học
 */
export async function getMonitorFlowList(
  monitorUsername: string,
  classCode: string
): Promise<{
  monitorUsername: string;
  classCode: string;
  monitorData: MonitorProfileData | null;
  totalStudents: number;
  activeFollowersCount: number;
  configuredAccountsCount: number;
  students: FollowerStudentItem[];
}> {
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

/**
 * Kéo dữ liệu ĐKMH mới nhất từ Cổng QLDTTX cho Lớp trưởng và tất cả thành viên trong lớp
 */
export async function pullClassCourseRegistrations(monitorUsername: string, classCode: string) {
  const normMonitor = monitorUsername.trim().toUpperCase();
  const normClass = classCode.trim().toUpperCase();

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

export interface ImportFlowStudentItem {
  maSV: string;
  hoTen?: string;
  isEnabled?: boolean;
  allowRegisterCourse?: boolean;
  allowCancelCourse?: boolean;
  autoSyncOnAction?: boolean;
  note?: string;
}

/**
 * Import danh sách sinh viên Flow theo Lớp trưởng
 * Hỗ trợ 2 chế độ:
 * - MERGE: Thêm mới / cập nhật sinh viên trong file, giữ nguyên các sinh viên cũ đang bật flow
 * - REPLACE: Xóa/tắt tất cả cấu hình flow cũ của lớp và CHỈ kích hoạt cho danh sách sinh viên trong file
 */
export async function importMonitorFlowConfigs(options: {
  monitorUsername: string;
  classCode: string;
  mode: 'MERGE' | 'REPLACE';
  defaultAllowRegister?: boolean;
  defaultAllowCancel?: boolean;
  defaultAutoSync?: boolean;
  items: ImportFlowStudentItem[];
}) {
  const normMonitor = options.monitorUsername.trim().toUpperCase();
  const normClass = options.classCode.trim().toUpperCase();
  const mode = options.mode || 'MERGE';

  let disabledOldCount = 0;

  // Nếu là chế độ REPLACE: Tắt flow của tất cả sinh viên cũ trong lớp
  if (mode === 'REPLACE') {
    const updateResult = await prisma.monitorFlowConfig.updateMany({
      where: {
        monitorUsername: normMonitor,
        classCode: normClass,
      },
      data: {
        isEnabled: false,
      },
    });
    disabledOldCount = updateResult.count;
  }

  const validItems: ImportFlowStudentItem[] = [];
  const seenMaSV = new Set<string>();

  for (const item of options.items) {
    const cleanMaSV = (item.maSV || '').trim().toUpperCase();
    if (!cleanMaSV) continue;
    if (cleanMaSV === normMonitor) continue; // Không cho phép tự flow chính mình
    if (seenMaSV.has(cleanMaSV)) continue; // Tránh trùng lặp trong file
    seenMaSV.add(cleanMaSV);
    validItems.push({
      ...item,
      maSV: cleanMaSV,
    });
  }

  const results = [];
  for (const item of validItems) {
    const isEnabled = item.isEnabled !== undefined ? Boolean(item.isEnabled) : true;
    const allowRegisterCourse =
      item.allowRegisterCourse !== undefined
        ? Boolean(item.allowRegisterCourse)
        : options.defaultAllowRegister ?? true;
    const allowCancelCourse =
      item.allowCancelCourse !== undefined
        ? Boolean(item.allowCancelCourse)
        : options.defaultAllowCancel ?? true;
    const autoSyncOnAction =
      item.autoSyncOnAction !== undefined
        ? Boolean(item.autoSyncOnAction)
        : options.defaultAutoSync ?? false;

    const saved = await prisma.monitorFlowConfig.upsert({
      where: {
        monitorUsername_followerUsername: {
          monitorUsername: normMonitor,
          followerUsername: item.maSV,
        },
      },
      create: {
        classCode: normClass,
        monitorUsername: normMonitor,
        followerUsername: item.maSV,
        isEnabled,
        allowRegisterCourse,
        allowCancelCourse,
        autoSyncOnAction,
        note: item.note || null,
      },
      update: {
        classCode: normClass,
        isEnabled,
        allowRegisterCourse,
        allowCancelCourse,
        autoSyncOnAction,
        ...(item.note !== undefined ? { note: item.note } : {}),
      },
    });

    results.push(saved);
  }

  const enabledCount = results.filter((r) => r.isEnabled).length;
  const message =
    mode === 'REPLACE'
      ? `Đã ghi đè toàn bộ: Tắt flow ${disabledOldCount} SV cũ và kích hoạt Flow cho ${enabledCount} sinh viên theo danh sách import!`
      : `Đã import thành công ${results.length} sinh viên (${enabledCount} SV được bật Flow)!`;

  return {
    success: true,
    mode,
    totalImported: results.length,
    enabledCount,
    replacedCount: disabledOldCount,
    message,
    configs: results,
  };
}

/**
 * Thực thi Flow Action từ Lớp trưởng đến các thành viên được cấu hình
 */
export async function executeMonitorFlowAction(options: {
  monitorUsername: string;
  classCode?: string;
  flowAction: FlowActionType | string;
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
  const canonicalAction = normalizeFlowAction(options.flowAction);

  // 1. Lấy danh sách cấu hình flow đang bật của Lớp trưởng
  const flowConfigs = await prisma.monitorFlowConfig.findMany({
    where: {
      monitorUsername: normMonitor,
      isEnabled: true,
      ...(options.classCode ? { classCode: options.classCode.trim().toUpperCase() } : {}),
      ...(canonicalAction === 'COURSE_REGISTER' ? { allowRegisterCourse: true } : {}),
      ...(canonicalAction === 'COURSE_CANCEL' ? { allowCancelCourse: true } : {}),
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

  // 2. Nếu action là COURSE_SYNC_ALL: Lấy danh sách môn của lớp trưởng trước
  let monitorRegisteredCourses: any[] = [];
  if (canonicalAction === 'COURSE_SYNC_ALL') {
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
          lastActionType: canonicalAction,
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
      if (canonicalAction === 'COURSE_REGISTER') {
        if (!options.id_to_hoc) {
          throw new Error('Thiếu id_to_hoc để thực hiện Flow Đăng Ký');
        }

        const res = await registerCourseGroupQLDTTX(creds, {
          id_to_hoc: options.id_to_hoc,
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
            lastActionType: 'COURSE_REGISTER',
            lastActionResult: res.success ? 'SUCCESS' : 'FAILED',
            lastActionMessage: res.message || (res.success ? 'Đăng ký thành công' : 'Đăng ký thất bại'),
          },
        });
      } else if (canonicalAction === 'COURSE_CANCEL') {
        if (!options.id_to_hoc) {
          throw new Error('Thiếu id_to_hoc để thực hiện Flow Hủy Môn');
        }

        const res = await cancelCourseGroupQLDTTX(creds, {
          id_to_hoc: options.id_to_hoc,
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
            lastActionType: 'COURSE_CANCEL',
            lastActionResult: res.success ? 'SUCCESS' : 'FAILED',
            lastActionMessage: res.message || (res.success ? 'Hủy môn thành công' : 'Hủy môn thất bại'),
          },
        });
      } else if (canonicalAction === 'COURSE_SYNC_ALL') {
        // Đồng bộ 2 chiều toàn bộ các môn của lớp trưởng cho sinh viên này (Cả Đăng ký môn thiếu và Hủy môn thừa)
        let regSuccess = 0;
        let regFail = 0;
        let cancelSuccess = 0;
        let cancelFail = 0;

        // 1. Lấy danh sách môn sinh viên hiện đang có trên QLDTTX
        const followerRes = await fetchRegisteredCoursesFromQLDTTX(creds);
        const followerCourses = followerRes.ds_kqdkmh || [];

        const monitorToHocMap = new Map<string, any>();
        monitorRegisteredCourses.forEach((c) => {
          const id = String(c.to_hoc?.id_to_hoc || '').trim();
          if (id) monitorToHocMap.set(id, c);
        });

        const followerToHocMap = new Map<string, any>();
        followerCourses.forEach((c) => {
          const id = String(c.to_hoc?.id_to_hoc || '').trim();
          if (id) followerToHocMap.set(id, c);
        });

        // 2. HỦY các môn mà Sinh viên đang có nhưng Lớp trưởng KHÔNG có (hoặc Lớp trưởng đã hủy)
        if (cfg.allowCancelCourse) {
          for (const [idToHoc, item] of followerToHocMap.entries()) {
            if (!monitorToHocMap.has(idToHoc)) {
              try {
                const cancelRes = await cancelCourseGroupQLDTTX(creds, {
                  id_to_hoc: idToHoc,
                  sv_nganh: svNganh,
                });
                if (cancelRes.success) cancelSuccess++;
                else cancelFail++;
              } catch {
                cancelFail++;
              }
            }
          }
        }

        // 3. ĐĂNG KÝ các môn mà Lớp trưởng CÓ nhưng Sinh viên CHƯA có
        if (cfg.allowRegisterCourse) {
          for (const [idToHoc, item] of monitorToHocMap.entries()) {
            if (!followerToHocMap.has(idToHoc)) {
              try {
                const regRes = await registerCourseGroupQLDTTX(creds, {
                  id_to_hoc: idToHoc,
                  sv_nganh: svNganh,
                });
                if (regRes.success) regSuccess++;
                else regFail++;
              } catch {
                regFail++;
              }
            }
          }
        }

        const hasErrors = cancelFail > 0 || regFail > 0;
        const hasChanges = cancelSuccess > 0 || regSuccess > 0;
        const isMatched = !hasChanges && !hasErrors && followerToHocMap.size === monitorToHocMap.size;

        let summaryMsg = '';
        if (isMatched) {
          summaryMsg = `Đã khớp 100% môn học với Lớp trưởng (${monitorToHocMap.size} môn)`;
        } else {
          const parts = [];
          if (regSuccess > 0) parts.push(`Đăng ký ${regSuccess} môn`);
          if (cancelSuccess > 0) parts.push(`Hủy ${cancelSuccess} môn`);
          if (hasErrors) parts.push(`${regFail + cancelFail} lỗi`);
          summaryMsg = parts.length > 0 ? `Đã đồng bộ: ${parts.join(', ')}` : 'Đã đồng bộ xong';
        }

        const isSuccess = !hasErrors || (regSuccess > 0 || cancelSuccess > 0) || isMatched;
        if (isSuccess) successCount++;
        else failCount++;

        executionResults.push({
          username: normFollower,
          hoTen: studentName,
          success: isSuccess,
          status: isSuccess ? 'SUCCESS' : 'FAILED',
          message: summaryMsg,
        });

        await prisma.monitorFlowConfig.updateMany({
          where: { monitorUsername: normMonitor, followerUsername: normFollower },
          data: {
            lastActionAt: new Date(),
            lastActionType: 'COURSE_SYNC_ALL',
            lastActionResult: isSuccess ? 'SUCCESS' : 'PARTIAL',
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
          lastActionType: canonicalAction,
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
