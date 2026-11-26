import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJsonBody } from '@/src/lib/requestValidation';
import { prisma } from '@/src/lib/prisma';
import { checkIsAdmin } from '@/src/lib/auth';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { getAuthUser } from './auth';

const classMemberPostSchema = z.object({
  MaSV: z.string().optional(),
  MaLop: z.string().optional(),
  HoLotSV: z.string().nullish(),
  TenSV: z.string().nullish(),
  PHAI: z.string().nullish(),
  NgaySinhC: z.string().nullish(),
  phone: z.string().nullish(),
  note: z.string().nullish(),
  trangThai: z.string().optional(),
}).passthrough();

export async function handlePostClassMember(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const parsed = await parseJsonBody(req, classMemberPostSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const {
      MaSV,
      MaLop,
      HoLotSV,
      TenSV,
      PHAI,
      NgaySinhC,
      phone,
      note,
      trangThai,
    } = body;

    if (!MaSV || !MaLop) {
      return NextResponse.json({ error: 'MaSV và MaLop là bắt buộc' }, { status: 400 });
    }

    const cleanMaSV = String(MaSV).trim().toUpperCase();
    const cleanLop = String(MaLop).trim();

    // Guard: Class permission check
    const isAdmin = checkIsAdmin(authUser.role);
    if (!isAdmin && authUser.lop !== cleanLop) {
      return NextResponse.json(
        { error: `Bạn chỉ có quyền chỉnh sửa thông tin thành viên thuộc lớp của mình (${authUser.lop})` },
        { status: 403 }
      );
    }

    const hoLot = HoLotSV !== undefined ? String(HoLotSV).trim() : undefined;
    const ten = TenSV !== undefined ? String(TenSV).trim() : undefined;
    const hoTen = hoLot || ten ? `${hoLot || ''} ${ten || ''}`.trim() : undefined;

    const saved = await prisma.student.upsert({
      where: { maSV: cleanMaSV },
      update: {
        maLop: cleanLop,
        hoLot: hoLot !== undefined ? hoLot : undefined,
        ten: ten !== undefined ? ten : undefined,
        hoTen: hoTen !== undefined ? hoTen : undefined,
        gioiTinh: PHAI !== undefined ? PHAI : undefined,
        ngaySinh: NgaySinhC !== undefined ? NgaySinhC : undefined,
        soDienThoai: phone !== undefined ? phone : undefined,
        ghiChu: note !== undefined ? note : undefined,
        trangThai: trangThai !== undefined ? trangThai : undefined,
      },
      create: {
        maSV: cleanMaSV,
        maLop: cleanLop,
        hoLot: hoLot || null,
        ten: ten || cleanMaSV,
        hoTen: hoTen || cleanMaSV,
        gioiTinh: PHAI || 'Nam',
        ngaySinh: NgaySinhC || null,
        soDienThoai: phone || null,
        ghiChu: note || null,
        trangThai: trangThai || 'DANG_HOC',
      },
    });

    // Ensure User account exists
    await prisma.user.upsert({
      where: { username: cleanMaSV },
      update: {},
      create: {
        username: cleanMaSV,
        passwordHash: '',
        role: 'sinh_vien',
      },
    });

    await logActivity({
      req,
      userId: authUser.id,
      username: authUser.username,
      userRole: authUser.role,
      action: 'UPDATE_STUDENT_INFO',
      targetType: 'STUDENT',
      targetId: cleanMaSV,
      description: `Cập nhật thông tin sinh viên ${cleanMaSV} (${saved.hoTen || ''}) thuộc lớp ${cleanLop}`,
      metadata: {
        maSV: cleanMaSV,
        hoTen: saved.hoTen,
        maLop: cleanLop,
        soDienThoai: phone || saved.soDienThoai,
        gioiTinh: saved.gioiTinh,
        ngaySinh: saved.ngaySinh,
        ghiChu: note || saved.ghiChu,
        trangThai: trangThai || saved.trangThai,
        updatedBy: authUser.username,
      },
    });

    return NextResponse.json({ success: true, student: saved });
  } catch (error: any) {
    console.error('Class members POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
