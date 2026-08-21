import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin } from '@/src/lib/auth';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';

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
      return NextResponse.json({ error: 'Chỉ Quản trị viên mới có quyền import dữ liệu lịch thi' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const mode = formData.get('mode') as string; // 'replace' or 'append'

    if (!file) {
      return NextResponse.json({ error: 'Vui lòng tải lên tệp CSV' }, { status: 400 });
    }

    const csvText = await file.text();
    const parsed = Papa.parse<any>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const validData = (parsed.data || []).filter((row) => row.MaSV);

    if (validData.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy dòng dữ liệu hợp lệ nào trong CSV' }, { status: 400 });
    }

    // Student main class map
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
    const batchesMap = new Map<string, string>();
    const examRecordsList: any[] = [];

    validData.forEach((row) => {
      const maSV = String(row.MaSV || '').trim().toUpperCase();
      if (!maSV) return;

      const maLop = studentMainClassMap.get(maSV) || row.MaLop;
      const batchCode = row.MaDotThi ? String(row.MaDotThi).trim() : null;
      const batchName = row.TenDotThi ? String(row.TenDotThi).trim() : (batchCode || 'Đợt thi chính thức');

      if (batchCode && !batchesMap.has(batchCode)) {
        batchesMap.set(batchCode, batchName);
      }

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
        batchCode: batchCode || null,
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
        maDotThi: batchCode,
        tenDotThi: batchName,
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

    if (mode === 'replace') {
      await prisma.examRecord.deleteMany();
    }

    // Upsert batches to guarantee PostgreSQL foreign key integrity
    for (const [bCode, bName] of batchesMap.entries()) {
      await prisma.examBatch.upsert({
        where: { code: bCode },
        update: { name: bName },
        create: {
          code: bCode,
          name: bName,
          isActive: true,
        },
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
      action: 'IMPORT_EXAM_SCHEDULE',
      targetType: 'EXAM_RECORD',
      targetId: file.name,
      description: `Nhập ${examRecordsList.length} bản ghi lịch thi từ file "${file.name}" (Chế độ: ${mode})`,
      metadata: { fileName: file.name, mode, totalRecords: examRecordsList.length, totalStudents: studentArray.length },
    });

    return NextResponse.json({
      success: true,
      message: `Đã nhập thành công ${examRecordsList.length} bản ghi lịch thi và ${studentArray.length} sinh viên`,
      totalRecords: examRecordsList.length,
      totalStudents: studentArray.length,
    });
  } catch (error: any) {
    console.error('Import exam records error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
