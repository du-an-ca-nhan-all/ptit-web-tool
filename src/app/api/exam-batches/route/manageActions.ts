import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import type { ExamBatchActionContext } from './types';
import { generateUniqueBatchCode, revalidateExamBatchCaches } from './utils';

export async function handleCreateBatch({ req, authUser, body }: ExamBatchActionContext) {
  const { code, name, semester, academicYear, startDate, endDate, description, isActive } = body;

  const cleanName = name ? String(name).trim() : '';
  if (!cleanName) {
    return NextResponse.json({ error: 'Tên đợt thi (name) là bắt buộc' }, { status: 400 });
  }

  const rawCode = code ? String(code).trim().toUpperCase() : '';
  let cleanCode = rawCode;

  if (cleanCode) {
    const existing = await prisma.examBatch.findUnique({ where: { code: cleanCode } });
    if (existing) {
      return NextResponse.json({ error: `Mã đợt thi ${cleanCode} đã tồn tại` }, { status: 400 });
    }
  } else {
    cleanCode = await generateUniqueBatchCode(cleanName);
  }

  if (isActive) {
    // Deactivate all others
    await prisma.examBatch.updateMany({ data: { isActive: false } });
  }

  const newBatch = await prisma.examBatch.create({
    data: {
      code: cleanCode,
      name: cleanName,
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

  revalidateExamBatchCaches();

  return NextResponse.json({
    success: true,
    message: `Đã tạo thành công đợt thi ${newBatch.name}`,
    batch: newBatch,
  });
}

export async function handleUpdateBatch({ req, authUser, body }: ExamBatchActionContext) {
  const { code, name, semester, academicYear, startDate, endDate, description, isActive } = body;

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

  revalidateExamBatchCaches();

  return NextResponse.json({
    success: true,
    message: `Đã cập nhật thông tin đợt thi ${updated.name}`,
    batch: updated,
  });
}

export async function handleDeleteBatch({ req, authUser, body }: ExamBatchActionContext) {
  const { code } = body;

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

  revalidateExamBatchCaches();

  return NextResponse.json({
    success: true,
    message: deleteRecords
      ? `Đã xóa đợt thi ${cleanCode} và toàn bộ dữ liệu lịch thi liên quan`
      : `Đã xóa đợt thi ${cleanCode} (dữ liệu lịch thi vẫn được bảo lưu an toàn)`,
  });
}
