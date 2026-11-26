import type {
  AnalyzedExamRoom,
  AnalyzedStudentRecord,
  RoomAnalysisRecord,
  StudentScope,
} from './types';
import {
  buildRoomKey,
  isSameGroupWithMonitor,
  normalizeStr,
  sortAnalyzedRecords,
  sortAnalyzedRooms,
} from './utils';

export function analyzeClassRooms(params: {
  allClassRecords: RoomAnalysisRecord[];
  referenceRecords: RoomAnalysisRecord[];
  scope: StudentScope;
  hidePostponed: boolean;
}): {
  analyzedRecords: AnalyzedStudentRecord[];
  analyzedRooms: AnalyzedExamRoom[];
} {
  const { allClassRecords, referenceRecords, scope, hidePostponed } = params;

  const activeClassRecords = hidePostponed
    ? allClassRecords.filter((r) => !r.isPostponed)
    : allClassRecords;

  const activeRefRecords = hidePostponed
    ? referenceRecords.filter((r) => !r.isPostponed)
    : referenceRecords;

  // Map monitor's exam records by subject code
  const monitorBySubject = new Map<string, RoomAnalysisRecord[]>();
  for (const ref of activeRefRecords) {
    const subj = normalizeStr(ref.maMH);
    if (!subj) continue;
    if (!monitorBySubject.has(subj)) {
      monitorBySubject.set(subj, []);
    }
    monitorBySubject.get(subj)!.push(ref);
  }

  // Pre-count class & review students per room
  const classRoomStudents = new Map<string, Set<string>>();
  const reviewRoomStudents = new Map<string, Set<string>>();
  for (const rec of activeClassRecords) {
    const rKey = buildRoomKey({
      maMH: rec.maMH,
      mapThi: rec.mapThi,
      ngayThi: rec.ngayThi,
      gioThi: rec.gioThi,
    });
    if (!classRoomStudents.has(rKey)) classRoomStudents.set(rKey, new Set());
    classRoomStudents.get(rKey)!.add(rec.maSV);

    if (rec.isReviewRegistered) {
      if (!reviewRoomStudents.has(rKey)) reviewRoomStudents.set(rKey, new Set());
      reviewRoomStudents.get(rKey)!.add(rec.maSV);
    }
  }

  // Filter by selected scope (CLASS vs REVIEW)
  const scopedRecords =
    scope === 'REVIEW'
      ? activeClassRecords.filter((r) => r.isReviewRegistered)
      : activeClassRecords;

  const analyzedRecords: AnalyzedStudentRecord[] = scopedRecords.map((rec) => {
    const subj = normalizeStr(rec.maMH);
    const rKey = buildRoomKey({
      maMH: rec.maMH,
      mapThi: rec.mapThi,
      ngayThi: rec.ngayThi,
      gioThi: rec.gioThi,
    });
    const monitorList = monitorBySubject.get(subj) || [];

    const classRoomCount = classRoomStudents.get(rKey)?.size ?? 0;
    const reviewRoomCount = reviewRoomStudents.get(rKey)?.size ?? 0;
    const scopeRoomCount = scope === 'REVIEW' ? reviewRoomCount : classRoomCount;

    if (monitorList.length === 0) {
      return {
        ...rec,
        roomKey: rKey,
        splitStatus: 'NO_MONITOR_EXAM',
        monitorRoom: '',
        monitorDate: '',
        monitorTime: '',
        monitorNhomHoc: '',
        monitorToThi: '',
        monitorNhomThi: '',
        scopeRoomCount,
        classRoomCount,
        reviewRoomCount,
      };
    }

    // Check if student is in the exact same room/date/time as any of monitor's exams for this subject
    const sameRoomMatch = monitorList.find(
      (m) =>
        buildRoomKey({
          maMH: m.maMH,
          mapThi: m.mapThi,
          ngayThi: m.ngayThi,
          gioThi: m.gioThi,
        }) === rKey
    );

    if (sameRoomMatch) {
      return {
        ...rec,
        roomKey: rKey,
        splitStatus: 'SAME_ROOM',
        monitorRoom: sameRoomMatch.mapThi,
        monitorDate: sameRoomMatch.ngayThi,
        monitorTime: sameRoomMatch.gioThi,
        monitorNhomHoc: sameRoomMatch.nhomHoc,
        monitorToThi: sameRoomMatch.toThi,
        monitorNhomThi: sameRoomMatch.nhomThi,
        scopeRoomCount,
        classRoomCount,
        reviewRoomCount,
      };
    }

    // Otherwise, student is split into a different room!
    // Check if they share the same group/team with any of monitor's exams for this subject
    const sameGroupMatch = monitorList.find((m) => isSameGroupWithMonitor(rec, m));
    const primaryMonitor = sameGroupMatch || monitorList[0];

    return {
      ...rec,
      roomKey: rKey,
      splitStatus: sameGroupMatch ? 'SPLIT_SAME_GROUP' : 'SPLIT_DIFF_GROUP',
      monitorRoom: primaryMonitor.mapThi,
      monitorDate: primaryMonitor.ngayThi,
      monitorTime: primaryMonitor.gioThi,
      monitorNhomHoc: primaryMonitor.nhomHoc,
      monitorToThi: primaryMonitor.toThi,
      monitorNhomThi: primaryMonitor.nhomThi,
      scopeRoomCount,
      classRoomCount,
      reviewRoomCount,
    };
  });

  // Sort analyzed records: date/time asc -> subject -> split severity -> room -> student name
  const sortedAnalyzedRecords = sortAnalyzedRecords(analyzedRecords, 'DATE_ASC');

  // Group into rooms
  const roomMap = new Map<string, AnalyzedExamRoom>();
  for (const rec of sortedAnalyzedRecords) {
    if (!roomMap.has(rec.roomKey)) {
      const subj = normalizeStr(rec.maMH);
      const monitorList = monitorBySubject.get(subj) || [];
      const primaryMonitor = monitorList[0];
      const isMonitorRoom = monitorList.some(
        (m) =>
          buildRoomKey({
            maMH: m.maMH,
            mapThi: m.mapThi,
            ngayThi: m.ngayThi,
            gioThi: m.gioThi,
          }) === rec.roomKey
      );

      roomMap.set(rec.roomKey, {
        roomKey: rec.roomKey,
        maMH: rec.maMH,
        tenMH: rec.tenMH,
        mapThi: rec.mapThi,
        ngayThi: rec.ngayThi,
        gioThi: rec.gioThi,
        soPhutThi: rec.soPhutThi,
        maHTThi: rec.maHTThi,
        isMonitorRoom,
        monitorRoomForSubject: primaryMonitor?.mapThi || '',
        monitorDateForSubject: primaryMonitor?.ngayThi || '',
        monitorTimeForSubject: primaryMonitor?.gioThi || '',
        hasMonitorExamForSubject: monitorList.length > 0,
        scopeCount: rec.scopeRoomCount,
        classCount: rec.classRoomCount,
        reviewCount: rec.reviewRoomCount,
        roomTotalCount: rec.roomTotalCount,
        splitSameGroupCount: 0,
        splitDiffGroupCount: 0,
        members: [],
      });
    }

    const room = roomMap.get(rec.roomKey)!;
    // Avoid duplicate maSV inside the same room
    if (!room.members.some((m) => m.maSV === rec.maSV)) {
      room.members.push(rec);
      if (rec.splitStatus === 'SPLIT_SAME_GROUP') room.splitSameGroupCount += 1;
      if (rec.splitStatus === 'SPLIT_DIFF_GROUP') room.splitDiffGroupCount += 1;
    }
  }

  const analyzedRooms = sortAnalyzedRooms(
    Array.from(roomMap.values()).map((room) => ({
      ...room,
      members: room.members.sort((a, b) => {
        const tenCmp = a.ten.localeCompare(b.ten, 'vi');
        if (tenCmp !== 0) return tenCmp;
        return a.maSV.localeCompare(b.maSV);
      }),
    })),
    'DATE_ASC'
  );

  return { analyzedRecords: sortedAnalyzedRecords, analyzedRooms };
}
