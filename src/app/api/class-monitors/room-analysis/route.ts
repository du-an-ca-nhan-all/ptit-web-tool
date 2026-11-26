import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import {
  fetchClassAnalysisInputs,
  fetchReferenceStudentData,
  fetchRoomTotalCounts,
} from './route/queries';
import { buildCandidatesAndReference, formatExamRecord } from './route/transform';
import { collectUniqueRooms, normalizeCode, resolveReferenceMaSV } from './route/utils';

async function getAuthUser(req: NextRequest) {
  let authUser = await getCurrentUserFromCookie();
  if (!authUser) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      authUser = await verifyAuthToken(token);
    }
  }
  return authUser;
}

// GET /api/class-monitors/room-analysis?batchCode=...&classCode=...&referenceMaSV=...
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để truy cập' }, { status: 401 });
    }

    if (!authUser.isAdmin && !authUser.isMonitor) {
      return NextResponse.json(
        { error: 'Chỉ Lớp trưởng hoặc Quản trị viên mới có quyền phân tích phòng thi lớp' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const batchCode = normalizeCode(searchParams.get('batchCode'));
    const requestedClass = normalizeCode(searchParams.get('classCode'));
    const requestedRefMaSV = normalizeCode(searchParams.get('referenceMaSV'));
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
        { error: `Bạn chỉ có quyền phân tích phòng thi của lớp ${userClass}` },
        { status: 403 }
      );
    }

    // 1. Fetch class exam records, review registrations, and class monitors in parallel
    const { classExamRecords, reviewRegs, classMonitors } = await fetchClassAnalysisInputs(
      batchCode,
      classCode
    );

    // 2. Resolve reference student (default: logged-in monitor of this class, else class monitor in DB)
    const monitorSet = new Set(classMonitors.map((m) => normalizeCode(m.username)));
    const referenceMaSV = resolveReferenceMaSV({
      requestedRefMaSV,
      isMonitor: authUser.isMonitor,
      userClass,
      classCode,
      username: authUser.username,
      classMonitors,
    });

    // Fetch reference student profile & their exam records in this batch (in case monitor's student record isn't in classExamRecords)
    const { refStudentProfile, refExamRecordsRaw } = await fetchReferenceStudentData(
      batchCode,
      referenceMaSV
    );

    // 3. Collect unique rooms across class records + reference records to compute total room capacity
    const uniqueRooms = collectUniqueRooms([...classExamRecords, ...refExamRecordsRaw]);
    const roomTotalMap = await fetchRoomTotalCounts(batchCode, uniqueRooms);

    const reviewSet = new Set(reviewRegs.map((r) => normalizeCode(r.maSV)));
    const reviewNoteMap = new Map(reviewRegs.map((r) => [normalizeCode(r.maSV), r.note || '']));

    const formatRecord = (r: (typeof classExamRecords)[number]) =>
      formatExamRecord(r, classCode, reviewSet, reviewNoteMap, roomTotalMap);

    const records = classExamRecords.map(formatRecord);
    const referenceRecords = refExamRecordsRaw.map(formatRecord);

    // Build candidate list for switching reference student (monitors first, then class students with exams)
    const { candidates, referenceStudent } = buildCandidatesAndReference({
      classMonitors,
      monitorSet,
      records,
      referenceRecords,
      referenceMaSV,
      refStudentProfile,
      classCode,
      authUser,
    });

    return NextResponse.json({
      success: true,
      batchCode,
      classCode,
      referenceStudent,
      candidates,
      reviewRegisteredCount: reviewSet.size,
      records,
      referenceRecords,
    });
  } catch (error: any) {
    console.error('GET /api/class-monitors/room-analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi phân tích phòng thi lớp' },
      { status: 500 }
    );
  }
}
