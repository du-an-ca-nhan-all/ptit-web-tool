import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';

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

function normalizeCode(value?: string | null): string {
  return String(value || '').trim().toUpperCase();
}

function makeRoomKey(maMH: string, mapThi: string, ngayThi: string, gioThi: string): string {
  return [
    normalizeCode(maMH),
    normalizeCode(mapThi),
    String(ngayThi || '').trim(),
    String(gioThi || '').trim(),
  ].join('|');
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
            select: {
              maSV: true,
              hoLot: true,
              ten: true,
              hoTen: true,
              soDienThoai: true,
              maLop: true,
            },
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

    // 2. Resolve reference student (default: logged-in monitor of this class, else class monitor in DB)
    const monitorSet = new Set(classMonitors.map((m) => normalizeCode(m.username)));
    let referenceMaSV = requestedRefMaSV;

    if (!referenceMaSV) {
      if (authUser.isMonitor && userClass === classCode && authUser.username) {
        referenceMaSV = normalizeCode(authUser.username);
      } else if (classMonitors.length > 0) {
        referenceMaSV = normalizeCode(classMonitors[0].username);
      } else if (authUser.username) {
        referenceMaSV = normalizeCode(authUser.username);
      }
    }

    // Fetch reference student profile & their exam records in this batch (in case monitor's student record isn't in classExamRecords)
    const [refStudentProfile, refExamRecordsRaw] = referenceMaSV
      ? await Promise.all([
          prisma.student.findFirst({
            where: { maSV: { equals: referenceMaSV, mode: 'insensitive' } },
            select: {
              maSV: true,
              hoLot: true,
              ten: true,
              hoTen: true,
              soDienThoai: true,
              maLop: true,
            },
          }),
          prisma.examRecord.findMany({
            where: {
              batchCode,
              maSV: { equals: referenceMaSV, mode: 'insensitive' },
            },
            include: {
              student: {
                select: {
                  maSV: true,
                  hoLot: true,
                  ten: true,
                  hoTen: true,
                  soDienThoai: true,
                  maLop: true,
                },
              },
            },
            orderBy: [{ ngayThi: 'asc' }, { gioThi: 'asc' }, { maMH: 'asc' }],
          }),
        ])
      : [null, []];

    // 3. Collect unique rooms across class records + reference records to compute total room capacity
    const uniqueRooms = new Map<
      string,
      { maMH: string; mapThi: string; ngayThi: string; gioThi: string }
    >();

    for (const rec of [...classExamRecords, ...refExamRecordsRaw]) {
      if (!rec.maMH || !rec.mapThi || !rec.ngayThi) continue;
      const key = makeRoomKey(rec.maMH, rec.mapThi, rec.ngayThi, rec.gioThi || '');
      if (!uniqueRooms.has(key)) {
        uniqueRooms.set(key, {
          maMH: rec.maMH,
          mapThi: rec.mapThi,
          ngayThi: rec.ngayThi,
          gioThi: rec.gioThi || '',
        });
      }
    }

    const roomTotalMap = new Map<string, Set<string>>();
    if (uniqueRooms.size > 0) {
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

      for (const row of roomRows) {
        const key = makeRoomKey(
          row.maMH || '',
          row.mapThi || '',
          row.ngayThi || '',
          row.gioThi || ''
        );
        const stId = normalizeCode(row.maSV);
        if (!stId) continue;
        if (!roomTotalMap.has(key)) {
          roomTotalMap.set(key, new Set());
        }
        roomTotalMap.get(key)!.add(stId);
      }
    }

    const reviewSet = new Set(reviewRegs.map((r) => normalizeCode(r.maSV)));
    const reviewNoteMap = new Map(reviewRegs.map((r) => [normalizeCode(r.maSV), r.note || '']));

    const formatRecord = (r: (typeof classExamRecords)[number]) => {
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
    };

    const records = classExamRecords.map(formatRecord);
    const referenceRecords = refExamRecordsRaw.map(formatRecord);

    // Build candidate list for switching reference student (monitors first, then class students with exams)
    const candidateMap = new Map<
      string,
      { maSV: string; hoTen: string; ten: string; isMonitor: boolean; examCount: number }
    >();

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
          isMonitor: monitorSet.has(referenceMaSV) || (authUser.isMonitor && normalizeCode(authUser.username) === referenceMaSV),
          examCount: referenceRecords.length,
        }
      : null;

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
