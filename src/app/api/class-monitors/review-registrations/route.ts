import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';

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

// GET /api/class-monitors/review-registrations?batchCode=...&classCode=...
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để truy cập' }, { status: 401 });
    }

    if (!authUser.isAdmin && !authUser.isMonitor) {
      return NextResponse.json(
        { error: 'Chỉ Lớp trưởng hoặc Quản trị viên mới có quyền quản lý danh sách ôn tập' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const batchCode = normalizeCode(searchParams.get('batchCode'));
    const requestedClass = normalizeCode(searchParams.get('classCode'));
    const userClass = normalizeCode(authUser.lop);
    const classCode = authUser.isAdmin ? requestedClass || userClass : userClass || requestedClass;

    if (!batchCode) {
      return NextResponse.json({ error: 'Mã đợt thi (batchCode) là bắt buộc' }, { status: 400 });
    }

    if (!classCode) {
      return NextResponse.json({ error: 'Mã lớp (classCode) là bắt buộc' }, { status: 400 });
    }

    // Non-admin monitors can only manage their own class
    if (!authUser.isAdmin && userClass && classCode !== userClass) {
      return NextResponse.json(
        { error: `Bạn chỉ có quyền quản lý danh sách ôn tập của lớp ${userClass}` },
        { status: 403 }
      );
    }

    // 1. Fetch class students, exam records in this batch, and existing review registrations in parallel
    const [classStudents, batchExamRecords, registrations] = await Promise.all([
      prisma.student.findMany({
        where: {
          maLop: { equals: classCode, mode: 'insensitive' },
          OR: [{ trangThai: null }, { trangThai: 'DANG_HOC' }],
        },
        select: {
          maSV: true,
          hoLot: true,
          ten: true,
          hoTen: true,
          gioiTinh: true,
          soDienThoai: true,
          maLop: true,
          trangThai: true,
        },
        orderBy: [{ ten: 'asc' }, { hoLot: 'asc' }, { maSV: 'asc' }],
      }),
      prisma.examRecord.findMany({
        where: {
          batchCode,
          OR: [
            { student: { maLop: { equals: classCode, mode: 'insensitive' } } },
            { maLopMH: { equals: classCode, mode: 'insensitive' } },
          ],
        },
        select: {
          maSV: true,
          maMH: true,
          tenMH: true,
          isPostponed: true,
          student: {
            select: {
              hoLot: true,
              ten: true,
              hoTen: true,
              gioiTinh: true,
              soDienThoai: true,
              maLop: true,
            },
          },
        },
      }),
      prisma.examReviewRegistration.findMany({
        where: {
          batchCode,
          classCode,
        },
      }),
    ]);

    // Map registrations by maSV
    const regMap = new Map<string, (typeof registrations)[number]>();
    for (const reg of registrations) {
      regMap.set(normalizeCode(reg.maSV), reg);
    }

    // Group exam subjects per student in this batch
    const examMap = new Map<
      string,
      {
        subjects: Map<string, string>;
        studentInfo?: {
          hoLot: string | null;
          ten: string | null;
          hoTen: string | null;
          gioiTinh: string | null;
          soDienThoai: string | null;
          maLop: string | null;
        };
      }
    >();

    for (const rec of batchExamRecords) {
      const maSV = normalizeCode(rec.maSV);
      if (!maSV) continue;
      if (!examMap.has(maSV)) {
        examMap.set(maSV, {
          subjects: new Map(),
          studentInfo: rec.student || undefined,
        });
      }
      if (rec.maMH) {
        examMap.get(maSV)!.subjects.set(rec.maMH, rec.tenMH || rec.maMH);
      }
    }

    // Combine students from Student table + any student found in exam records of this batch/class
    const studentById = new Map<
      string,
      {
        maSV: string;
        hoLot: string;
        ten: string;
        hoTen: string;
        gioiTinh: string;
        soDienThoai: string;
        maLop: string;
      }
    >();

    for (const st of classStudents) {
      const maSV = normalizeCode(st.maSV);
      if (!maSV) continue;
      const hoTen = st.hoTen?.trim() || `${st.hoLot || ''} ${st.ten || ''}`.trim() || maSV;
      studentById.set(maSV, {
        maSV,
        hoLot: st.hoLot || '',
        ten: st.ten || '',
        hoTen,
        gioiTinh: st.gioiTinh || 'Nam',
        soDienThoai: st.soDienThoai || '',
        maLop: st.maLop || classCode,
      });
    }

    for (const [maSV, info] of examMap.entries()) {
      if (!studentById.has(maSV)) {
        const st = info.studentInfo;
        const hoTen = st?.hoTen?.trim() || `${st?.hoLot || ''} ${st?.ten || ''}`.trim() || maSV;
        studentById.set(maSV, {
          maSV,
          hoLot: st?.hoLot || '',
          ten: st?.ten || '',
          hoTen,
          gioiTinh: st?.gioiTinh || 'Nam',
          soDienThoai: st?.soDienThoai || '',
          maLop: st?.maLop || classCode,
        });
      }
    }

    const students = Array.from(studentById.values())
      .map((st) => {
        const reg = regMap.get(st.maSV);
        const exams = examMap.get(st.maSV);
        const examSubjects = exams
          ? Array.from(exams.subjects.entries()).map(([code, name]) => ({ code, name }))
          : [];

        return {
          ...st,
          isRegistered: Boolean(reg?.isRegistered),
          note: reg?.note || '',
          updatedBy: reg?.updatedBy || null,
          updatedAt: reg?.updatedAt ? reg.updatedAt.toISOString() : null,
          examCount: examSubjects.length,
          examSubjects,
        };
      })
      .sort((a, b) => {
        const tenCmp = (a.ten || '').localeCompare(b.ten || '', 'vi');
        if (tenCmp !== 0) return tenCmp;
        const hoCmp = (a.hoLot || '').localeCompare(b.hoLot || '', 'vi');
        if (hoCmp !== 0) return hoCmp;
        return a.maSV.localeCompare(b.maSV);
      });

    const registeredCount = students.filter((s) => s.isRegistered).length;
    const studentsWithExams = students.filter((s) => s.examCount > 0).length;

    return NextResponse.json({
      success: true,
      batchCode,
      classCode,
      students,
      summary: {
        totalStudents: students.length,
        registeredCount,
        unregisteredCount: students.length - registeredCount,
        studentsWithExams,
      },
    });
  } catch (error: any) {
    console.error('GET /api/class-monitors/review-registrations error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi tải danh sách đăng ký ôn tập' },
      { status: 500 }
    );
  }
}

