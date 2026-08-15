import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { ensureDatabaseSeeded } from '@/src/lib/dbSeeder';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin, checkIsMonitor } from '@/src/lib/auth';
import { logActivity } from '@/src/lib/activityLog';
import { dispatchExamPostponed } from '@/src/lib/telegram-dispatcher';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded(false);

    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';
    const batchCode = searchParams.get('batchCode') || undefined;
    const classCode = searchParams.get('classCode') || undefined;
    const subjectCode = searchParams.get('subjectCode') || undefined;
    const date = searchParams.get('date') || undefined;
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

      const batchFilter = batchCode ? { batchCode } : {};

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

    const where: any = {};
    if (batchCode) where.batchCode = batchCode;
    if (classCode) where.student = { maLop: classCode };
    if (subjectCode) where.maMH = subjectCode;
    if (date) where.ngayThi = date;
    if (maSV) where.maSV = maSV.toUpperCase();

    if (search) {
      const q = search.trim();
      where.OR = [
        { maSV: { contains: q } },
        { tenMH: { contains: q } },
        { maMH: { contains: q } },
        { mapThi: { contains: q } },
        { student: { ten: { contains: q } } },
        { student: { hoLot: { contains: q } } },
        { student: { hoTen: { contains: q } } },
      ];
    }

    if (searchParams.get('isPostponed') !== null && searchParams.get('isPostponed') !== '') {
      where.isPostponed = searchParams.get('isPostponed') === 'true';
    }

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

    if (all) {
      const records = await prisma.examRecord.findMany({
        where,
        include: {
          student: true,
        },
        orderBy: [{ ngayThi: 'asc' }, { gioThi: 'asc' }],
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
        orderBy: [{ ngayThi: 'asc' }, { gioThi: 'asc' }],
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
    let authUser = await getCurrentUserFromCookie();
    if (!authUser) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        authUser = await verifyAuthToken(token);
      }
    }

    const body = await req.json().catch(() => ({}));
    const { id, ids, isPostponed, maSV, maMH, mapThi, ngayThi, gioThi } = body;

    if (typeof isPostponed !== 'boolean') {
      return NextResponse.json({ error: 'Giá trị isPostponed (true/false) là bắt buộc' }, { status: 400 });
    }

    let updatedCount = 0;
    let targetDesc = '';

    // 1. Try update by specific numeric id if provided
    if (id && !isNaN(Number(id))) {
      try {
        const existing = await prisma.examRecord.findUnique({ where: { id: Number(id) } });
        if (existing) {
          await prisma.examRecord.update({
            where: { id: Number(id) },
            data: { isPostponed },
          });
          updatedCount = 1;
          targetDesc = `ID ${id} (SV: ${existing.maSV} - Môn: ${existing.tenMH || existing.maMH})`;
        }
      } catch (err) {
        console.warn('Prisma find/update by ID error, will try query fallback:', err);
      }
    }

    // 2. Try update by array of numeric ids
    if (updatedCount === 0 && Array.isArray(ids) && ids.length > 0) {
      const validIds = ids.map(Number).filter((n) => !isNaN(n));
      if (validIds.length > 0) {
        const result = await prisma.examRecord.updateMany({
          where: { id: { in: validIds } },
          data: { isPostponed },
        });
        updatedCount = result.count;
        targetDesc = `${updatedCount} bản ghi (IDs: ${validIds.join(', ')})`;
      }
    }

    // 3. Fallback: match by (maSV + maMH) and optional (mapThi, ngayThi, gioThi)
    if (updatedCount === 0 && maSV) {
      const cleanMaSV = String(maSV).trim().toUpperCase();
      const whereCond: any = { maSV: cleanMaSV };

      if (maMH) {
        whereCond.maMH = String(maMH).trim();
      }
      if (mapThi) {
        whereCond.mapThi = String(mapThi).trim();
      }
      if (ngayThi) {
        whereCond.ngayThi = String(ngayThi).trim();
      }
      if (gioThi) {
        whereCond.gioThi = String(gioThi).trim();
      }

      const result = await prisma.examRecord.updateMany({
        where: whereCond,
        data: { isPostponed },
      });
      updatedCount = result.count;

      // If strict filter didn't find any, try looser filter with just maSV + maMH
      if (updatedCount === 0 && maMH) {
        const fallbackResult = await prisma.examRecord.updateMany({
          where: {
            maSV: cleanMaSV,
            maMH: String(maMH).trim(),
          },
          data: { isPostponed },
        });
        updatedCount = fallbackResult.count;
      }

      targetDesc = `SV ${maSV} - Môn ${maMH || 'Tất cả'} (Cập nhật ${updatedCount} bản ghi)`;
    }

    // 4. Log activity if user is authenticated
    if (authUser) {
      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: isPostponed ? 'MARK_EXAM_POSTPONED' : 'UNMARK_EXAM_POSTPONED',
        targetType: 'EXAM_RECORD',
        targetId: String(id || ids?.[0] || maSV || 'UNKNOWN'),
        description: `${authUser.fullName || authUser.username} đã ${
          isPostponed ? 'đánh dấu hoãn thi/không thi (không chia tiền)' : 'bỏ đánh dấu hoãn thi'
        } cho ${targetDesc || maSV || 'bản ghi'}`,
        metadata: { id, ids, maSV, maMH, mapThi, ngayThi, gioThi, isPostponed, updatedCount },
      }).catch(() => {});
    }

    // 5. Dispatch Telegram notification asynchronously
    if (maSV) {
      dispatchExamPostponed({
        username: String(maSV).trim(),
        subjectCode: maMH ? String(maMH).trim() : undefined,
        isPostponed,
        examDate: ngayThi ? String(ngayThi).trim() : undefined,
        examTime: gioThi ? String(gioThi).trim() : undefined,
        examRoom: mapThi ? String(mapThi).trim() : undefined,
      }).catch((err) => console.error('Dispatch exam postponed error:', err));
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      isPostponed,
      message: `Đã ${isPostponed ? 'đánh dấu hoãn thi' : 'hủy hoãn thi'} thành công (${updatedCount} bản ghi)`,
    });
  } catch (error: any) {
    console.error('Exam records PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi cập nhật trạng thái hoãn thi' }, { status: 500 });
  }
}
