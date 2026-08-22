import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import {
  getOrFetchStudentLmsOverview,
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
// Lấy dữ liệu tổng quan, danh sách khóa học, tiến độ % và điểm quá trình từ LMS (có Cache DB & quy tắc 24h)
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để xem thông tin' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const refresh = searchParams.get('refresh') === 'true';
    const targetUsername = (authUser.isAdmin && searchParams.get('username')) || authUser.username;

    // Lấy dữ liệu từ Cache DB hoặc kéo mới từ LMS
    const result = await getOrFetchStudentLmsOverview(targetUsername, {
      forceRefresh: refresh,
    });

    if (result.isConfigured === false) {
      return NextResponse.json({
        isConfigured: false,
        message: 'Bạn chưa liên kết tài khoản Hệ thống học tập trực tuyến (LMS PTTC1).',
      });
    }

    if (refresh) {
      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'LMS_REFRESH_COURSES',
        targetType: 'LMS_COURSES',
        targetId: targetUsername,
        description: `Làm mới dữ liệu khóa học từ LMS PTTC1 (${result.courses?.length || 0} môn học)`,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      ...result,
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
// Hỗ trợ các hành động: COURSE_ACTIVITIES
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện thao tác' }, { status: 401 });
    }

    const body = await req.json();
    const { action, courseId, targetUsername } = body;
    const effectiveUsername = (authUser.isAdmin && targetUsername) || authUser.username;

    const lmsAccount = await prisma.externalAccount.findFirst({
      where: {
        username: effectiveUsername,
        OR: [
          { systemKey: 'LMS_PTTC1' },
          { systemUrl: { contains: 'lms.pttc1.edu.vn' } },
        ],
      },
    });

    if (!lmsAccount || !lmsAccount.extUsername) {
      return NextResponse.json(
        { error: 'Chưa tìm thấy cấu hình tài khoản LMS PTTC1' },
        { status: 404 }
      );
    }

    // Đảm bảo token còn sống (hoặc tự động đăng nhập lại nếu token hết hạn)
    const { token: validToken, isNew } = await getValidLmsTokenOrRefresh({
      username: lmsAccount.extUsername,
      password: lmsAccount.extPassword,
      existingToken: lmsAccount.token,
    });

    if (isNew) {
      await prisma.externalAccount
        .update({
          where: { id: lmsAccount.id },
          data: {
            token: validToken,
            lastSyncAt: new Date(),
            status: 'CONNECTED',
          },
        })
        .catch(() => {});
    }

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
