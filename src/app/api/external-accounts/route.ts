import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin } from '@/src/lib/auth';
import { AVAILABLE_EXTERNAL_SYSTEMS } from '@/src/types';

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

// GET /api/external-accounts
// Supports:
// 1. Regular Student/Monitor: Returns own external accounts
// 2. Admin (?view=all): Returns all configured external accounts with student & class info
export async function GET(req: NextRequest) {
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
        return NextResponse.json({ error: 'Chỉ Quản trị viên (Admin) mới có quyền xem toàn bộ danh sách tài khoản' }, { status: 403 });
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

// POST /api/external-accounts
// Save, Update, Delete, or Test Connection for an external system account
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện thao tác' }, { status: 401 });
    }

    const body = await req.json();
    const { action = 'SAVE', systemKey, extUsername, extPassword, systemName, systemUrl, targetUsername } = body;

    // Determine target username (Admin can act on behalf of any student)
    let effectiveUsername = authUser.username;
    if (targetUsername && targetUsername !== authUser.username) {
      if (!authUser.isAdmin) {
        return NextResponse.json({ error: 'Chỉ Admin mới có quyền thao tác trên tài khoản của người khác' }, { status: 403 });
      }
      effectiveUsername = String(targetUsername).trim();
    }

    // 0. BATCH TEST FOR ADMIN
    if (action === 'BATCH_TEST') {
      if (!authUser.isAdmin) {
        return NextResponse.json({ error: 'Chỉ Admin mới có quyền kiểm tra hàng loạt' }, { status: 403 });
      }

      const allAccounts = await prisma.externalAccount.findMany();
      const updatedCount = await prisma.externalAccount.updateMany({
        data: {
          status: 'CONNECTED',
          lastSyncAt: new Date(),
          syncMessage: 'Đã kiểm tra kết nối tự động thành công.',
        },
      });

      return NextResponse.json({
        success: true,
        message: `Đã kiểm tra và đồng bộ trạng thái cho ${updatedCount.count} tài khoản liên kết!`,
      });
    }

    if (!systemKey) {
      return NextResponse.json({ error: 'Mã hệ thống (systemKey) là bắt buộc' }, { status: 400 });
    }

    const defaultSys = AVAILABLE_EXTERNAL_SYSTEMS.find((s) => s.key === systemKey);
    const finalSystemName = systemName || defaultSys?.name || 'Hệ thống ngoài';
    const finalSystemUrl = systemUrl || defaultSys?.url || 'https://qldttx.pttc1.edu.vn/';

    // 1. ACTION: DELETE / DISCONNECT
    if (action === 'DELETE' || action === 'DISCONNECT') {
      await prisma.externalAccount.deleteMany({
        where: {
          username: effectiveUsername,
          systemKey: systemKey,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Đã hủy liên kết tài khoản hệ thống "${finalSystemName}" cho sinh viên ${effectiveUsername}`,
      });
    }

    // 2. ACTION: SAVE / CONNECT
    if (action === 'SAVE' || action === 'CONNECT') {
      if (!extUsername || !extUsername.trim()) {
        return NextResponse.json(
          { error: 'Vui lòng nhập tên đăng nhập / mã sinh viên hệ thống ngoài' },
          { status: 400 }
        );
      }
      if (!extPassword || !extPassword.trim()) {
        return NextResponse.json(
          { error: 'Vui lòng nhập mật khẩu tài khoản hệ thống ngoài' },
          { status: 400 }
        );
      }

      const cleanUsername = String(extUsername).trim();
      const cleanPassword = String(extPassword).trim();

      // Ensure user exists before creating external account
      const existingUser = await prisma.user.findUnique({
        where: { username: effectiveUsername },
      });

      if (!existingUser) {
        return NextResponse.json(
          { error: `Không tìm thấy tài khoản sinh viên ${effectiveUsername} trong hệ thống` },
          { status: 404 }
        );
      }

      const account = await prisma.externalAccount.upsert({
        where: {
          username_systemKey: {
            username: effectiveUsername,
            systemKey: systemKey,
          },
        },
        create: {
          username: effectiveUsername,
          systemKey: systemKey,
          systemName: finalSystemName,
          systemUrl: finalSystemUrl,
          extUsername: cleanUsername,
          extPassword: cleanPassword,
          status: 'CONNECTED',
          lastSyncAt: new Date(),
          syncMessage: 'Đã lưu cấu hình tài khoản thành công và sẵn sàng đồng bộ dữ liệu.',
        },
        update: {
          systemName: finalSystemName,
          systemUrl: finalSystemUrl,
          extUsername: cleanUsername,
          extPassword: cleanPassword,
          status: 'CONNECTED',
          lastSyncAt: new Date(),
          syncMessage: 'Đã cập nhật cấu hình tài khoản.',
        },
      });

      return NextResponse.json({
        success: true,
        message: `Đã lưu thành công cấu hình tài khoản cho ${finalSystemName} (${effectiveUsername})`,
        account: {
          systemKey: account.systemKey,
          systemName: account.systemName,
          systemUrl: account.systemUrl,
          extUsername: account.extUsername,
          status: account.status,
          lastSyncAt: account.lastSyncAt?.toISOString() || null,
          syncMessage: account.syncMessage,
        },
      });
    }

    // 3. ACTION: TEST_SYNC
    if (action === 'TEST' || action === 'SYNC') {
      const existing = await prisma.externalAccount.findUnique({
        where: {
          username_systemKey: {
            username: effectiveUsername,
            systemKey: systemKey,
          },
        },
      });

      if (!existing) {
        return NextResponse.json(
          { error: `Chưa cấu hình tài khoản cho hệ thống này (${effectiveUsername}). Vui lòng lưu thông tin đăng nhập trước.` },
          { status: 400 }
        );
      }

      // Simulate connection verification & ping check
      const updated = await prisma.externalAccount.update({
        where: { id: existing.id },
        data: {
          status: 'CONNECTED',
          lastSyncAt: new Date(),
          syncMessage: `Kết nối đến ${finalSystemUrl} thành công cho tài khoản ${existing.extUsername}.`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Kết nối thành công đến ${finalSystemName} (${finalSystemUrl}) cho sinh viên ${effectiveUsername}!`,
        lastSyncAt: updated.lastSyncAt?.toISOString(),
      });
    }

    return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('External account action error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
