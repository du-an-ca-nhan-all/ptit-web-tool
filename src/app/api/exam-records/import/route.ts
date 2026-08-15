import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { prisma } from '@/src/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let csvText = '';
    let replace = false;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      replace = formData.get('replace') === 'true';

      if (!file) {
        return NextResponse.json({ error: 'Không tìm thấy tệp tải lên' }, { status: 400 });
      }
      csvText = await file.text();
    } else {
      const body = await req.json();
      csvText = body.csvText || '';
      replace = body.replace === true;
    }

    if (!csvText.trim()) {
      return NextResponse.json({ error: 'Dữ liệu CSV trống' }, { status: 400 });
    }

    const parsed = Papa.parse<any>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const validData = (parsed.data || []).filter((row) => row.MaSV);

    if (validData.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy dòng dữ liệu hợp lệ nào trong CSV' }, { status: 400 });
    }

    // Process class mappings from classConfig
    const configs = await prisma.classConfig.findMany();
    const includedMap = new Map<string, string>();
    const excludedSet = new Set<string>();

    configs.forEach((cfg) => {
      try {
        if (cfg.includedStudents) {
          const inc = JSON.parse(cfg.includedStudents);
          if (Array.isArray(inc)) inc.forEach((id: string) => includedMap.set(id, cfg.classCode));
        }
        if (cfg.excludedStudents) {
          const exc = JSON.parse(cfg.excludedStudents);
          if (Array.isArray(exc)) exc.forEach((id: string) => excludedSet.add(id));
        }
      } catch (e) {}
    });

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
    const examRecordsList: any[] = [];

    validData.forEach((row) => {
      const maSV = String(row.MaSV || '').trim().toUpperCase();
      if (!maSV || excludedSet.has(maSV)) return;

      let maLop = row.MaLop;
      if (includedMap.has(maSV)) {
        maLop = includedMap.get(maSV)!;
      } else if (studentMainClassMap.has(maSV)) {
        maLop = studentMainClassMap.get(maSV)!;
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
        });
      }

      examRecordsList.push({
        maSV,
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
        maDotThi: row.MaDotThi ? String(row.MaDotThi).trim() : null,
        tenDotThi: row.TenDotThi ? String(row.TenDotThi).trim() : null,
      });
    });

    if (replace) {
      await prisma.examRecord.deleteMany();
    }

    // Upsert students
    for (const student of Array.from(studentMap.values())) {
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

      // Ensure User account exists
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

    const chunkSize = 500;
    let insertedCount = 0;
    for (let i = 0; i < examRecordsList.length; i += chunkSize) {
      const chunk = examRecordsList.slice(i, i + chunkSize);
      await prisma.examRecord.createMany({ data: chunk });
      insertedCount += chunk.length;
    }

    return NextResponse.json({
      success: true,
      message: `Đã nhập thành công ${insertedCount} dòng lịch thi cho ${studentMap.size} sinh viên vào cơ sở dữ liệu.`,
      count: insertedCount,
      studentCount: studentMap.size,
    });
  } catch (error: any) {
    console.error('Import CSV error:', error);
    return NextResponse.json({ error: 'Lỗi khi nhập dữ liệu CSV: ' + error.message }, { status: 500 });
  }
}
