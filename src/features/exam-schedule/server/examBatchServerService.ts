import { prisma } from '@/src/lib/prisma';
import { ExamBatchItem } from '../types/exam.types';

export const examBatchService = {
  /**
   * Get all exam batches with counts
   */
  async getBatches() {
    const batches = await prisma.examBatch.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { examRecords: true },
        },
      },
    });

    const result: ExamBatchItem[] = [];

    for (const b of batches) {
      const distinctStudents = await prisma.examRecord.findMany({
        where: { batchCode: b.code },
        distinct: ['maSV'],
        select: { maSV: true },
      });

      const distinctRooms = await prisma.examRecord.findMany({
        where: { batchCode: b.code },
        distinct: ['mapThi'],
        select: { mapThi: true },
      });

      result.push({
        id: b.id,
        code: b.code,
        name: b.name,
        semester: b.semester,
        academicYear: b.academicYear,
        startDate: b.startDate,
        endDate: b.endDate,
        isActive: b.isActive,
        description: b.description,
        totalRecords: b._count.examRecords,
        totalStudents: distinctStudents.length,
        totalRooms: distinctRooms.length,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      });
    }

    return result;
  },

  /**
   * Set an active batch (and deactivate others)
   */
  async setActiveBatch(batchId: number) {
    const target = await prisma.examBatch.findUnique({
      where: { id: batchId },
    });
    if (!target) {
      throw new Error('Không tìm thấy đợt thi');
    }

    await prisma.$transaction([
      prisma.examBatch.updateMany({
        data: { isActive: false },
      }),
      prisma.examBatch.update({
        where: { id: batchId },
        data: { isActive: true },
      }),
    ]);

    return target;
  },
};
