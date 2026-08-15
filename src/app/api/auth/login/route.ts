import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { verifyPassword, createAuthToken } from '@/src/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu' },
        { status: 400 }
      );
    }

    const normalizedUsername = String(username).trim().toUpperCase();

    // 1. Check in User table with Student profile
    let user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      include: { student: true },
    });

    if (user) {
      const isValid = await verifyPassword(password, user.passwordHash, user.username);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Tài khoản hoặc mật khẩu không chính xác' },
          { status: 401 }
        );
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      const authPayload = {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.student?.hoTen || user.student?.ten || user.username,
        phoneNumber: user.student?.soDienThoai || null,
        lop: user.student?.maLop || null,
      };

      const token = await createAuthToken(authPayload);
      const response = NextResponse.json({
        success: true,
        user: authPayload,
        token,
      });

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    // 2. Fallback: If user account not created yet, check if student exists
    const student = await prisma.student.findUnique({
      where: { maSV: normalizedUsername },
    });

    if (student) {
      if (password.trim().toUpperCase() === normalizedUsername) {
        user = await prisma.user.create({
          data: {
            username: normalizedUsername,
            passwordHash: '',
            role: 'sinh_vien',
            lastLogin: new Date(),
          },
          include: { student: true },
        });

        const authPayload = {
          id: user.id,
          username: user.username,
          role: user.role,
          fullName: student.hoTen || student.ten || user.username,
          phoneNumber: student.soDienThoai || null,
          lop: student.maLop || null,
        };

        const token = await createAuthToken(authPayload);
        const response = NextResponse.json({
          success: true,
          user: authPayload,
          token,
        });

        response.cookies.set('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60,
          path: '/',
        });

        return response;
      }
    }

    return NextResponse.json(
      { error: 'Tài khoản hoặc mật khẩu không chính xác' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi đăng nhập: ' + error.message },
      { status: 500 }
    );
  }
}
