import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import {
  fetchLmsDashboardOverview,
  fetchLmsCourseSections,
  getValidLmsTokenOrRefresh,
} from '@/src/features/external-portal/server/lmsServerService';
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

// GET /api/lms/courses
// Lấy dữ liệu tổng quan, danh sách khóa học, tiến độ % và điểm quá trình từ LMS
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để xem thông tin' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUsername = (authUser.isAdmin && searchParams.get('username')) || authUser.username;

    // Tìm tài khoản LMS đã liên kết
    const lmsAccount = await prisma.externalAccount.findUnique({
      where: {
        username_systemKey: {
          username: targetUsername,
          systemKey: 'LMS_PTTC1',
        },
      },
    });

    if (!lmsAccount || !lmsAccount.extUsername) {
      return NextResponse.json({
        isConfigured: false,
        message: 'Bạn chưa liên kết tài khoản Hệ thống học tập trực tuyến (LMS PTTC1).',
      });
    }

    // Lấy dữ liệu tổng quan từ LMS
    const overview = await fetchLmsDashboardOverview({
      username: lmsAccount.extUsername,
      password: lmsAccount.extPassword,
      token: lmsAccount.token,
    });

    // Cập nhật lại thời gian đồng bộ
    await prisma.externalAccount.update({
      where: { id: lmsAccount.id },
      data: {
        lastSyncAt: new Date(),
        status: 'CONNECTED',
      },
    });

    return NextResponse.json({
      success: true,
      isConfigured: true,
      ...overview,
    });
  } catch (error: any) {
    console.error('Fetch LMS Courses Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Lỗi khi đồng bộ dữ liệu khóa học từ LMS PTTC1',
      },
      { status: 500 }
    );
  }
}

// POST /api/lms/courses
// Hỗ trợ các hành động: AUTO_STUDY, COURSE_ACTIVITIES
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện thao tác' }, { status: 401 });
    }

    const body = await req.json();
    const { action, courseId, targetUsername } = body;
    const effectiveUsername = (authUser.isAdmin && targetUsername) || authUser.username;

    const lmsAccount = await prisma.externalAccount.findUnique({
      where: {
        username_systemKey: {
          username: effectiveUsername,
          systemKey: 'LMS_PTTC1',
        },
      },
    });

    if (!lmsAccount || !lmsAccount.extUsername) {
      return NextResponse.json(
        { error: 'Chưa tìm thấy cấu hình tài khoản LMS PTTC1' },
        { status: 404 }
      );
    }

    // Đảm bảo token còn sống
    const { token: validToken } = await getValidLmsTokenOrRefresh({
      username: lmsAccount.extUsername,
      password: lmsAccount.extPassword,
      existingToken: lmsAccount.token,
    });

    // ACTION: Lấy chi tiết hoạt động trong khóa học
    if (action === 'COURSE_ACTIVITIES') {
      if (!courseId) {
        return NextResponse.json({ error: 'Thiếu mã khóa học (courseId)' }, { status: 400 });
      }

      const details = await fetchLmsCourseSections(String(courseId), validToken);
      return NextResponse.json({
        success: true,
        ...details,
      });
    }

    return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('LMS Action Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

