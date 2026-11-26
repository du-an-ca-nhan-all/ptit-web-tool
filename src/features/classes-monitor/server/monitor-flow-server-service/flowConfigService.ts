import { prisma } from '@/src/lib/prisma';
import { ImportFlowStudentItem } from './types';

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
