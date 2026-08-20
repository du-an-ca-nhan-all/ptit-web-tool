import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin } from '@/src/lib/auth';
import { logActivity } from '@/src/lib/activityLog';

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

// GET /api/exam-batches
// Returns all exam batches with summary statistics
export async function GET(req: NextRequest) {
  try {
    const batches = await prisma.examBatch.findMany({
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { examRecords: true },
        },
      },
    });

    // Compute student and room counts per batch
    const batchesWithStats = await Promise.all(
      batches.map(async (b) => {
        const studentCountRaw = await prisma.examRecord.findMany({
          where: { batchCode: b.code },
          distinct: ['maSV'],
          select: { maSV: true },
        });

        const roomCountRaw = await prisma.examRecord.findMany({
          where: { batchCode: b.code, mapThi: { not: null } },
          distinct: ['mapThi'],
          select: { mapThi: true },
        });

        return {
          id: b.id,
          code: b.code,
          name: b.name,
          semester: b.semester || '',
          academicYear: b.academicYear || '',
          startDate: b.startDate || '',
          endDate: b.endDate || '',
          isActive: b.isActive,
          description: b.description || '',
          totalRecords: b._count.examRecords,
          totalStudents: studentCountRaw.length,
          totalRooms: roomCountRaw.length,
          createdAt: b.createdAt.toISOString(),
          updatedAt: b.updatedAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      batches: batchesWithStats,
      activeBatch: batchesWithStats.find((b) => b.isActive) || batchesWithStats[0] || null,
      total: batchesWithStats.length,
    });
  } catch (error: any) {
    console.error('Fetch exam batches error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/exam-batches
// Create, update, activate, or delete an exam batch (Admin only)
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !checkIsAdmin(authUser.role)) {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên (Admin) mới có quyền quản lý đợt thi' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, code, name, semester, academicYear, startDate, endDate, description, isActive } = body;

    // 1. ACTION: CREATE
    if (action === 'CREATE') {
      if (!code || !name) {
        return NextResponse.json({ error: 'Mã đợt thi (code) và Tên đợt thi (name) là bắt buộc' }, { status: 400 });
      }

      const cleanCode = String(code).trim().toUpperCase();

      const existing = await prisma.examBatch.findUnique({ where: { code: cleanCode } });
      if (existing) {
        return NextResponse.json({ error: `Mã đợt thi ${cleanCode} đã tồn tại` }, { status: 400 });
      }

      if (isActive) {
        // Deactivate all others
        await prisma.examBatch.updateMany({ data: { isActive: false } });
      }

      const newBatch = await prisma.examBatch.create({
        data: {
          code: cleanCode,
          name: String(name).trim(),
          semester: semester ? String(semester).trim() : null,
          academicYear: academicYear ? String(academicYear).trim() : null,
          startDate: startDate ? String(startDate).trim() : null,
          endDate: endDate ? String(endDate).trim() : null,
          description: description ? String(description).trim() : null,
          isActive: isActive !== undefined ? !!isActive : true,
        },
      });

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'CREATE_BATCH',
        targetType: 'EXAM_BATCH',
        targetId: cleanCode,
        description: `Tạo mới đợt thi: ${newBatch.name} (Mã: ${cleanCode})`,
        metadata: { cleanCode, name, semester, academicYear, isActive },
      });

      return NextResponse.json({
        success: true,
        message: `Đã tạo thành công đợt thi ${newBatch.name}`,
        batch: newBatch,
      });
    }

    // 2. ACTION: SET_ACTIVE
    if (action === 'SET_ACTIVE') {
      if (!code) {
        return NextResponse.json({ error: 'Mã đợt thi (code) là bắt buộc' }, { status: 400 });
      }

      const cleanCode = String(code).trim().toUpperCase();

      // Deactivate all
      await prisma.examBatch.updateMany({ data: { isActive: false } });

      // Activate target
      const activated = await prisma.examBatch.update({
        where: { code: cleanCode },
        data: { isActive: true },
      });

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'UPDATE_BATCH',
        targetType: 'EXAM_BATCH',
        targetId: cleanCode,
        description: `Đặt đợt thi "${activated.name}" (${cleanCode}) làm đợt thi mặc định kích hoạt`,
      });

      return NextResponse.json({
        success: true,
        message: `Đã đặt đợt thi "${activated.name}" làm đợt thi mặc định`,
        batch: activated,
      });
    }

    // 3. ACTION: TOGGLE (Bật / Tắt đợt thi)
    if (action === 'TOGGLE') {
      if (!code) {
        return NextResponse.json({ error: 'Mã đợt thi (code) là bắt buộc' }, { status: 400 });
      }

      const cleanCode = String(code).trim().toUpperCase();
      const current = await prisma.examBatch.findUnique({ where: { code: cleanCode } });
      if (!current) {
        return NextResponse.json({ error: 'Không tìm thấy đợt thi' }, { status: 404 });
      }

      const newActive = !current.isActive;
      const updated = await prisma.examBatch.update({
        where: { code: cleanCode },
        data: { isActive: newActive },
      });

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'UPDATE_BATCH',
        targetType: 'EXAM_BATCH',
        targetId: cleanCode,
        description: newActive
          ? `BẬT trạng thái đợt thi "${updated.name}" (${cleanCode})`
          : `TẮT trạng thái đợt thi "${updated.name}" (${cleanCode})`,
      });

      return NextResponse.json({
        success: true,
        message: newActive
          ? `Đã BẬT đợt thi "${updated.name}"`
          : `Đã TẮT đợt thi "${updated.name}"`,
        batch: updated,
      });
    }

    // 4. ACTION: UPDATE
    if (action === 'UPDATE') {
      if (!code) {
        return NextResponse.json({ error: 'Mã đợt thi (code) là bắt buộc' }, { status: 400 });
      }

      const cleanCode = String(code).trim().toUpperCase();

      if (isActive) {
        await prisma.examBatch.updateMany({ data: { isActive: false } });
      }

      const updated = await prisma.examBatch.update({
        where: { code: cleanCode },
        data: {
          name: name ? String(name).trim() : undefined,
          semester: semester !== undefined ? String(semester).trim() : undefined,
          academicYear: academicYear !== undefined ? String(academicYear).trim() : undefined,
          startDate: startDate !== undefined ? String(startDate).trim() : undefined,
          endDate: endDate !== undefined ? String(endDate).trim() : undefined,
          description: description !== undefined ? String(description).trim() : undefined,
          isActive: isActive !== undefined ? !!isActive : undefined,
        },
      });

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'UPDATE_BATCH',
        targetType: 'EXAM_BATCH',
        targetId: cleanCode,
        description: `Cập nhật thông tin đợt thi: ${updated.name} (${cleanCode})`,
        metadata: { cleanCode, name, semester, academicYear, isActive },
      });

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật thông tin đợt thi ${updated.name}`,
        batch: updated,
      });
    }

    // 5. ACTION: DELETE
    if (action === 'DELETE') {
      if (!code) {
        return NextResponse.json({ error: 'Mã đợt thi (code) là bắt buộc' }, { status: 400 });
      }

      const cleanCode = String(code).trim().toUpperCase();

      // Đợt thi luôn luôn tồn tại ít nhất 1 đợt
      const totalCount = await prisma.examBatch.count();
      if (totalCount <= 1) {
        return NextResponse.json(
          { error: 'Hệ thống luôn yêu cầu phải có ít nhất 1 đợt thi. Bạn không thể xóa đợt thi duy nhất còn lại.' },
          { status: 400 }
        );
      }

      const deleteRecords = body.deleteRecords === true;

      if (deleteRecords) {
        // Delete associated exam records
        await prisma.examRecord.deleteMany({ where: { batchCode: cleanCode } });
      } else {
        // Detach batchCode from exam records (preserve records)
        await prisma.examRecord.updateMany({
          where: { batchCode: cleanCode },
          data: { batchCode: null },
        });
      }

      await prisma.examBatch.delete({ where: { code: cleanCode } });

      // If active batch was deleted, activate the latest remaining batch if any
      const activeRemaining = await prisma.examBatch.findFirst({ where: { isActive: true } });
      if (!activeRemaining) {
        const latest = await prisma.examBatch.findFirst({ orderBy: { createdAt: 'desc' } });
        if (latest) {
          await prisma.examBatch.update({ where: { id: latest.id }, data: { isActive: true } });
        }
      }

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'DELETE_BATCH',
        targetType: 'EXAM_BATCH',
        targetId: cleanCode,
        description: deleteRecords
          ? `Xóa đợt thi ${cleanCode} và toàn bộ dữ liệu lịch thi liên quan`
          : `Xóa đợt thi ${cleanCode} (bảo lưu dữ liệu lịch thi)`,
        metadata: { cleanCode, deleteRecords },
      });

      return NextResponse.json({
        success: true,
        message: deleteRecords
          ? `Đã xóa đợt thi ${cleanCode} và toàn bộ dữ liệu lịch thi liên quan`
          : `Đã xóa đợt thi ${cleanCode} (dữ liệu lịch thi vẫn được bảo lưu an toàn)`,
      });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Exam batch modification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
