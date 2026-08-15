import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    let authUser = await getCurrentUserFromCookie();

    if (!authUser) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        authUser = await verifyAuthToken(token);
      }
    }

    if (!authUser) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { student: true },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.student?.hoTen || user.student?.ten || user.username,
        phoneNumber: user.student?.soDienThoai || null,
        lop: user.student?.maLop || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
