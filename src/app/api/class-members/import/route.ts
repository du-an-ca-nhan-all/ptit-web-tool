import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin, checkIsMonitor } from '@/src/lib/auth';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import {
  previewClassMemberImport,
  executeClassMemberImport,
} from '@/src/features/classes-monitor/server/classMemberImportService';

const ImportRowSchema = z.object({
  maSV: z.string().trim().min(1),
  hoLot: z.string().optional(),
  ten: z.string().optional(),
  hoTen: z.string().optional(),
  gioiTinh: z.string().optional(),
  ngaySinh: z.string().optional(),
  soDienThoai: z.string().optional(),
  ghiChu: z.string().optional(),
});

const ImportRequestSchema = z.object({
  mode: z.enum(['PREVIEW', 'EXECUTE']),
  classCode: z.string().trim().min(1, 'Mã lớp (classCode) là bắt buộc'),
  items: z.array(ImportRowSchema).min(1, 'Danh sách import phải có ít nhất 1 sinh viên'),
});

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

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện thao tác này' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ImportRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu đầu vào không hợp lệ' },
        { status: 400 }
      );
    }

    const { mode, classCode, items } = parsed.data;

    // Permission check: Admin or Class Monitor of this class
    const isAdmin = checkIsAdmin(authUser.role);
    const isMonitor = checkIsMonitor(authUser.role);

    if (!isAdmin && !isMonitor) {
      return NextResponse.json(
        { error: 'Chỉ lớp trưởng hoặc quản trị viên mới có quyền import danh sách thành viên lớp' },
        { status: 403 }
      );
    }

    if (!isAdmin && authUser.lop !== classCode) {
      return NextResponse.json(
        { error: `Bạn chỉ có quyền import danh sách cho lớp của mình (${authUser.lop})` },
        { status: 403 }
      );
    }

    if (mode === 'PREVIEW') {
      const preview = await previewClassMemberImport(classCode, items);
      return NextResponse.json({ success: true, preview });
    }

    const result = await executeClassMemberImport(classCode, items);

    await logActivity({
      req,
      userId: authUser.id,
      username: authUser.username,
      userRole: authUser.role,
      action: 'IMPORT_CLASS_MEMBERS',
      targetType: 'CLASS',
      targetId: classCode,
      description: `Import danh sách thành viên lớp ${classCode}: ${result.totalImported} SV (Chuyển lớp sang: ${result.transferredCount}, Thôi học: ${result.droppedOutCount}, Khôi phục: ${result.restoredCount}, Thêm mới: ${result.createdCount})`,
      metadata: {
        classCode,
        totalImported: result.totalImported,
        droppedOutCount: result.droppedOutCount,
        transferredCount: result.transferredCount,
        restoredCount: result.restoredCount,
        createdCount: result.createdCount,
        unchangedCount: result.unchangedCount,
        droppedOutMaSVs: result.droppedOutMaSVs,
        transferredMaSVs: result.transferredMaSVs,
        restoredMaSVs: result.restoredMaSVs,
        createdMaSVs: result.createdMaSVs,
        executedBy: authUser.username,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Import thành công ${result.totalImported} thành viên cho lớp ${classCode} (Chuyển sang: ${result.transferredCount}, Thôi học: ${result.droppedOutCount}, Thêm mới: ${result.createdCount}, Khôi phục: ${result.restoredCount})`,
      result,
    });
  } catch (error: any) {
    console.error('Class members import error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi máy chủ khi xử lý import' }, { status: 500 });
  }
}
