import { NextRequest } from 'next/server';
import { handleGetCourseRegister } from './route/getHandler';
import { handlePostCourseRegister } from './route/postHandler';

// GET /api/student/course-register
// Lấy danh sách môn học đang mở đăng ký & danh sách môn đã đăng ký từ cổng QLDTTX
export async function GET(req: NextRequest) {
  return handleGetCourseRegister(req);
}

// POST /api/student/course-register
// Thực hiện các thao tác: Đăng ký môn (REGISTER), Hủy môn (CANCEL), Kiểm tra slot (CHECK_SLOTS)
export async function POST(req: NextRequest) {
  return handlePostCourseRegister(req);
}
