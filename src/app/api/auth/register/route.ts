import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { hashSHA512 } from '@/src/lib/auth';
import { logActivity } from '@/src/lib/activityLog';

// GET /api/auth/register?username=K25DTCN402
// Lookup student existence, name, and class for registration auto-display
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username')?.trim().toUpperCase();

    if (!username || username.length < 3) {
      return NextResponse.json({ found: false, error: 'Mã sinh viên không hợp lệ' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { maSV: username },
      include: {
        user: {
          select: {
            passwordHash: true,
            isActive: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({
        found: false,
        error: `Mã sinh viên "${username}" không tồn tại trong hệ thống.`,
      });
    }

    const hasPassword = Boolean(
      student.user?.passwordHash && student.user.passwordHash.trim() !== ''
    );

    return NextResponse.json({
      found: true,
      student: {
        maSV: student.maSV,
        hoTen: student.hoTen || student.ten || student.maSV,
        maLop: student.maLop,
        soDienThoai: student.soDienThoai,
        hasPassword,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/auth/register
// Submit registration request with SHA-512 passwordHash & student validation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, confirmPassword, phoneNumber, note } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ Mã sinh viên và Mật khẩu.' },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim().toUpperCase();
    const cleanPassword = String(password).trim();

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: 'Mã sinh viên phải có ít nhất 3 ký tự.' },
        { status: 400 }
      );
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự để đảm bảo an toàn.' },
        { status: 400 }
      );
    }

    if (confirmPassword && cleanPassword !== String(confirmPassword).trim()) {
      return NextResponse.json(
        { error: 'Mật khẩu nhập lại không trùng khớp.' },
        { status: 400 }
      );
    }

    // 1. Check if student exists in Student table (MANDATORY)
    const student = await prisma.student.findUnique({
      where: { maSV: cleanUsername },
    });

    if (!student) {
      return NextResponse.json(
        {
          error: `Mã sinh viên "${cleanUsername}" không tồn tại trong danh sách sinh viên trường. Vui lòng kiểm tra lại hoặc liên hệ Quản trị viên để được hỗ trợ.`,
        },
        { status: 400 }
      );
    }

    // 2. Check existing User account password status
    const existingUser = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (existingUser && existingUser.passwordHash && existingUser.passwordHash.trim() !== '') {
      return NextResponse.json(
        {
          error: 'Tài khoản này đã được kích hoạt mật khẩu. Nếu bạn quên mật khẩu, vui lòng liên hệ Quản trị viên để được đặt lại.',
        },
        { status: 400 }
      );
    }

    // 3. Extract info directly from Student record
    const finalFullName = String(student.hoTen || student.ten || cleanUsername).trim();
    const finalLop = student.maLop ? String(student.maLop).trim() : null;
    const finalPhone = String(phoneNumber || student.soDienThoai || '').trim();

    // 4. Hash password with SHA-512 (128 hex chars)
    const hashedPassword = hashSHA512(cleanPassword);

    // 5. Check if a pending registration request already exists
    const existingPending = await prisma.registrationRequest.findFirst({
      where: {
        username: cleanUsername,
        status: 'PENDING',
      },
    });

    let regRequest;
    if (existingPending) {
      regRequest = await prisma.registrationRequest.update({
        where: { id: existingPending.id },
        data: {
          fullName: finalFullName,
          lop: finalLop,
          phoneNumber: finalPhone || null,
          passwordHash: hashedPassword,
          note: note ? String(note).trim() : existingPending.note,
          status: 'PENDING',
          reviewedBy: null,
          reviewedAt: null,
        },
      });
    } else {
      regRequest = await prisma.registrationRequest.create({
        data: {
          username: cleanUsername,
          fullName: finalFullName,
          lop: finalLop,
          phoneNumber: finalPhone || null,
          passwordHash: hashedPassword,
          note: note ? String(note).trim() : null,
          status: 'PENDING',
        },
      });
    }

    // 6. Log activity
    await logActivity({
      req,
      username: cleanUsername,
      action: 'REGISTER_REQUEST',
      targetType: 'REGISTRATION',
      targetId: String(regRequest.id),
      description: `Sinh viên ${cleanUsername} (${finalFullName} - Lớp ${finalLop || 'Chưa rõ'}) gửi yêu cầu đăng ký tài khoản`,
      metadata: {
        username: cleanUsername,
        fullName: finalFullName,
        lop: finalLop,
        phoneNumber: finalPhone,
        requestId: regRequest.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đăng ký tài khoản thành công! Yêu cầu của bạn đã được gửi và đang chờ Quản trị viên phê duyệt kích hoạt.',
      request: {
        id: regRequest.id,
        username: regRequest.username,
        fullName: regRequest.fullName,
        lop: regRequest.lop,
        status: regRequest.status,
        createdAt: regRequest.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi gửi yêu cầu đăng ký tài khoản.' },
      { status: 500 }
    );
  }
}
