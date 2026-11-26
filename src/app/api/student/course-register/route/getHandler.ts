import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import {
  fetchOpenCourseGroupsFromQLDTTX,
  fetchRegisteredCoursesFromQLDTTX,
} from '@/src/features/external-portal/server/courseRegistrationServerService';
import {
  findQldttxExternalAccount,
  getAuthUser,
  getMonitorFlowConfigForStudent,
} from './helpers';

export async function handleGetCourseRegister(req: NextRequest) {
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

    // Lấy thông tin cấu hình Flow theo Lớp trưởng nếu có
    const monitorFlowConfig = await getMonitorFlowConfigForStudent(targetUsername);

    // Lấy thông tin tài khoản liên kết QLDTTX
    const extAccount = await findQldttxExternalAccount(targetUsername);

    if (!extAccount) {
      return NextResponse.json({
        success: true,
        isConfigured: false,
        username: targetUsername,
        monitorFlowConfig,
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
      monitorFlowConfig,
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
