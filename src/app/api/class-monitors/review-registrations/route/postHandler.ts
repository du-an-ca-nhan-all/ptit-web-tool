import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJsonBody } from '@/src/lib/requestValidation';
import { prisma } from '@/src/lib/prisma';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { getAuthUser, normalizeCode } from './utils';

const reviewRegistrationItemSchema = z.object({
  maSV: z.string(),
  isRegistered: z.boolean().optional().default(false),
  note: z.string().nullish(),
}).passthrough();

const reviewRegistrationsPostSchema = z.object({
  action: z.string().optional(),
  batchCode: z.string().nullish(),
  classCode: z.string().nullish(),
  maSV: z.string().nullish(),
  isRegistered: z.boolean().optional(),
  note: z.string().nullish(),
  items: z.array(reviewRegistrationItemSchema).optional(),
}).passthrough();

// POST /api/class-monitors/review-registrations
// Actions: TOGGLE_ONE | SAVE_BULK | IMPORT_MASV
export async function handlePostReviewRegistrations(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện' }, { status: 401 });
    }

    if (!authUser.isAdmin && !authUser.isMonitor) {
      return NextResponse.json(
        { error: 'Chỉ Lớp trưởng hoặc Quản trị viên mới có quyền cấu hình danh sách ôn tập' },
        { status: 403 }
      );
    }

    const parsed = await parseJsonBody(req, reviewRegistrationsPostSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const action = String(body.action || 'TOGGLE_ONE').toUpperCase();
    const batchCode = normalizeCode(body.batchCode);
    const requestedClass = normalizeCode(body.classCode);
    const userClass = normalizeCode(authUser.lop);
    const classCode = authUser.isAdmin ? requestedClass || userClass : userClass || requestedClass;

    if (!batchCode) {
      return NextResponse.json({ error: 'Mã đợt thi (batchCode) là bắt buộc' }, { status: 400 });
    }

    if (!classCode) {
      return NextResponse.json({ error: 'Mã lớp (classCode) là bắt buộc' }, { status: 400 });
    }

    if (!authUser.isAdmin && userClass && classCode !== userClass) {
      return NextResponse.json(
        { error: `Bạn chỉ có quyền cấu hình danh sách ôn tập của lớp ${userClass}` },
        { status: 403 }
      );
    }

    // 1. Toggle or update note for a single student
    if (action === 'TOGGLE_ONE') {
      const maSV = normalizeCode(body.maSV);
      if (!maSV) {
        return NextResponse.json({ error: 'Mã sinh viên (maSV) là bắt buộc' }, { status: 400 });
      }

      const isRegistered = Boolean(body.isRegistered);
      const note = body.note !== undefined ? String(body.note || '').trim() || null : undefined;

      const updated = await prisma.examReviewRegistration.upsert({
        where: {
          batchCode_classCode_maSV: {
            batchCode,
            classCode,
            maSV,
          },
        },
        update: {
          isRegistered,
          ...(note !== undefined ? { note } : {}),
          updatedBy: authUser.username,
        },
        create: {
          batchCode,
          classCode,
          maSV,
          isRegistered,
          note: note ?? null,
          updatedBy: authUser.username,
        },
      });

      return NextResponse.json({
        success: true,
        registration: updated,
      });
    }

    // 2. Bulk save (Select all / Clear all / Select students with exams / Save list)
    if (action === 'SAVE_BULK') {
      const items: Array<{ maSV: string; isRegistered: boolean; note?: string | null }> = Array.isArray(
        body.items
      )
        ? body.items
        : [];

      if (items.length === 0) {
        return NextResponse.json({ error: 'Danh sách cập nhật không được rỗng' }, { status: 400 });
      }

      const operations = items
        .map((item) => {
          const maSV = normalizeCode(item.maSV);
          if (!maSV) return null;
          const note =
            item.note !== undefined ? String(item.note || '').trim() || null : undefined;

          return prisma.examReviewRegistration.upsert({
            where: {
              batchCode_classCode_maSV: {
                batchCode,
                classCode,
                maSV,
              },
            },
            update: {
              isRegistered: Boolean(item.isRegistered),
              ...(note !== undefined ? { note } : {}),
              updatedBy: authUser.username,
            },
            create: {
              batchCode,
              classCode,
              maSV,
              isRegistered: Boolean(item.isRegistered),
              note: note ?? null,
              updatedBy: authUser.username,
            },
          });
        })
        .filter((op): op is NonNullable<typeof op> => op !== null);

      await prisma.$transaction(operations);

      const registeredCount = items.filter((i) => i.isRegistered).length;

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'UPDATE_EXAM_REVIEW_REGISTRATIONS',
        targetType: 'EXAM_REVIEW',
        targetId: `${batchCode}:${classCode}`,
        description: `Cập nhật danh sách đăng ký ôn tập lớp ${classCode} - đợt ${batchCode} (${registeredCount}/${items.length} SV đăng ký)`,
        metadata: { batchCode, classCode, total: items.length, registeredCount },
      });

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật danh sách ôn tập lớp ${classCode} (${registeredCount} SV đăng ký)`,
        registeredCount,
      });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/class-monitors/review-registrations error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi lưu danh sách đăng ký ôn tập' },
      { status: 500 }
    );
  }
}
