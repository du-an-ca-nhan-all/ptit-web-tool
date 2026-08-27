import { unstable_cache } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { ExamBatchItem } from '../types/exam.types';

async function fetchBatchesRaw(): Promise<ExamBatchItem[]> {
  const batches = await prisma.examBatch.findMany({
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    include: {
      _count: {
        select: { examRecords: true },
      },
    },
  });

  return Promise.all(
    batches.map(async (b) => {
      const [distinctStudents, distinctRooms] = await Promise.all([
        prisma.examRecord.findMany({
          where: { batchCode: b.code },
          distinct: ['maSV'],
          select: { maSV: true },
        }),
        prisma.examRecord.findMany({
          where: { batchCode: b.code, mapThi: { not: null } },
          distinct: ['mapThi'],
          select: { mapThi: true },
        }),
      ]);

      return {
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
      };
    })
  );
}

const getCachedBatches = unstable_cache(
  fetchBatchesRaw,
  ['exam-batches-list'],
  {
    revalidate: 3600,
    tags: ['exam-batches'],
  }
);

export const examBatchService = {
  /**
   * Get all exam batches with counts (Cached with Next.js Cache)
   */
  async getBatches(): Promise<ExamBatchItem[]> {
    return getCachedBatches();
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
