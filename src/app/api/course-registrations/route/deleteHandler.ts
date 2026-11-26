import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { getAuthUser } from './helpers';

// DELETE /api/course-registrations
// Xóa cache kết quả ĐKMH của sinh viên hoặc cả lớp
export async function handleDeleteCourseRegistrations(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || (!authUser.isAdmin && !authUser.isMonitor)) {
      return NextResponse.json(
        { error: 'Chỉ Lớp Trưởng hoặc Quản trị viên mới có quyền xóa dữ liệu ĐKMH' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetUsername = searchParams.get('username')?.trim().toUpperCase();
    const classCode = searchParams.get('classCode')?.trim();

    if (!targetUsername && !classCode) {
      return NextResponse.json({ error: 'Cần cung cấp username hoặc classCode để xóa' }, { status: 400 });
    }

    const where: any = {};
    if (targetUsername) where.username = targetUsername;
    if (classCode) where.classCode = classCode;

    const deleteRes = await prisma.courseRegistration.deleteMany({ where });

    await logActivity({
      req,
      userId: authUser.id,
      username: authUser.username,
      userRole: authUser.role,
      action: 'DELETE_COURSE_REGISTRATION',
      targetType: 'COURSE_REGISTRATION',
      targetId: targetUsername || classCode || 'ALL',
      description: `${authUser.username} đã xóa dữ liệu ĐKMH đã lưu (${deleteRes.count} bản ghi${targetUsername ? ` - SV ${targetUsername}` : ''}${classCode ? ` - Lớp ${classCode}` : ''})`,
      metadata: { targetUsername, classCode, deletedCount: deleteRes.count },
    });

    return NextResponse.json({
      success: true,
      message: `Đã xóa ${deleteRes.count} bản ghi dữ liệu ĐKMH thành công.`,
      deletedCount: deleteRes.count,
    });
  } catch (error: any) {
    console.error('DELETE /api/course-registrations error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi xóa dữ liệu ĐKMH' }, { status: 500 });
  }
}
