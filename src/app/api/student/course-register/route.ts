import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import {
  fetchOpenCourseGroupsFromQLDTTX,
  fetchRegisteredCoursesFromQLDTTX,
  registerCourseGroupQLDTTX,
  cancelCourseGroupQLDTTX,
} from '@/src/features/external-portal/server/courseRegistrationServerService';
import { enqueueFlowAction } from '@/src/features/classes-monitor/server/monitorFlowQueueServerService';
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

// GET /api/student/course-register
// Lấy danh sách môn học đang mở đăng ký & danh sách môn đã đăng ký từ cổng QLDTTX
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để truy cập Cổng Đăng Ký Môn Học' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUsername = (searchParams.get('username') || authUser.username).toUpperCase();

    // Phân quyền
    if (targetUsername !== authUser.username.toUpperCase() && !authUser.isAdmin && !authUser.isMonitor) {
      return NextResponse.json({ error: 'Bạn không có quyền truy cập thông tin của sinh viên khác' }, { status: 403 });
    }

    // Lấy thông tin tài khoản liên kết QLDTTX
    const extAccount = await prisma.externalAccount.findFirst({
      where: {
        username: targetUsername,
        systemKey: 'QLDTTX_PTTC1',
      },
    });

    if (!extAccount) {
      return NextResponse.json({
        success: true,
        isConfigured: false,
        username: targetUsername,
        message: `Sinh viên ${targetUsername} chưa liên kết tài khoản Cổng Quản Lý Đào Tạo Từ Xa (QLDTTX).`,
        openCourses: {
          ds_nhom_to: [],
          ds_mon_hoc: [],
          hoc_ky_dang_ky: '',
          trong_thoi_gian_dang_ky: false,
          id_rs: '',
        },
        registeredCourses: {
          ds_kqdkmh: [],
          totalCourses: 0,
          totalCredits: 0,
          tuitionFee: 0,
          id_rs: '',
        },
        externalAccount: {
          isConfigured: false,
          status: 'DISCONNECTED',
          username: targetUsername,
        },
      });
    }

    // Gọi đồng thời cả 2 API từ QLDTTX: Môn mở & Môn đã đăng ký
    const [openRes, regRes] = await Promise.allSettled([
      fetchOpenCourseGroupsFromQLDTTX({
        username: extAccount.extUsername,
        password: extAccount.extPassword,
        token: extAccount.token,
      }),
      fetchRegisteredCoursesFromQLDTTX({
        username: extAccount.extUsername,
        password: extAccount.extPassword,
        token: extAccount.token,
      }),
    ]);

    let openCoursesData = {
      ds_nhom_to: [] as any[],
      ds_mon_hoc: [] as any[],
      hoc_ky_dang_ky: '',
      trong_thoi_gian_dang_ky: true,
      id_rs: '',
    };

    let registeredCoursesData = {
      ds_kqdkmh: [] as any[],
      totalCourses: 0,
      totalCredits: 0,
      tuitionFee: 0,
      id_rs: '',
    };

    let newTokenToSave: string | undefined;

    if (openRes.status === 'fulfilled') {
      openCoursesData = {
        ds_nhom_to: openRes.value.ds_nhom_to,
        ds_mon_hoc: openRes.value.ds_mon_hoc,
        hoc_ky_dang_ky: openRes.value.hoc_ky_dang_ky,
        trong_thoi_gian_dang_ky: openRes.value.trong_thoi_gian_dang_ky,
        id_rs: openRes.value.id_rs,
      };
      if (openRes.value.newToken) newTokenToSave = openRes.value.newToken;
    }

    if (regRes.status === 'fulfilled') {
      registeredCoursesData = {
        ds_kqdkmh: regRes.value.ds_kqdkmh,
        totalCourses: regRes.value.totalCourses,
        totalCredits: regRes.value.totalCredits,
        tuitionFee: regRes.value.tuitionFee,
        id_rs: regRes.value.id_rs || openCoursesData.id_rs,
      };
      if (regRes.value.newToken) newTokenToSave = regRes.value.newToken;
    }

    // Nếu cả 2 đều lỗi kết nối
    if (openRes.status === 'rejected' && regRes.status === 'rejected') {
      const errorMsg = (openRes.reason?.message || regRes.reason?.message || 'Lỗi kết nối cổng QLDTTX');
      return NextResponse.json({
        success: false,
        error: `Không thể tải dữ liệu từ Cổng QLDTTX: ${errorMsg}`,
        isConfigured: true,
        externalAccount: {
          isConfigured: true,
          status: 'ERROR',
          syncMessage: errorMsg,
          username: targetUsername,
        },
      }, { status: 502 });
    }

    // Cập nhật token mới nếu có
    if (newTokenToSave && newTokenToSave !== extAccount.token) {
      await prisma.externalAccount.update({
        where: { id: extAccount.id },
        data: {
          token: newTokenToSave,
          status: 'CONNECTED',
          lastSyncAt: new Date(),
          syncMessage: 'Đồng bộ kết nối thành công',
        },
      });
    }

    // Tạo từ điển môn học để gán tên môn vào từng nhóm tổ nếu nhóm tổ chưa có
    const subjectMap: Record<string, string> = {};
    openCoursesData.ds_mon_hoc.forEach((m: any) => {
      if (m.ma) subjectMap[m.ma.toUpperCase()] = m.ten;
    });

    const enrichedGroups = openCoursesData.ds_nhom_to.map((g: any) => ({
      ...g,
      ten_mon: g.ten_mon || subjectMap[g.ma_mon?.toUpperCase()] || g.ma_mon,
    }));

    return NextResponse.json({
      success: true,
      isConfigured: true,
      username: targetUsername,
      openCourses: {
        ...openCoursesData,
        ds_nhom_to: enrichedGroups,
      },
      registeredCourses: registeredCoursesData,
      externalAccount: {
        isConfigured: true,
        status: extAccount.status,
        hasToken: !!(newTokenToSave || extAccount.token),
        lastSyncAt: extAccount.lastSyncAt?.toISOString() || new Date().toISOString(),
        username: targetUsername,
      },
    });
  } catch (error: any) {
    console.error('Course registration portal GET error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống khi tải thông tin ĐKMH' }, { status: 500 });
  }
}

