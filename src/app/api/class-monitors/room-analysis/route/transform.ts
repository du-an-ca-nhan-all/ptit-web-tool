import type { AuthUser } from '@/src/lib/auth';
import type { ClassExamRecord, ClassMonitorRecord, RefStudentProfile } from './queries';
import { makeRoomKey, normalizeCode } from './utils';

export interface FormattedExamRecord {
  id: ClassExamRecord['id'];
  maSV: string;
  hoLot: string;
  ten: string;
  hoTen: string;
  soDienThoai: string;
  maLop: string;
  maMH: string;
  tenMH: string;
  mapThi: string;
  ngayThi: string;
  gioThi: string;
  soPhutThi: string;
  maHTThi: string;
  nhomHoc: string;
  toThi: string;
  nhomThi: string;
  isPostponed: boolean;
  isReviewRegistered: boolean;
  reviewNote: string;
  roomTotalCount: number;
}

export interface CandidateStudent {
  maSV: string;
  hoTen: string;
  ten: string;
  isMonitor: boolean;
  examCount: number;
}

export interface ReferenceStudentInfo {
  maSV: string;
  hoTen: string;
  maLop: string;
  isMonitor: boolean;
  examCount: number;
}

export function formatExamRecord(
  r: ClassExamRecord,
  classCode: string,
  reviewSet: Set<string>,
  reviewNoteMap: Map<string, string>,
  roomTotalMap: Map<string, Set<string>>
): FormattedExamRecord {
  const maSV = normalizeCode(r.maSV);
  const hoTen =
    r.student?.hoTen?.trim() ||
    `${r.student?.hoLot || ''} ${r.student?.ten || ''}`.trim() ||
    maSV;
  const rKey = makeRoomKey(r.maMH || '', r.mapThi || '', r.ngayThi || '', r.gioThi || '');
  return {
    id: r.id,
    maSV,
    hoLot: r.student?.hoLot || '',
    ten: r.student?.ten || '',
    hoTen,
    soDienThoai: r.student?.soDienThoai || '',
    maLop: normalizeCode(r.student?.maLop || r.maLopMH || classCode),
    maMH: String(r.maMH || '').trim(),
    tenMH: String(r.tenMH || r.maMH || '').trim(),
    mapThi: String(r.mapThi || '').trim(),
    ngayThi: String(r.ngayThi || '').trim(),
    gioThi: String(r.gioThi || '').trim(),
    soPhutThi: String(r.soPhutThi || '').trim(),
    maHTThi: String(r.maHTThi || '').trim(),
    nhomHoc: String(r.nhomHoc || '').trim(),
    toThi: String(r.toThi || '').trim(),
    nhomThi: String(r.nhomThi || '').trim(),
    isPostponed: Boolean(r.isPostponed),
    isReviewRegistered: reviewSet.has(maSV),
    reviewNote: reviewNoteMap.get(maSV) || '',
    roomTotalCount: roomTotalMap.get(rKey)?.size ?? 0,
  };
}

export function buildCandidatesAndReference(params: {
  classMonitors: ClassMonitorRecord[];
  monitorSet: Set<string>;
  records: FormattedExamRecord[];
  referenceRecords: FormattedExamRecord[];
  referenceMaSV: string;
  refStudentProfile: RefStudentProfile;
  classCode: string;
  authUser: AuthUser;
}): {
  candidates: CandidateStudent[];
  referenceStudent: ReferenceStudentInfo | null;
} {
  const {
    classMonitors,
    monitorSet,
    records,
    referenceRecords,
    referenceMaSV,
    refStudentProfile,
    classCode,
    authUser,
  } = params;

  const candidateMap = new Map<string, CandidateStudent>();

  for (const m of classMonitors) {
    const mId = normalizeCode(m.username);
    if (!mId) continue;
    const hoTen =
      m.student?.hoTen?.trim() ||
      `${m.student?.hoLot || ''} ${m.student?.ten || ''}`.trim() ||
      mId;
    candidateMap.set(mId, {
      maSV: mId,
      hoTen,
      ten: m.student?.ten || '',
      isMonitor: true,
      examCount: 0,
    });
  }

  for (const rec of records) {
    const existing = candidateMap.get(rec.maSV);
    if (existing) {
      existing.examCount += 1;
    } else {
      candidateMap.set(rec.maSV, {
        maSV: rec.maSV,
        hoTen: rec.hoTen,
        ten: rec.ten,
        isMonitor: monitorSet.has(rec.maSV),
        examCount: 1,
      });
    }
  }

  if (referenceMaSV && !candidateMap.has(referenceMaSV) && refStudentProfile) {
    const hoTen =
      refStudentProfile.hoTen?.trim() ||
      `${refStudentProfile.hoLot || ''} ${refStudentProfile.ten || ''}`.trim() ||
      referenceMaSV;
    candidateMap.set(referenceMaSV, {
      maSV: referenceMaSV,
      hoTen,
      ten: refStudentProfile.ten || '',
      isMonitor: monitorSet.has(referenceMaSV),
      examCount: referenceRecords.length,
    });
  }

  const candidates = Array.from(candidateMap.values()).sort((a, b) => {
    if (a.isMonitor !== b.isMonitor) return a.isMonitor ? -1 : 1;
    const tenCmp = a.ten.localeCompare(b.ten, 'vi');
    if (tenCmp !== 0) return tenCmp;
    return a.maSV.localeCompare(b.maSV);
  });

  const referenceStudent = referenceMaSV
    ? {
        maSV: referenceMaSV,
        hoTen:
          refStudentProfile?.hoTen?.trim() ||
          `${refStudentProfile?.hoLot || ''} ${refStudentProfile?.ten || ''}`.trim() ||
          candidateMap.get(referenceMaSV)?.hoTen ||
          referenceMaSV,
        maLop: normalizeCode(refStudentProfile?.maLop || classCode),
        isMonitor:
          monitorSet.has(referenceMaSV) ||
          (authUser.isMonitor && normalizeCode(authUser.username) === referenceMaSV),
        examCount: referenceRecords.length,
      }
    : null;

  return { candidates, referenceStudent };
}
