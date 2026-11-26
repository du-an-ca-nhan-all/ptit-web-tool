import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import type { ExamBatchActionContext } from './types';
import { revalidateExamBatchCaches } from './utils';

export async function handleSetActiveBatch({ req, authUser, body }: ExamBatchActionContext) {
  const { code } = body;
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
    action: 'SET_ACTIVE_BATCH',
    targetType: 'EXAM_BATCH',
    targetId: cleanCode,
    description: `Đặt đợt thi "${activated.name}" (${cleanCode}) làm đợt thi mặc định kích hoạt`,
  });

  revalidateExamBatchCaches();

  return NextResponse.json({
    success: true,
    message: `Đã đặt đợt thi "${activated.name}" làm đợt thi mặc định`,
    batch: activated,
  });
}

export async function handleToggleBatch({ req, authUser, body }: ExamBatchActionContext) {
  const { code } = body;
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
    action: 'TOGGLE_BATCH_STATUS',
    targetType: 'EXAM_BATCH',
    targetId: cleanCode,
    description: newActive
      ? `BẬT trạng thái đợt thi "${updated.name}" (${cleanCode})`
      : `TẮT trạng thái đợt thi "${updated.name}" (${cleanCode})`,
  });

  revalidateExamBatchCaches();

  return NextResponse.json({
    success: true,
    message: newActive
      ? `Đã BẬT đợt thi "${updated.name}"`
      : `Đã TẮT đợt thi "${updated.name}"`,
    batch: updated,
  });
}
