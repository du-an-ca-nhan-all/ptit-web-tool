import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { AuthUser } from '@/src/lib/auth';
import {
  fetchOpenCourseGroupsFromQLDTTX,
  registerCourseGroupQLDTTX,
  cancelCourseGroupQLDTTX,
} from '@/src/features/external-portal/server/courseRegistrationServerService';
import { enqueueFlowAction } from '@/src/features/classes-monitor/server/monitorFlowQueueServerService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { QldttxAccountCreds, QldttxExternalAccount } from './helpers';

interface CourseMutationContext {
  req: NextRequest;
  authUser: AuthUser;
  effectiveUsername: string;
  extAccount: QldttxExternalAccount;
  accountCreds: QldttxAccountCreds;
  id_to_hoc: any;
  id_rs: any;
  sv_nganh: any;
}

// 1. ACTION: CHECK_SLOTS (Phục vụ Auto Canh Slot / Sniper)
export async function handleCheckSlotsAction(accountCreds: QldttxAccountCreds, targetKeys: any) {
  const openResult = await fetchOpenCourseGroupsFromQLDTTX(accountCreds);
  const groups = openResult.ds_nhom_to || [];
  const subjectDict = (openResult.ds_mon_hoc || []).reduce((acc: any, cur: any) => {
    acc[cur.ma.toUpperCase()] = cur.ten;
    return acc;
  }, {});

  const keys: string[] = Array.isArray(targetKeys) ? targetKeys.map((k: string) => String(k).trim().toUpperCase()) : [];

  const matchedTargets: any[] = [];
  const availableTargets: any[] = [];

  for (const group of groups) {
    const maMonUpper = (group.ma_mon || '').toUpperCase();
    const idToHocStr = String(group.id_to_hoc);
    const isMatch = keys.length === 0 || keys.includes(maMonUpper) || keys.includes(idToHocStr);

    if (isMatch) {
      const item = {
        id_to_hoc: group.id_to_hoc,
        ma_mon: group.ma_mon,
        ten_mon: group.ten_mon || subjectDict[maMonUpper] || group.ma_mon,
        nhom_to: group.nhom_to,
        sl_dk: group.sl_dk,
        sl_cl: group.sl_cl,
        sl_cp: group.sl_cp,
        enable: group.enable,
        gc_enable: group.gc_enable,
        tkb: group.tkb,
        so_tc: group.so_tc || group.so_tc_hp,
      };
      matchedTargets.push(item);

      if (group.enable && group.sl_cl > 0) {
        availableTargets.push(item);
      }
    }
  }

  return NextResponse.json({
    success: true,
    totalGroups: groups.length,
    id_rs: openResult.id_rs,
    trong_thoi_gian_dang_ky: openResult.trong_thoi_gian_dang_ky,
    matchedTargets,
    availableTargets,
    hasAvailableSlot: availableTargets.length > 0,
  });
}

// 2. ACTION: REGISTER (Đăng ký môn học)
export async function handleRegisterCourseAction(ctx: CourseMutationContext) {
  const { req, authUser, effectiveUsername, extAccount, accountCreds, id_to_hoc, id_rs, sv_nganh } = ctx;

  if (!id_to_hoc) {
    return NextResponse.json({ error: 'Mã id_to_hoc là bắt buộc để đăng ký' }, { status: 400 });
  }

  const regResult = await registerCourseGroupQLDTTX(accountCreds, {
    id_to_hoc: String(id_to_hoc),
    id_rs: id_rs || undefined,
    sv_nganh: Number(sv_nganh) || 1,
  });

  // Nếu người đăng ký là Lớp trưởng và có thành viên đang BẬT Flow Đăng Ký -> Đưa vào Hàng Đợi xử lý ngầm
  let flowSummary: any = null;
  if (regResult.success) {
    const activeFollowers = await prisma.monitorFlowConfig.findMany({
      where: {
        monitorUsername: effectiveUsername,
        isEnabled: true,
        allowRegisterCourse: true,
      },
    });

    if (activeFollowers.length > 0) {
      try {
        flowSummary = await enqueueFlowAction({
          monitorUsername: effectiveUsername,
          classCode: authUser.lop || '',
          flowAction: 'REGISTER',
          id_to_hoc: String(id_to_hoc),
          sv_nganh: Number(sv_nganh) || 1,
          targetFollowerUsernames: activeFollowers.map((f) => f.followerUsername),
        });
      } catch (flowErr: any) {
        console.error('Lỗi khi tự động Flow Đăng Ký cho thành viên:', flowErr);
      }
    }
  }

  // Ghi log hoạt động
  await logActivity({
    req,
    userId: authUser.id,
    username: authUser.username,
    userRole: authUser.role,
    action: 'COURSE_REGISTER',
    targetType: 'COURSE_REGISTRATION',
    targetId: String(id_to_hoc),
    description: regResult.success
      ? `Đăng ký môn học thành công: Tổ học ID [${id_to_hoc}]${flowSummary ? ` (Đã đưa ${flowSummary.totalItems} tác vụ vào Hàng Đợi Flow)` : ''}`
      : `Đăng ký môn học thất bại: Tổ học ID [${id_to_hoc}] - ${regResult.message}`,
    metadata: { id_to_hoc, result: regResult, flowSummary },
  });

  // Nếu có token mới thì cập nhật
  if (regResult.newToken && regResult.newToken !== extAccount.token) {
    await prisma.externalAccount.update({
      where: { id: extAccount.id },
      data: { token: regResult.newToken, lastSyncAt: new Date() },
    });
  }

  let responseMsg = regResult.message;
  if (regResult.success && flowSummary && flowSummary.totalItems > 0) {
    responseMsg = `${regResult.message} • Đã đưa ${flowSummary.totalItems} thành viên vào Hàng Đợi Flow xử lý ngầm`;
  }

  return NextResponse.json({
    success: regResult.success,
    message: responseMsg,
    id_rs: regResult.id_rs,
    ket_qua_dang_ky: regResult.ket_qua_dang_ky,
    rawResponse: regResult.rawResponse,
    flowSummary,
  });
}