// POST /api/student/course-register
// Thực hiện các thao tác: Đăng ký môn (REGISTER), Hủy môn (CANCEL), Kiểm tra slot (CHECK_SLOTS)
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện thao tác' }, { status: 401 });
    }

    const body = await req.json();
    const {
      action = 'REGISTER', // 'REGISTER' | 'CANCEL' | 'CHECK_SLOTS'
      id_to_hoc,
      id_rs,
      sv_nganh = 1,
      targetUsername,
      targetKeys, // For CHECK_SLOTS: ['TAB1', 'TT03', '-23049182390']
    } = body;

    const effectiveUsername = (targetUsername || authUser.username).toUpperCase();

    // Check permission
    if (effectiveUsername !== authUser.username.toUpperCase() && !authUser.isAdmin && !authUser.isMonitor) {
      return NextResponse.json({ error: 'Bạn không có quyền thao tác trên tài khoản khác' }, { status: 403 });
    }

    // Lấy thông tin tài khoản QLDTTX
    const extAccount = await prisma.externalAccount.findFirst({
      where: {
        username: effectiveUsername,
        systemKey: 'QLDTTX_PTTC1',
      },
    });

    if (!extAccount) {
      return NextResponse.json(
        { error: 'Chưa liên kết tài khoản Cổng QLDTTX. Vui lòng vào Hồ sơ cá nhân để cấu hình trước.' },
        { status: 400 }
      );
    }

    const accountCreds = {
      username: extAccount.extUsername,
      password: extAccount.extPassword,
      token: extAccount.token,
    };

    // 1. ACTION: CHECK_SLOTS (Phục vụ Auto Canh Slot / Sniper)
    if (action === 'CHECK_SLOTS') {
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
    if (action === 'REGISTER') {
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
    if (action === 'CANCEL') {
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

    return NextResponse.json({ error: `Hành động '${action}' không được hỗ trợ` }, { status: 400 });
  } catch (error: any) {
    console.error('Course registration portal POST error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi thực hiện thao tác ĐKMH' }, { status: 500 });
  }
}
