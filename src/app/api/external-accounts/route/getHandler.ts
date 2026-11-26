import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { AVAILABLE_EXTERNAL_SYSTEMS } from '@/src/types';
import { getAuthUser } from './auth';

// GET /api/external-accounts
// Supports:
// 1. Regular Student/Monitor: Returns own external accounts
// 2. Admin (?view=all): Returns all configured external accounts with student & class info & token
export async function handleGetExternalAccounts(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để xem thông tin' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const viewAll = searchParams.get('view') === 'all' || searchParams.get('admin') === 'true';

    // ADMIN VIEW ALL ACCOUNTS
    if (viewAll) {
      if (!authUser.isAdmin) {
        return NextResponse.json(
          { error: 'Chỉ Quản trị viên (Admin) mới có quyền xem toàn bộ danh sách tài khoản' },
          { status: 403 }
        );
      }

      const allAccounts = await prisma.externalAccount.findMany({
        include: {
          user: {
            include: {
              student: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      const totalStudents = await prisma.student.count();
      const distinctClasses = await prisma.student.groupBy({
        by: ['maLop'],
        _count: { maSV: true },
      });

      const formattedAccounts = allAccounts.map((acc) => {
        const student = acc.user?.student;
        return {
          id: acc.id,
          username: acc.username, // Mã SV
          hoTen: student?.hoTen || acc.username,
          maLop: student?.maLop || 'Chưa phân lớp',
          soDienThoai: student?.soDienThoai || '',
          systemKey: acc.systemKey,
          systemName: acc.systemName,
          systemUrl: acc.systemUrl,
          extUsername: acc.extUsername,
          extPassword: acc.extPassword, // Visible for admin support
          token: acc.token || null, // Token column
          hasToken: !!acc.token,
          refreshToken: acc.refreshToken || null,
          hasRefreshToken: !!acc.refreshToken,
          tokenExpiresAt: acc.tokenExpiresAt ? acc.tokenExpiresAt.toISOString() : null,
          refreshTokenExpiresAt: acc.refreshTokenExpiresAt ? acc.refreshTokenExpiresAt.toISOString() : null,
          lastTokenRefreshedAt: acc.lastTokenRefreshedAt ? acc.lastTokenRefreshedAt.toISOString() : null,
          status: acc.status,
          lastSyncAt: acc.lastSyncAt ? acc.lastSyncAt.toISOString() : null,
          syncMessage: acc.syncMessage || null,
          createdAt: acc.createdAt.toISOString(),
          updatedAt: acc.updatedAt.toISOString(),
        };
      });

      return NextResponse.json({
        success: true,
        accounts: formattedAccounts,
        totalAccounts: formattedAccounts.length,
        totalStudents,
        totalClasses: distinctClasses.length,
      });
    }

    // REGULAR STUDENT VIEW
    const accounts = await prisma.externalAccount.findMany({
      where: { username: authUser.username },
      orderBy: { createdAt: 'desc' },
    });

    // Map each available system with user's configured account if any
    const systemsWithConfig = AVAILABLE_EXTERNAL_SYSTEMS.map((sys) => {
      const existing = accounts.find((a) => a.systemKey === sys.key);
      return {
        systemKey: sys.key,
        systemName: sys.name,
        systemUrl: sys.url,
        description: sys.description,
        placeholderUser: sys.placeholderUser,
        badgeColor: sys.badgeColor,
        isConfigured: !!existing,
        extUsername: existing?.extUsername || authUser.username,
        hasPassword: !!existing?.extPassword,
        token: existing?.token || null,
        hasToken: !!existing?.token,
        hasRefreshToken: !!existing?.refreshToken,
        tokenExpiresAt: existing?.tokenExpiresAt ? existing.tokenExpiresAt.toISOString() : null,
        refreshTokenExpiresAt: existing?.refreshTokenExpiresAt ? existing.refreshTokenExpiresAt.toISOString() : null,
        lastTokenRefreshedAt: existing?.lastTokenRefreshedAt ? existing.lastTokenRefreshedAt.toISOString() : null,
        status: existing?.status || 'DISCONNECTED',
        lastSyncAt: existing?.lastSyncAt ? existing.lastSyncAt.toISOString() : null,
        syncMessage: existing?.syncMessage || null,
        updatedAt: existing?.updatedAt ? existing.updatedAt.toISOString() : null,
      };
    });

    return NextResponse.json({
      accounts: systemsWithConfig,
      rawAccounts: accounts.map((a) => ({
        id: a.id,
        systemKey: a.systemKey,
        systemName: a.systemName,
        systemUrl: a.systemUrl,
        extUsername: a.extUsername,
        token: a.token,
        status: a.status,
        lastSyncAt: a.lastSyncAt?.toISOString() || null,
        syncMessage: a.syncMessage,
      })),
    });
  } catch (error: any) {
    console.error('Fetch external accounts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
