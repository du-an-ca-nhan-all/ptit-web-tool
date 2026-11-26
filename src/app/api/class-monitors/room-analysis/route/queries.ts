import { prisma } from '@/src/lib/prisma';
import { buildRoomTotalMap, type RoomCondition } from './utils';

const STUDENT_DETAIL_SELECT = {
  maSV: true,
  hoLot: true,
  ten: true,
  hoTen: true,
  soDienThoai: true,
  maLop: true,
} as const;

export async function fetchClassAnalysisInputs(batchCode: string, classCode: string) {
  const [classExamRecords, reviewRegs, classMonitors] = await Promise.all([
    prisma.examRecord.findMany({
      where: {
        batchCode,
        OR: [
          { student: { maLop: { equals: classCode, mode: 'insensitive' } } },
          { maLopMH: { equals: classCode, mode: 'insensitive' } },
        ],
      },
      include: {
        student: {
          select: STUDENT_DETAIL_SELECT,
        },
      },
      orderBy: [{ ngayThi: 'asc' }, { gioThi: 'asc' }, { maMH: 'asc' }, { mapThi: 'asc' }],
    }),
    prisma.examReviewRegistration.findMany({
      where: {
        batchCode,
        classCode,
        isRegistered: true,
      },
      select: {
        maSV: true,
        note: true,
      },
    }),
    prisma.user.findMany({
      where: {
        role: { contains: 'lop_truong', mode: 'insensitive' },
        student: { maLop: { equals: classCode, mode: 'insensitive' } },
      },
      include: {
        student: {
          select: {
            maSV: true,
            hoLot: true,
            ten: true,
            hoTen: true,
            maLop: true,
          },
        },
      },
    }),
  ]);

  return { classExamRecords, reviewRegs, classMonitors };
}

export type ClassAnalysisInputs = Awaited<ReturnType<typeof fetchClassAnalysisInputs>>;
export type ClassExamRecord = ClassAnalysisInputs['classExamRecords'][number];
export type ClassMonitorRecord = ClassAnalysisInputs['classMonitors'][number];

export async function fetchReferenceStudentData(batchCode: string, referenceMaSV: string) {
  if (!referenceMaSV) {
    return {
      refStudentProfile: null,
      refExamRecordsRaw: [] as ClassExamRecord[],
    };
  }

  const [refStudentProfile, refExamRecordsRaw] = await Promise.all([
    prisma.student.findFirst({
      where: { maSV: { equals: referenceMaSV, mode: 'insensitive' } },
      select: STUDENT_DETAIL_SELECT,
    }),
    prisma.examRecord.findMany({
      where: {
        batchCode,
        maSV: { equals: referenceMaSV, mode: 'insensitive' },
      },
      include: {
        student: {
          select: STUDENT_DETAIL_SELECT,
        },
      },
      orderBy: [{ ngayThi: 'asc' }, { gioThi: 'asc' }, { maMH: 'asc' }],
    }),
  ]);

  return { refStudentProfile, refExamRecordsRaw };
}

export type RefStudentProfile = Awaited<
  ReturnType<typeof fetchReferenceStudentData>
>['refStudentProfile'];

export async function fetchRoomTotalCounts(
  batchCode: string,
  uniqueRooms: Map<string, RoomCondition>
): Promise<Map<string, Set<string>>> {
  if (uniqueRooms.size === 0) {
    return new Map<string, Set<string>>();
  }

  const roomRows = await prisma.examRecord.findMany({
    where: {
      batchCode,
      OR: Array.from(uniqueRooms.values()).map((cond) => ({
        maMH: cond.maMH,
        mapThi: cond.mapThi,
        ngayThi: cond.ngayThi,
        ...(cond.gioThi ? { gioThi: cond.gioThi } : {}),
      })),
    },
    select: {
      maMH: true,
      mapThi: true,
      ngayThi: true,
      gioThi: true,
      maSV: true,
    },
  });

  return buildRoomTotalMap(roomRows);
}
