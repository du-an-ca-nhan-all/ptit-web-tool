import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from './route/helpers';
import { handleGetCourseRegistrations } from './route/getHandler';
import { handleBatchPullCourseRegistrations } from './route/batchPullHandler';
import { handleSinglePullCourseRegistrations } from './route/singlePullHandler';
import { handleDeleteCourseRegistrations } from './route/deleteHandler';

// GET /api/course-registrations
// Returns registered courses for a student or class (supports multi-semester & past semesters)
export async function GET(req: NextRequest) {
  return handleGetCourseRegistrations(req);
}

// POST /api/course-registrations
// Pull (Sync) registered courses from QLDTTX (including all past semesters & current registration) and save to CourseRegistration
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện thao tác' }, { status: 401 });
    }

    const body = await req.json();
    const { action = 'PULL', targetUsername, classCode: reqClassCode } = body;

    const effectiveUsername = (targetUsername || authUser.username).toUpperCase();

    // Permission check
    if (effectiveUsername !== authUser.username.toUpperCase() && !authUser.isAdmin && !authUser.isMonitor) {
      return NextResponse.json({ error: 'Bạn không có quyền đồng bộ cho sinh viên khác' }, { status: 403 });
    }

    // 1. ACTION: BATCH PULL (For Admin / Monitor - Pull all semesters for all students in class)
    if (action === 'BATCH_PULL') {
      return await handleBatchPullCourseRegistrations(req, authUser, reqClassCode);
    }

    // 2. ACTION: SINGLE PULL (Pull for one student: current registration + all past semesters)
    return await handleSinglePullCourseRegistrations(req, authUser, effectiveUsername, reqClassCode);
  } catch (error: any) {
    console.error('Course registration action error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi đồng bộ môn học từ QLDTTX' }, { status: 500 });
  }
}

// DELETE /api/course-registrations
// Xóa cache kết quả ĐKMH của sinh viên hoặc cả lớp
export async function DELETE(req: NextRequest) {
  return handleDeleteCourseRegistrations(req);
}
