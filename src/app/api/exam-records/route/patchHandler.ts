import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import { parseJsonBody } from '@/src/lib/requestValidation';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { dispatchExamPostponed } from '@/src/features/telegram/server/telegramDispatcher';
import type { PatchPostponedPayload, PatchUpdateResult } from './types';
import { parsePatchPayload, parsePostponedBoolean } from './utils';

const stringOrNumberSchema = z.union([z.string(), z.number()]);

const patchExamRecordsBodySchema = z
  .object({
    id: stringOrNumberSchema.nullish(),
    ids: z.array(stringOrNumberSchema).nullish(),
    isPostponed: z.union([z.boolean(), z.string(), z.number()]).nullish(),
    maSV: z.string().nullish(),
    maMH: z.string().nullish(),
    mapThi: z.string().nullish(),
    ngayThi: z.string().nullish(),
    gioThi: z.string().nullish(),
  })
  .passthrough();

async function extractPatchAuthUser(req: NextRequest) {
  let authUser = null;
  try {
    authUser = await getCurrentUserFromCookie();
    if (!authUser) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        authUser = await verifyAuthToken(token);
      }
    }
  } catch (authErr) {
    console.warn('Auth extraction error in exam-records PATCH:', authErr);
  }
  return authUser;
}

async function updatePostponedRecords(
  payload: PatchPostponedPayload,
  cleanIsPostponed: boolean
): Promise<PatchUpdateResult> {
  const { rawId, rawIds, cleanMaSV, cleanMaMH, cleanMapThi, cleanNgayThi, cleanGioThi } = payload;
  let updatedCount = 0;
  let targetDesc = '';

  // 1. Try update by specific numeric id if provided
  if (rawId !== undefined && rawId !== null && !isNaN(Number(rawId))) {
    const numId = Number(rawId);
    try {
      const existing = await prisma.examRecord.findUnique({ where: { id: numId } });
      if (existing) {
        await prisma.examRecord.update({
          where: { id: numId },
          data: { isPostponed: cleanIsPostponed },
        });
        updatedCount = 1;
        targetDesc = `ID ${numId} (SV: ${existing.maSV} - Môn: ${existing.tenMH || existing.maMH})`;
      }
    } catch (err) {
      console.warn('Prisma find/update by ID error, will try query fallback:', err);
    }
  }

  // 2. Try update by array of numeric ids
  if (updatedCount === 0 && Array.isArray(rawIds) && rawIds.length > 0) {
    const validIds = rawIds.map(Number).filter((n) => !isNaN(n));
    if (validIds.length > 0) {
      try {
        const result = await prisma.examRecord.updateMany({
          where: { id: { in: validIds } },
          data: { isPostponed: cleanIsPostponed },
        });
        updatedCount = result.count;
        targetDesc = `${updatedCount} bản ghi (IDs: ${validIds.join(', ')})`;
      } catch (err) {
        console.warn('updateMany with IDs error:', err);
      }
    }
  }

  // 3. Fallback: match by (maSV + maMH) and optional (mapThi, ngayThi, gioThi)
  if (updatedCount === 0 && cleanMaSV) {
    const whereCond: any = { maSV: cleanMaSV };

    if (cleanMaMH) whereCond.maMH = cleanMaMH;
    if (cleanMapThi) whereCond.mapThi = cleanMapThi;
    if (cleanNgayThi) whereCond.ngayThi = cleanNgayThi;
    if (cleanGioThi) whereCond.gioThi = cleanGioThi;

    try {
      const result = await prisma.examRecord.updateMany({
        where: whereCond,
        data: { isPostponed: cleanIsPostponed },
      });
      updatedCount = result.count;
    } catch (err) {
      console.warn('updateMany with strict filter error:', err);
    }

    // If strict filter didn't find any, try looser filter with just maSV + maMH
    if (updatedCount === 0 && cleanMaMH) {
      try {
        const fallbackResult = await prisma.examRecord.updateMany({
          where: {
            maSV: cleanMaSV,
            maMH: cleanMaMH,
          },
          data: { isPostponed: cleanIsPostponed },
        });
        updatedCount = fallbackResult.count;
      } catch (err) {
        console.warn('updateMany with loose filter error:', err);
      }
    }

    targetDesc = `SV ${cleanMaSV} - Môn ${cleanMaMH || 'Tất cả'} (Cập nhật ${updatedCount} bản ghi)`;
  }

  return { updatedCount, targetDesc };
}

export async function handlePatchExamRecords(req: NextRequest): Promise<NextResponse> {
  try {
    const authUser = await extractPatchAuthUser(req);
    const parsed = await parseJsonBody(req, patchExamRecordsBodySchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const payload = parsePatchPayload(body);

    const cleanIsPostponed = parsePostponedBoolean(payload.rawIsPostponed);
    if (cleanIsPostponed === null) {
      return NextResponse.json(
        { error: 'Giá trị isPostponed (true/false) là bắt buộc' },
        { status: 400 }
      );
    }

    const { updatedCount, targetDesc } = await updatePostponedRecords(payload, cleanIsPostponed);
    const { rawId, rawIds, cleanMaSV, cleanMaMH, cleanMapThi, cleanNgayThi, cleanGioThi } = payload;

    // 4. Log activity if user is authenticated (never break response if logging fails)
    if (authUser) {
      try {
        await logActivity({
          req,
          userId: authUser.id,
          username: authUser.username,
          userRole: authUser.role,
          action: cleanIsPostponed ? 'MARK_EXAM_POSTPONED' : 'UNMARK_EXAM_POSTPONED',
          targetType: 'EXAM_RECORD',
          targetId: String(rawId || rawIds?.[0] || cleanMaSV || 'UNKNOWN'),
          description: `${authUser.fullName || authUser.username} đã ${
            cleanIsPostponed ? 'đánh dấu hoãn thi/không thi (không chia tiền)' : 'bỏ đánh dấu hoãn thi'
          } cho ${targetDesc || cleanMaSV || 'bản ghi'}`,
          metadata: {
            id: rawId,
            ids: rawIds,
            maSV: cleanMaSV,
            maMH: cleanMaMH,
            mapThi: cleanMapThi,
            ngayThi: cleanNgayThi,
            gioThi: cleanGioThi,
            isPostponed: cleanIsPostponed,
            updatedCount,
          },
        });
      } catch (logErr) {
        console.warn('[ActivityLog] Ghi log thất bại:', logErr);
      }
    }

    // 5. Dispatch Telegram notification asynchronously
    if (cleanMaSV) {
      try {
        dispatchExamPostponed({
          username: cleanMaSV,
          subjectCode: cleanMaMH || undefined,
          isPostponed: cleanIsPostponed,
          examDate: cleanNgayThi || undefined,
          examTime: cleanGioThi || undefined,
          examRoom: cleanMapThi || undefined,
        }).catch((err) => console.error('Dispatch exam postponed error:', err));
      } catch (dispatchErr) {
        console.warn('Dispatch notification error in exam-records PATCH:', dispatchErr);
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      isPostponed: cleanIsPostponed,
      message: `Đã ${cleanIsPostponed ? 'đánh dấu hoãn thi' : 'hủy hoãn thi'} thành công (${updatedCount} bản ghi)`,
    });
  } catch (error: any) {
    console.error('Exam records PATCH error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi cập nhật trạng thái hoãn thi' },
      { status: 500 }
    );
  }
}
