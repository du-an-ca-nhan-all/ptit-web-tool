import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin } from '@/src/lib/auth';
import { logActivity } from '@/src/lib/activityLog';
import { dispatchExamScheduleUpdated } from '@/src/lib/telegram-dispatcher';

// POST /api/exam-batches/import
// Upload CSV exam schedule specifically for an Exam Batch
export async function POST(req: NextRequest) {
  try {
    let authUser = await getCurrentUserFromCookie();
    if (!authUser) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        authUser = await verifyAuthToken(token);
      }
    }

    if (!authUser || !checkIsAdmin(authUser.role)) {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên (Admin) mới có quyền import dữ liệu lịch thi' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const batchCode = formData.get('batchCode') as string;
    const mode = (formData.get('mode') as string) || 'replace'; // 'replace' | 'append'

    if (!file) {
      return NextResponse.json({ error: 'Vui lòng chọn tệp CSV để tải lên' }, { status: 400 });
    }

    if (!batchCode) {
      return NextResponse.json({ error: 'Mã đợt thi (batchCode) là bắt buộc' }, { status: 400 });
    }

    const cleanBatchCode = String(batchCode).trim().toUpperCase();

    // Ensure target batch exists
    const batch = await prisma.examBatch.findUnique({
      where: { code: cleanBatchCode },
    });

    if (!batch) {
      return NextResponse.json({ error: `Đợt thi ${cleanBatchCode} không tồn tại` }, { status: 404 });
    }

    const csvText = await file.text();
    const parsed = Papa.parse<any>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const validData = (parsed.data || []).filter((row) => row.MaSV);

    if (validData.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi thi hợp lệ nào trong tệp CSV' }, { status: 400 });
    }

    // Extract student main class
    const studentMainClassMap = new Map<string, string>();
    validData.forEach((row) => {
      if (row.MaSV && row.MaLop && !row.MaLop.includes(',')) {
        const isStandard = /^[DC]\d{2}/i.test(row.MaLop);
        if (isStandard || !studentMainClassMap.has(row.MaSV)) {
          studentMainClassMap.set(row.MaSV, row.MaLop);
        }
      }
    });

    const studentMap = new Map<string, any>();
    const examRecordsList: any[] = [];

    validData.forEach((row) => {
      const maSV = String(row.MaSV || '').trim().toUpperCase();
      if (!maSV) return;

      const maLop = studentMainClassMap.get(maSV) || row.MaLop;

      if (!studentMap.has(maSV)) {
        const hoLot = row.HoLotSV ? String(row.HoLotSV).trim() : '';
        const ten = row.TenSV ? String(row.TenSV).trim() : '';
        const hoTen = `${hoLot} ${ten}`.trim();

        studentMap.set(maSV, {
          maSV,
          hoLot: hoLot || null,
          ten: ten || null,
          hoTen: hoTen || null,
          gioiTinh: row.PHAI ? String(row.PHAI).trim() : 'Nam',
          ngaySinh: row.NgaySinhC ? String(row.NgaySinhC).trim() : null,
          maLop: maLop ? String(maLop).trim() : null,
          trangThai: 'DANG_HOC',
        });
      }

      examRecordsList.push({
        maSV,
        batchCode: cleanBatchCode,
        nhomThi: row.NhomThi ? String(row.NhomThi).trim() : null,
        mapThi: row.MAPTHI ? String(row.MAPTHI).trim() : null,
        maMH: row.MaMH ? String(row.MaMH).trim() : null,
        tenMH: row.TenMH ? String(row.TenMH).trim() : null,
        maHTThi: row.MaHTThi ? String(row.MaHTThi).trim() : null,
        nhomHoc: row.NhomHoc ? String(row.NhomHoc).trim() : null,
        toThi: row['To thi'] ? String(row['To thi']).trim() : (row.ToThi ? String(row.ToThi).trim() : null),
        maLopMH: row.MaLop ? String(row.MaLop).trim() : null,
        ngayThi: row.NgayThi ? String(row.NgayThi).trim() : null,
        gioThi: row.GioThi ? String(row.GioThi).trim() : null,
        soPhutThi: row.SoPhutThi ? String(row.SoPhutThi).trim() : null,
        maDotThi: cleanBatchCode,
        tenDotThi: batch.name,
        isPostponed:
          row.isPostponed === true ||
          row.isPostponed === 'true' ||
          row.isPostponed === '1' ||
          row.HoanThi === 'true' ||
          row.KhongThi === 'true' ||
          row['Hoãn thi'] === 'true' ||
          false,
      });
    });

    // If replace mode, clear records of this batch first
    if (mode === 'replace') {
      await prisma.examRecord.deleteMany({
        where: { batchCode: cleanBatchCode },
      });
    }

    // Batch upsert students
    const studentArray = Array.from(studentMap.values());
    for (const student of studentArray) {
      await prisma.student.upsert({
        where: { maSV: student.maSV },
        update: {
          hoLot: student.hoLot,
          ten: student.ten,
          hoTen: student.hoTen,
          gioiTinh: student.gioiTinh,
          ngaySinh: student.ngaySinh,
          maLop: student.maLop,
        },
        create: student,
      });

      // Ensure User account
      await prisma.user.upsert({
        where: { username: student.maSV },
        update: {},
        create: {
          username: student.maSV,
          passwordHash: '',
          role: 'sinh_vien',
        },
      });
    }

    // Batch insert ExamRecords
    const chunkSize = 500;
    for (let i = 0; i < examRecordsList.length; i += chunkSize) {
      const chunk = examRecordsList.slice(i, i + chunkSize);
      await prisma.examRecord.createMany({
        data: chunk,
        skipDuplicates: true,
      });
    }

    await logActivity({
      req,
      userId: authUser.id,
      username: authUser.username,
      userRole: authUser.role,
      action: 'IMPORT_BATCH_FILE',
      targetType: 'EXAM_BATCH',
      targetId: cleanBatchCode,
      description: `Nhập ${examRecordsList.length} bản ghi lịch thi từ file "${file.name}" vào đợt thi "${batch.name}" (Chế độ: ${mode})`,
      metadata: { fileName: file.name, batchCode: cleanBatchCode, mode, totalRecords: examRecordsList.length, totalStudents: studentArray.length },
    });

    // Asynchronously dispatch Telegram notifications to registered students
    dispatchExamScheduleUpdated({
      usernames: studentArray.map((s) => s.maSV),
      batchCode: cleanBatchCode,
      batchName: batch.name,
      totalRecords: examRecordsList.length,
    }).catch((err) => console.error('Dispatch exam schedule updated error:', err));

    return NextResponse.json({
      success: true,
      message: `Đã nhập thành công ${examRecordsList.length} bản ghi lịch thi vào đợt "${batch.name}"`,
      batchCode: cleanBatchCode,
      totalRecords: examRecordsList.length,
      totalStudents: studentArray.length,
    });
  } catch (error: any) {
    console.error('Batch import error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
