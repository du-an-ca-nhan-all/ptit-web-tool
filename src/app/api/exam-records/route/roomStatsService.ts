import { prisma } from '@/src/lib/prisma';
import type {
  EnrichedExamRecord,
  FormattedExamRecord,
  ReviewMemberSummary,
  RoomCondition,
  RoomStudentInfo,
} from './types';
import { makeRoomKey, sortMembersByName } from './utils';

export async function enrichWithRoomClassStats(
  formattedRecords: FormattedExamRecord[],
  includeClassmatesCount: boolean
): Promise<EnrichedExamRecord[]> {
  if (!includeClassmatesCount || formattedRecords.length === 0) {
    return formattedRecords;
  }

  const uniqueRoomConditions = new Map<string, RoomCondition>();

  for (const rec of formattedRecords) {
    if (!rec.MaMH || !rec.NgayThi || !rec.MAPTHI) continue;
    const bCode = rec.batchCode || '';
    const key = makeRoomKey({
      batchCode: bCode,
      maMH: rec.MaMH,
      ngayThi: rec.NgayThi,
      gioThi: rec.GioThi || '',
      mapThi: rec.MAPTHI,
    });
    if (!uniqueRoomConditions.has(key)) {
      uniqueRoomConditions.set(key, {
        ...(bCode ? { batchCode: bCode } : {}),
        maMH: rec.MaMH,
        ngayThi: rec.NgayThi,
        gioThi: rec.GioThi || '',
        mapThi: rec.MAPTHI,
      });
    }
  }

  if (uniqueRoomConditions.size === 0) {
    return formattedRecords;
  }

  const roomRows = await prisma.examRecord.findMany({
    where: {
      OR: Array.from(uniqueRoomConditions.values()).map((cond) => ({
        ...(cond.batchCode ? { batchCode: cond.batchCode } : {}),
        maMH: cond.maMH,
        ngayThi: cond.ngayThi,
        ...(cond.gioThi ? { gioThi: cond.gioThi } : {}),
        mapThi: cond.mapThi,
      })),
    },
    select: {
      batchCode: true,
      maMH: true,
      ngayThi: true,
      gioThi: true,
      mapThi: true,
      maSV: true,
      maLopMH: true,
      student: {
        select: {
          maLop: true,
          hoLot: true,
          ten: true,
          hoTen: true,
        },
      },
    },
  });

  // Group unique students per room and per (room, class), and track student info per room
  const roomTotalMap = new Map<string, Set<string>>();
  const roomClassMap = new Map<string, Map<string, Set<string>>>();
  const roomStudentInfoMap = new Map<string, Map<string, RoomStudentInfo>>();
  const allStudentIds = new Set<string>();
  const batchCodeSet = new Set<string>();

  for (const rec of formattedRecords) {
    if (rec.batchCode) batchCodeSet.add(rec.batchCode);
    if (rec.MaSV) allStudentIds.add(String(rec.MaSV).trim().toUpperCase());
  }

  for (const row of roomRows) {
    const key = makeRoomKey({
      batchCode: row.batchCode || '',
      maMH: row.maMH || '',
      ngayThi: row.ngayThi || '',
      gioThi: row.gioThi || '',
      mapThi: row.mapThi || '',
    });
    const studentId = String(row.maSV || '').trim().toUpperCase();
    if (!studentId) continue;
    allStudentIds.add(studentId);
    if (row.batchCode) batchCodeSet.add(row.batchCode);

    if (!roomTotalMap.has(key)) {
      roomTotalMap.set(key, new Set());
    }
    roomTotalMap.get(key)!.add(studentId);

    const rowClass = String(row.student?.maLop || row.maLopMH || '').trim().toUpperCase();
    const hoTen =
      row.student?.hoTen?.trim() ||
      `${row.student?.hoLot || ''} ${row.student?.ten || ''}`.trim() ||
      studentId;
    const ten = row.student?.ten?.trim() || '';

    if (!roomStudentInfoMap.has(key)) {
      roomStudentInfoMap.set(key, new Map());
    }
    if (rowClass || !roomStudentInfoMap.get(key)!.has(studentId)) {
      roomStudentInfoMap.get(key)!.set(studentId, {
        maSV: studentId,
        hoTen,
        ten,
        maLop: rowClass,
      });
    }

    if (rowClass) {
      if (!roomClassMap.has(key)) {
        roomClassMap.set(key, new Map());
      }
      const classMap = roomClassMap.get(key)!;
      if (!classMap.has(rowClass)) {
        classMap.set(rowClass, new Set());
      }
      classMap.get(rowClass)!.add(studentId);
    }
  }

  // Fetch review registrations for all relevant batches & students in a single query
  const batchCodes = Array.from(batchCodeSet);
  const reviewRegs =
    batchCodes.length > 0 && allStudentIds.size > 0
      ? await prisma.examReviewRegistration.findMany({
          where: {
            batchCode: { in: batchCodes },
            isRegistered: true,
            maSV: { in: Array.from(allStudentIds) },
          },
          select: {
            batchCode: true,
            maSV: true,
          },
        })
      : [];

  const registeredReviewSet = new Set<string>(
    reviewRegs.map(
      (r) => `${String(r.batchCode).trim().toUpperCase()}|${String(r.maSV).trim().toUpperCase()}`
    )
  );

  return formattedRecords.map((rec) => {
    if (!rec.MaMH || !rec.NgayThi || !rec.MAPTHI) return rec;
    const bCode = String(rec.batchCode || '').trim().toUpperCase();
    const key = makeRoomKey({
      batchCode: rec.batchCode || '',
      maMH: rec.MaMH,
      ngayThi: rec.NgayThi,
      gioThi: rec.GioThi || '',
      mapThi: rec.MAPTHI,
    });
    const totalSet = roomTotalMap.get(key);
    const myClass = String(rec.MaLop || '').trim().toUpperCase();
    const myMaSV = String(rec.MaSV || '').trim().toUpperCase();
    const classmateSet = myClass ? roomClassMap.get(key)?.get(myClass) : undefined;

    const isUserInReviewBatch = Boolean(
      bCode && myMaSV && registeredReviewSet.has(`${bCode}|${myMaSV}`)
    );
    let roomReviewSameClassCount: number | undefined;
    let roomReviewOtherClassCount: number | undefined;
    let roomReviewSameClassMembers: ReviewMemberSummary[] | undefined;
    let roomReviewOtherClassMembers: ReviewMemberSummary[] | undefined;

    if (isUserInReviewBatch) {
      const studentsInRoom = roomStudentInfoMap.get(key);
      const sameList: RoomStudentInfo[] = [];
      const otherList: RoomStudentInfo[] = [];
      if (studentsInRoom) {
        for (const [stId, stInfo] of studentsInRoom.entries()) {
          if (!registeredReviewSet.has(`${bCode}|${stId}`)) continue;
          if (myClass && stInfo.maLop === myClass) {
            sameList.push(stInfo);
          } else {
            otherList.push(stInfo);
          }
        }
      }
      sameList.sort(sortMembersByName);
      otherList.sort((a, b) => {
        const clsCmp = a.maLop.localeCompare(b.maLop);
        if (clsCmp !== 0) return clsCmp;
        return sortMembersByName(a, b);
      });
      roomReviewSameClassCount = sameList.length;
      roomReviewOtherClassCount = otherList.length;
      roomReviewSameClassMembers = sameList.map(({ maSV, hoTen, maLop }) => ({
        maSV,
        hoTen,
        maLop,
      }));
      roomReviewOtherClassMembers = otherList.map(({ maSV, hoTen, maLop }) => ({
        maSV,
        hoTen,
        maLop,
      }));
    }

    return {
      ...rec,
      roomTotalCount: totalSet ? totalSet.size : undefined,
      roomClassmateCount: classmateSet ? classmateSet.size : totalSet ? 0 : undefined,
      isUserInReviewBatch,
      roomReviewSameClassCount,
      roomReviewOtherClassCount,
      roomReviewSameClassMembers,
      roomReviewOtherClassMembers,
    };
  });
}
