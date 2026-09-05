import { NextResponse } from 'next/server';
import { getCurrentUserFromCookie } from '@/src/lib/auth';
import { getStudentCurrentCourses } from '@/src/features/reminders';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const courses = await getStudentCurrentCourses(user.username);

    return NextResponse.json({
      success: true,
      courses,
      total: courses.length,
    });
  } catch (err: any) {
    console.error('[API /api/reminders/courses GET] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Lỗi khi tải danh sách môn học' },
      { status: 500 }
    );
  }
}
