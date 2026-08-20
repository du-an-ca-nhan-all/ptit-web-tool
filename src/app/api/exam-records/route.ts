import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin, checkIsMonitor } from '@/src/lib/auth';
import { logActivity } from '@/src/lib/activityLog';
import { dispatchExamPostponed } from '@/src/lib/telegram-dispatcher';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';
    const batchCode = searchParams.get('batchCode') || undefined;
    const classCode =
      searchParams.get('classCode') ||
      searchParams.get('monitorClass') ||
      searchParams.get('maLop') ||
      undefined;
    const subjectCode = searchParams.get('subjectCode') || undefined;
    const date = searchParams.get('date') || undefined;
    const mapThi = searchParams.get('mapThi') || undefined;
    const gioThi = searchParams.get('gioThi') || undefined;
    const maSV = searchParams.get('maSV') || undefined;
    const search = searchParams.get('search') || undefined;
    const distinct = searchParams.get('distinct');

    // Distinct filter metadata
    if (distinct) {
      const classesRaw = await prisma.student.findMany({
        where: { maLop: { not: null } },
        distinct: ['maLop'],
        select: { maLop: true },
      });
      const classes = classesRaw.map((r) => r.maLop!).sort();

      const batchFilter = batchCode && batchCode !== 'ALL' ? { batchCode } : {};

      const subjectsRaw = await prisma.examRecord.findMany({
        where: { ...batchFilter, maMH: { not: null }, tenMH: { not: null } },
        distinct: ['maMH'],
        select: { maMH: true, tenMH: true },
      });
      const subjects = subjectsRaw
        .map((r) => ({ code: r.maMH!, name: r.tenMH! }))
        .sort((a, b) => a.code.localeCompare(b.code));

      const datesRaw = await prisma.examRecord.findMany({
        where: { ...batchFilter, ngayThi: { not: null } },
        distinct: ['ngayThi'],
        select: { ngayThi: true },
      });
      const dates = datesRaw.map((r) => r.ngayThi!).sort((a, b) => {
        const [d1, m1, y1] = a.split('/').map(Number);
        const [d2, m2, y2] = b.split('/').map(Number);
        if (y1 !== y2) return (y1 || 0) - (y2 || 0);
        if (m1 !== m2) return (m1 || 0) - (m2 || 0);
        return (d1 || 0) - (d2 || 0);
      });

      return NextResponse.json({ classes, subjects, dates });
    }

    const andConditions: any[] = [];
    if (batchCode && batchCode !== 'ALL') {
      andConditions.push({ batchCode });
    }
    if (classCode && classCode !== 'ALL') {
      andConditions.push({
        OR: [
          { student: { maLop: { equals: classCode, mode: 'insensitive' } } },
          { maLopMH: { equals: classCode, mode: 'insensitive' } },
        ],
      });
    }
    if (subjectCode) {
      andConditions.push({ maMH: subjectCode });
    }
    if (date) {
      andConditions.push({ ngayThi: date });
    }
    if (mapThi) {
      andConditions.push({ mapThi });
    }
    if (gioThi) {
      andConditions.push({ gioThi });
    }
    if (maSV) {
      andConditions.push({ maSV: { equals: maSV.toUpperCase(), mode: 'insensitive' } });
    }

    if (search) {
      const q = search.trim();
      andConditions.push({
        OR: [
          { maSV: { contains: q, mode: 'insensitive' } },
          { tenMH: { contains: q, mode: 'insensitive' } },
          { maMH: { contains: q, mode: 'insensitive' } },
          { mapThi: { contains: q, mode: 'insensitive' } },
          { student: { ten: { contains: q, mode: 'insensitive' } } },
          { student: { hoLot: { contains: q, mode: 'insensitive' } } },
          { student: { hoTen: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }

    if (searchParams.get('isPostponed') !== null && searchParams.get('isPostponed') !== '') {
      andConditions.push({ isPostponed: searchParams.get('isPostponed') === 'true' });
    }

    const where: any = andConditions.length > 0 ? { AND: andConditions } : {};

    const formatRecord = (r: any) => ({
      id: r.id,
      MaSV: r.maSV,
      HoLotSV: r.student?.hoLot || '',
      TenSV: r.student?.ten || '',
      PHAI: r.student?.gioiTinh || 'Nam',
      NgaySinhC: r.student?.ngaySinh || '',
      NhomThi: r.nhomThi || '',
      MAPTHI: r.mapThi || '',
      MaMH: r.maMH || '',
      TenMH: r.tenMH || '',
      MaHTThi: r.maHTThi || '',
      NhomHoc: r.nhomHoc || '',
      'To thi': r.toThi || '',
      ToThi: r.toThi || '',
      MaLop: r.student?.maLop || r.maLopMH || '',
      NgayThi: r.ngayThi || '',
      GioThi: r.gioThi || '',
      SoPhutThi: r.soPhutThi || '',
      MaDotThi: r.maDotThi || r.batchCode || '',
      TenDotThi: r.tenDotThi || '',
      batchCode: r.batchCode || '',
      isPostponed: Boolean(r.isPostponed),
    });

    const sortKey = searchParams.get('sortKey');
    const sortDir = (searchParams.get('sortDir') || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

    let orderBy: any[] = [{ ngayThi: 'asc' }, { gioThi: 'asc' }];
    if (sortKey === 'MaSV') {
      orderBy = [{ maSV: sortDir }];
    } else if (sortKey === 'Name') {
      orderBy = [{ student: { ten: sortDir } }, { student: { hoLot: sortDir } }];
    } else if (sortKey === 'MaLop') {
      orderBy = [{ student: { maLop: sortDir } }, { maLopMH: sortDir }];
    } else if (sortKey === 'MaMH') {
      orderBy = [{ tenMH: sortDir }, { maMH: sortDir }];
    } else if (sortKey === 'DateTime') {
      orderBy = [{ ngayThi: sortDir }, { gioThi: sortDir }];
    }

    if (all) {
      const records = await prisma.examRecord.findMany({
        where,
        include: {
          student: true,
        },
        orderBy,
      });

      return NextResponse.json({
        records: records.map(formatRecord),
        total: records.length,
      });
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.examRecord.findMany({
        where,
        include: {
          student: true,
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.examRecord.count({ where }),
    ]);

    return NextResponse.json({
      records: records.map(formatRecord),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Exam records API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    let authUser = null;
    try {
      authUser = await getCurrentUserFromCookie();
      if (!authUser) {
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          authUser = await verifyAuthToken(token);
        }
      }
    } catch (authErr) {
      console.warn('Auth extraction error in exam-records PATCH:', authErr);
    }

    const body = await req.json().catch(() => ({}));
    const rawId = body.id ?? body.Id ?? body.ID;
    const rawIds = body.ids ?? body.Ids ?? body.IDS;
    const rawIsPostponed = body.isPostponed ?? body.IsPostponed ?? body.is_postponed;
    const rawMaSV = body.maSV ?? body.MaSV ?? body.MASV ?? body.studentId;
    const rawMaMH = body.maMH ?? body.MaMH ?? body.MAMH ?? body.subjectCode;
    const rawMapThi = body.mapThi ?? body.MAPTHI ?? body.MapThi ?? body.room;
    const rawNgayThi = body.ngayThi ?? body.NgayThi ?? body.NGAYTHI ?? body.date;
    const rawGioThi = body.gioThi ?? body.GioThi ?? body.GIOTHI ?? body.time;

    // Normalize boolean
    let cleanIsPostponed = false;
    if (typeof rawIsPostponed === 'boolean') {
      cleanIsPostponed = rawIsPostponed;
    } else if (rawIsPostponed === 'true' || rawIsPostponed === 1 || rawIsPostponed === '1') {
      cleanIsPostponed = true;
    } else if (rawIsPostponed === 'false' || rawIsPostponed === 0 || rawIsPostponed === '0') {
      cleanIsPostponed = false;
    } else {
      return NextResponse.json(
        { error: 'Giá trị isPostponed (true/false) là bắt buộc' },
        { status: 400 }
      );
    }

    let updatedCount = 0;
    let targetDesc = '';

    // 1. Try update by specific numeric id if provided
    if (rawId !== undefined && rawId !== null && !isNaN(Number(rawId))) {
      const numId = Number(rawId);
      try {
        const existing = await prisma.examRecord.findUnique({ where: { id: numId } });
        if (existing) {
          await prisma.examRecord.update({
            where: { id: numId },
            data: { isPostponed: cleanIsPostponed },
          });
          updatedCount = 1;
          targetDesc = `ID ${numId} (SV: ${existing.maSV} - Môn: ${existing.tenMH || existing.maMH})`;
        }
      } catch (err) {
        console.warn('Prisma find/update by ID error, will try query fallback:', err);
      }
    }

    // 2. Try update by array of numeric ids
    if (updatedCount === 0 && Array.isArray(rawIds) && rawIds.length > 0) {
      const validIds = rawIds.map(Number).filter((n) => !isNaN(n));
      if (validIds.length > 0) {
        try {
          const result = await prisma.examRecord.updateMany({
            where: { id: { in: validIds } },
            data: { isPostponed: cleanIsPostponed },
          });
          updatedCount = result.count;
          targetDesc = `${updatedCount} bản ghi (IDs: ${validIds.join(', ')})`;
        } catch (err) {
          console.warn('updateMany with IDs error:', err);
        }
      }
    }

    // 3. Fallback: match by (maSV + maMH) and optional (mapThi, ngayThi, gioThi)
    const cleanMaSV = rawMaSV ? String(rawMaSV).trim().toUpperCase() : '';
    const cleanMaMH = rawMaMH ? String(rawMaMH).trim() : '';
    const cleanMapThi = rawMapThi ? String(rawMapThi).trim() : '';
    const cleanNgayThi = rawNgayThi ? String(rawNgayThi).trim() : '';
    const cleanGioThi = rawGioThi ? String(rawGioThi).trim() : '';

    if (updatedCount === 0 && cleanMaSV) {
      const whereCond: any = { maSV: cleanMaSV };

      if (cleanMaMH) whereCond.maMH = cleanMaMH;
      if (cleanMapThi) whereCond.mapThi = cleanMapThi;
      if (cleanNgayThi) whereCond.ngayThi = cleanNgayThi;
      if (cleanGioThi) whereCond.gioThi = cleanGioThi;

      try {
        const result = await prisma.examRecord.updateMany({
          where: whereCond,
          data: { isPostponed: cleanIsPostponed },
        });
        updatedCount = result.count;
      } catch (err) {
        console.warn('updateMany with strict filter error:', err);
      }

      // If strict filter didn't find any, try looser filter with just maSV + maMH
      if (updatedCount === 0 && cleanMaMH) {
        try {
          const fallbackResult = await prisma.examRecord.updateMany({
            where: {
              maSV: cleanMaSV,
              maMH: cleanMaMH,
            },
            data: { isPostponed: cleanIsPostponed },
          });
          updatedCount = fallbackResult.count;
        } catch (err) {
          console.warn('updateMany with loose filter error:', err);
        }
      }

      targetDesc = `SV ${cleanMaSV} - Môn ${cleanMaMH || 'Tất cả'} (Cập nhật ${updatedCount} bản ghi)`;
    }

    // 4. Log activity if user is authenticated (never break response if logging fails)
    if (authUser) {
      try {
        await logActivity({
          req,
          userId: authUser.id,
          username: authUser.username,
          userRole: authUser.role,
          action: cleanIsPostponed ? 'MARK_EXAM_POSTPONED' : 'UNMARK_EXAM_POSTPONED',
          targetType: 'EXAM_RECORD',
          targetId: String(rawId || rawIds?.[0] || cleanMaSV || 'UNKNOWN'),
          description: `${authUser.fullName || authUser.username} đã ${
            cleanIsPostponed ? 'đánh dấu hoãn thi/không thi (không chia tiền)' : 'bỏ đánh dấu hoãn thi'
          } cho ${targetDesc || cleanMaSV || 'bản ghi'}`,
          metadata: {
            id: rawId,
            ids: rawIds,
            maSV: cleanMaSV,
            maMH: cleanMaMH,
            mapThi: cleanMapThi,
            ngayThi: cleanNgayThi,
            gioThi: cleanGioThi,
            isPostponed: cleanIsPostponed,
            updatedCount,
          },
        });
      } catch (logErr) {
        console.warn('[ActivityLog] Ghi log thất bại:', logErr);
      }
    }

    // 5. Dispatch Telegram notification asynchronously
    if (cleanMaSV) {
      try {
        dispatchExamPostponed({
          username: cleanMaSV,
          subjectCode: cleanMaMH || undefined,
          isPostponed: cleanIsPostponed,
          examDate: cleanNgayThi || undefined,
          examTime: cleanGioThi || undefined,
          examRoom: cleanMapThi || undefined,
        }).catch((err) => console.error('Dispatch exam postponed error:', err));
      } catch (dispatchErr) {
        console.warn('Dispatch notification error in exam-records PATCH:', dispatchErr);
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      isPostponed: cleanIsPostponed,
      message: `Đã ${cleanIsPostponed ? 'đánh dấu hoãn thi' : 'hủy hoãn thi'} thành công (${updatedCount} bản ghi)`,
    });
  } catch (error: any) {
    console.error('Exam records PATCH error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi cập nhật trạng thái hoãn thi' },
      { status: 500 }
    );
  }
}