// 3. ACTION: CANCEL (Hủy đăng ký môn học)
export async function handleCancelCourseAction(ctx: CourseMutationContext) {
  const { req, authUser, effectiveUsername, extAccount, accountCreds, id_to_hoc, id_rs, sv_nganh } = ctx;

  if (!id_to_hoc) {
    return NextResponse.json({ error: 'Mã id_to_hoc là bắt buộc để hủy đăng ký' }, { status: 400 });
  }

  const cancelResult = await cancelCourseGroupQLDTTX(accountCreds, {
    id_to_hoc: String(id_to_hoc),
    id_rs: id_rs || undefined,
    sv_nganh: Number(sv_nganh) || 1,
  });

  // Nếu người hủy là Lớp trưởng và có thành viên đang BẬT Flow Hủy Môn -> Đưa vào Hàng Đợi xử lý ngầm (và hủy lệnh đăng ký chờ nếu có)
  let flowSummary: any = null;
  if (cancelResult.success) {
    const activeFollowers = await prisma.monitorFlowConfig.findMany({
      where: {
        monitorUsername: effectiveUsername,
        isEnabled: true,
        allowCancelCourse: true,
      },
    });

    if (activeFollowers.length > 0) {
      try {
        flowSummary = await enqueueFlowAction({
          monitorUsername: effectiveUsername,
          classCode: authUser.lop || '',
          flowAction: 'CANCEL',
          id_to_hoc: String(id_to_hoc),
          sv_nganh: Number(sv_nganh) || 1,
          targetFollowerUsernames: activeFollowers.map((f) => f.followerUsername),
        });
      } catch (flowErr: any) {
        console.error('Lỗi khi tự động Flow Hủy Môn cho thành viên:', flowErr);
      }
    }
  }

  await logActivity({
    req,
    userId: authUser.id,
    username: authUser.username,
    userRole: authUser.role,
    action: 'COURSE_CANCEL',
    targetType: 'COURSE_REGISTRATION',
    targetId: String(id_to_hoc),
    description: cancelResult.success
      ? `Hủy môn học thành công: Tổ học ID [${id_to_hoc}]${flowSummary ? ` (Đã đưa ${flowSummary.totalItems} tác vụ Hủy vào Hàng Đợi Flow)` : ''}`
      : `Hủy môn học thất bại: Tổ học ID [${id_to_hoc}] - ${cancelResult.message}`,
    metadata: { id_to_hoc, result: cancelResult, flowSummary },
  });

  if (cancelResult.newToken && cancelResult.newToken !== extAccount.token) {
    await prisma.externalAccount.update({
      where: { id: extAccount.id },
      data: { token: cancelResult.newToken, lastSyncAt: new Date() },
    });
  }

  let responseMsg = cancelResult.message;
  if (cancelResult.success && flowSummary && flowSummary.total > 0) {
    responseMsg = `${cancelResult.message} • Đã Flow hủy cho ${flowSummary.total} thành viên (${flowSummary.successCount} thành công, ${flowSummary.failCount} thất bại, ${flowSummary.skippedCount} bỏ qua)`;
  }

  return NextResponse.json({
    success: cancelResult.success,
    message: responseMsg,
    id_rs: cancelResult.id_rs,
    rawResponse: cancelResult.rawResponse,
    flowSummary,
  });
}