// POST /api/class-monitors/review-registrations
// Actions: TOGGLE_ONE | SAVE_BULK | IMPORT_MASV
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện' }, { status: 401 });
    }

    if (!authUser.isAdmin && !authUser.isMonitor) {
      return NextResponse.json(
        { error: 'Chỉ Lớp trưởng hoặc Quản trị viên mới có quyền cấu hình danh sách ôn tập' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const action = String(body.action || 'TOGGLE_ONE').toUpperCase();
    const batchCode = normalizeCode(body.batchCode);
    const requestedClass = normalizeCode(body.classCode);
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
        { error: `Bạn chỉ có quyền cấu hình danh sách ôn tập của lớp ${userClass}` },
        { status: 403 }
      );
    }

    // 1. Toggle or update note for a single student
    if (action === 'TOGGLE_ONE') {
      const maSV = normalizeCode(body.maSV);
      if (!maSV) {
        return NextResponse.json({ error: 'Mã sinh viên (maSV) là bắt buộc' }, { status: 400 });
      }

      const isRegistered = Boolean(body.isRegistered);
      const note = body.note !== undefined ? String(body.note || '').trim() || null : undefined;

      const updated = await prisma.examReviewRegistration.upsert({
        where: {
          batchCode_classCode_maSV: {
            batchCode,
            classCode,
            maSV,
          },
        },
        update: {
          isRegistered,
          ...(note !== undefined ? { note } : {}),
          updatedBy: authUser.username,
        },
        create: {
          batchCode,
          classCode,
          maSV,
          isRegistered,
          note: note ?? null,
          updatedBy: authUser.username,
        },
      });

      return NextResponse.json({
        success: true,
        registration: updated,
      });
    }

    // 2. Bulk save (Select all / Clear all / Select students with exams / Save list)
    if (action === 'SAVE_BULK') {
      const items: Array<{ maSV: string; isRegistered: boolean; note?: string | null }> = Array.isArray(
        body.items
      )
        ? body.items
        : [];

      if (items.length === 0) {
        return NextResponse.json({ error: 'Danh sách cập nhật không được rỗng' }, { status: 400 });
      }

      const operations = items
        .map((item) => {
          const maSV = normalizeCode(item.maSV);
          if (!maSV) return null;
          const note =
            item.note !== undefined ? String(item.note || '').trim() || null : undefined;

          return prisma.examReviewRegistration.upsert({
            where: {
              batchCode_classCode_maSV: {
                batchCode,
                classCode,
                maSV,
              },
            },
            update: {
              isRegistered: Boolean(item.isRegistered),
              ...(note !== undefined ? { note } : {}),
              updatedBy: authUser.username,
            },
            create: {
              batchCode,
              classCode,
              maSV,
              isRegistered: Boolean(item.isRegistered),
              note: note ?? null,
              updatedBy: authUser.username,
            },
          });
        })
        .filter((op): op is NonNullable<typeof op> => op !== null);

      await prisma.$transaction(operations);

      const registeredCount = items.filter((i) => i.isRegistered).length;

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'UPDATE_EXAM_REVIEW_REGISTRATIONS',
        targetType: 'EXAM_REVIEW',
        targetId: `${batchCode}:${classCode}`,
        description: `Cập nhật danh sách đăng ký ôn tập lớp ${classCode} - đợt ${batchCode} (${registeredCount}/${items.length} SV đăng ký)`,
        metadata: { batchCode, classCode, total: items.length, registeredCount },
      });

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật danh sách ôn tập lớp ${classCode} (${registeredCount} SV đăng ký)`,
        registeredCount,
      });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/class-monitors/review-registrations error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi lưu danh sách đăng ký ôn tập' },
      { status: 500 }
    );
  }
}
