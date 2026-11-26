import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { checkIsAdmin } from '@/src/lib/auth';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { getAuthUser } from './auth';

export async function handleDeleteClassMember(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const maSV = searchParams.get('maSV');
    const classCode = searchParams.get('classCode');

    if (!maSV) {
      return NextResponse.json({ error: 'maSV là bắt buộc' }, { status: 400 });
    }

    const cleanMaSV = maSV.toUpperCase();

    // Check student's class
    const student = await prisma.student.findUnique({ where: { maSV: cleanMaSV } });
    const targetClass = classCode || student?.maLop;

    const isAdmin = checkIsAdmin(authUser.role);
    if (!isAdmin && targetClass && authUser.lop !== targetClass) {
      return NextResponse.json(
        { error: `Bạn chỉ có quyền xóa sinh viên thuộc lớp của mình (${authUser.lop})` },
        { status: 403 }
      );
    }

    // Delete student & linked user (cascade)
    await prisma.student.deleteMany({
      where: {
        maSV: cleanMaSV,
      },
    });

    await prisma.user.deleteMany({
      where: {
        username: cleanMaSV,
      },
    });

    await logActivity({
      req,
      userId: authUser.id,
      username: authUser.username,
      userRole: authUser.role,
      action: 'DELETE_STUDENT',
      targetType: 'STUDENT',
      targetId: cleanMaSV,
      description: `Đã xóa sinh viên ${cleanMaSV} (${student?.hoTen || ''}) khỏi lớp ${targetClass || ''}`,
      metadata: {
        maSV: cleanMaSV,
        hoTen: student?.hoTen,
        targetClass,
        deletedBy: authUser.username,
      },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa sinh viên khỏi danh sách' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
