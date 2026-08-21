import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import { AVAILABLE_EXTERNAL_SYSTEMS } from '@/src/types';
import { loginAndGetToken, validateToken, getValidTokenOrRefresh } from '@/src/features/external-portal/server/qldttxServerService';
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

// GET /api/external-accounts
// Supports:
// 1. Regular Student/Monitor: Returns own external accounts
// 2. Admin (?view=all): Returns all configured external accounts with student & class info & token
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

// POST /api/external-accounts
// Save, Update, Delete, Get Token or Test Connection for an external system account
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
        return NextResponse.json(
          { error: 'Chỉ Admin mới có quyền thao tác trên tài khoản của người khác' },
          { status: 403 }
        );
      }
      effectiveUsername = String(targetUsername).trim();
    }

    // 0. BATCH GET TOKENS & TEST FOR ADMIN
    if (action === 'BATCH_TEST' || action === 'BATCH_GET_TOKENS') {
      if (!authUser.isAdmin) {
        return NextResponse.json({ error: 'Chỉ Admin mới có quyền lấy token hàng loạt' }, { status: 403 });
      }

      const allAccounts = await prisma.externalAccount.findMany();
      let successCount = 0;
      let failCount = 0;

      for (const acc of allAccounts) {
        try {
          const { token: freshToken } = await getValidTokenOrRefresh({
            username: acc.extUsername,
            password: acc.extPassword,
            existingToken: acc.token,
          });

          await prisma.externalAccount.update({
            where: { id: acc.id },
            data: {
              token: freshToken,
              status: 'CONNECTED',
              lastSyncAt: new Date(),
              syncMessage: 'Đã lấy và xác thực Token QLDTTX thành công.',
            },
          });
          successCount++;
        } catch (err: any) {
          await prisma.externalAccount.update({
            where: { id: acc.id },
            data: {
              status: 'ERROR',
              syncMessage: `Lỗi kết nối / lấy token: ${err.message}`,
            },
          });
          failCount++;
        }
      }

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'BATCH_GET_TOKENS',
        targetType: 'EXTERNAL_ACCOUNT',
        targetId: 'ALL',
        description: `Admin làm mới token hàng loạt cho ${allAccounts.length} tài khoản QLDTTX (${successCount} thành công, ${failCount} thất bại)`,
        metadata: { total: allAccounts.length, successCount, failCount },
      });

      return NextResponse.json({
        success: true,
        message: `Đã làm mới token cho ${allAccounts.length} tài khoản (${successCount} thành công, ${failCount} thất bại).`,
        successCount,
        failCount,
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

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'DELETE_EXTERNAL_ACCOUNT',
        targetType: 'EXTERNAL_ACCOUNT',
        targetId: effectiveUsername,
        description: `Hủy liên kết tài khoản hệ thống "${finalSystemName}" cho sinh viên ${effectiveUsername}`,
        metadata: { effectiveUsername, systemKey, finalSystemName },
      });

      return NextResponse.json({
        success: true,
        message: `Đã hủy liên kết tài khoản hệ thống "${finalSystemName}" cho sinh viên ${effectiveUsername}`,
      });
    }

    // 2. ACTION: SAVE / CONNECT (Enforce successful login test before saving!)
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

      // Test logging in to QLDTTX to verify credentials and extract access token
      let fetchedToken: string | null = null;
      try {
        fetchedToken = await loginAndGetToken({
          username: cleanUsername,
          password: cleanPassword,
        });
      } catch (tokenErr: any) {
        console.warn(`Test login failed for ${cleanUsername} during SAVE:`, tokenErr.message);

        await logActivity({
          req,
          userId: authUser.id,
          username: authUser.username,
          userRole: authUser.role,
          action: 'SAVE_EXTERNAL_ACCOUNT_FAILED',
          targetType: 'EXTERNAL_ACCOUNT',
          targetId: effectiveUsername,
          description: `Lưu cấu hình ${finalSystemName} cho ${effectiveUsername} thất bại do kiểm tra kết nối không thành công: ${tokenErr.message}`,
          metadata: { effectiveUsername, systemKey, error: tokenErr.message },
        });

        return NextResponse.json(
          {
            error: `Kiểm tra kết nối thất bại: ${tokenErr.message}. Vui lòng kiểm tra lại Tên đăng nhập và Mật khẩu chính xác trước khi lưu cấu hình.`,
          },
          { status: 400 }
        );
      }

      const status = 'CONNECTED';
      const syncMessage = 'Đã xác thực và cấp Token kết nối QLDTTX thành công!';

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
          token: fetchedToken,
          status,
          lastSyncAt: new Date(),
          syncMessage,
        },
        update: {
          systemName: finalSystemName,
          systemUrl: finalSystemUrl,
          extUsername: cleanUsername,
          extPassword: cleanPassword,
          token: fetchedToken,
          status,
          lastSyncAt: new Date(),
          syncMessage,
        },
      });

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'SAVE_EXTERNAL_ACCOUNT',
        targetType: 'EXTERNAL_ACCOUNT',
        targetId: effectiveUsername,
        description: `Lưu cấu hình liên kết ${finalSystemName} cho ${effectiveUsername} thành công (Đã cấp Token)`,
        metadata: { effectiveUsername, systemKey, status, hasToken: !!fetchedToken },
      });

      return NextResponse.json({
        success: true,
        message: `Đã kết nối và lưu cấu hình tài khoản ${finalSystemName} (${effectiveUsername}) thành công!`,
        hasToken: !!account.token,
        account: {
          systemKey: account.systemKey,
          systemName: account.systemName,
          systemUrl: account.systemUrl,
          extUsername: account.extUsername,
          token: account.token,
          status: account.status,
          lastSyncAt: account.lastSyncAt?.toISOString() || null,
          syncMessage: account.syncMessage,
        },
      });
    }

    // 3. ACTION: GET_TOKEN / TEST / SYNC
    if (action === 'GET_TOKEN' || action === 'TEST' || action === 'SYNC' || action === 'TEST_CREDENTIALS') {
      const cleanInputUser = extUsername ? String(extUsername).trim() : '';
      const cleanInputPass = extPassword ? String(extPassword).trim() : '';

      // If credentials provided directly in request body, test them directly
      if (cleanInputUser && cleanInputPass) {
        try {
          const fetchedToken = await loginAndGetToken({
            username: cleanInputUser,
            password: cleanInputPass,
          });

          await logActivity({
            req,
            userId: authUser.id,
            username: authUser.username,
            userRole: authUser.role,
            action: 'TEST_EXTERNAL_ACCOUNT_CREDENTIALS',
            targetType: 'EXTERNAL_ACCOUNT',
            targetId: effectiveUsername,
            description: `Kiểm tra kết nối tài khoản ${finalSystemName} (${cleanInputUser}) thành công`,
            metadata: { effectiveUsername, targetSystemUser: cleanInputUser },
          });

          return NextResponse.json({
            success: true,
            message: `Kiểm tra kết nối tới ${finalSystemName} thành công! Thông tin tài khoản chính xác.`,
            token: fetchedToken,
          });
        } catch (testErr: any) {
          await logActivity({
            req,
            userId: authUser.id,
            username: authUser.username,
            userRole: authUser.role,
            action: 'TEST_EXTERNAL_ACCOUNT_FAILED',
            targetType: 'EXTERNAL_ACCOUNT',
            targetId: effectiveUsername,
            description: `Kiểm tra kết nối ${finalSystemName} (${cleanInputUser}) thất bại: ${testErr.message}`,
            metadata: { effectiveUsername, targetSystemUser: cleanInputUser, error: testErr.message },
          });

          return NextResponse.json(
            {
              error: `Kiểm tra kết nối thất bại: ${testErr.message}`,
            },
            { status: 400 }
          );
        }
      }

      // Otherwise test existing saved account in DB
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
          {
            error: `Chưa có thông tin đăng nhập để kiểm tra. Vui lòng nhập Tên đăng nhập và Mật khẩu.`,
          },
          { status: 400 }
        );
      }

      try {
        const { token: validToken, isNew } = await getValidTokenOrRefresh({
          username: existing.extUsername,
          password: existing.extPassword,
          existingToken: existing.token,
        });

        const updated = await prisma.externalAccount.update({
          where: { id: existing.id },
          data: {
            token: validToken,
            status: 'CONNECTED',
            lastSyncAt: new Date(),
            syncMessage: isNew
              ? `Đã đăng nhập và cấp Token mới lúc ${new Date().toLocaleTimeString('vi-VN')}`
              : `Token hiện tại còn sống và hợp lệ lúc ${new Date().toLocaleTimeString('vi-VN')}`,
          },
        });

        await logActivity({
          req,
          userId: authUser.id,
          username: authUser.username,
          userRole: authUser.role,
          action: 'TEST_EXTERNAL_ACCOUNT',
          targetType: 'EXTERNAL_ACCOUNT',
          targetId: effectiveUsername,
          description: `Kiểm tra/làm mới kết nối ${finalSystemName} cho ${effectiveUsername}: Thành công (${isNew ? 'Cấp token mới' : 'Token hợp lệ'})`,
          metadata: { effectiveUsername, isNew },
        });

        return NextResponse.json({
          success: true,
          message: isNew
            ? `Đã lấy Token mới thành công cho ${existing.extUsername}!`
            : `Token hiện tại còn sống và hợp lệ!`,
          token: updated.token,
          isNew,
          lastSyncAt: updated.lastSyncAt?.toISOString(),
        });
      } catch (loginErr: any) {
        await prisma.externalAccount.update({
          where: { id: existing.id },
          data: {
            status: 'ERROR',
            syncMessage: `Lỗi lấy Token: ${loginErr.message}`,
          },
        });

        await logActivity({
          req,
          userId: authUser.id,
          username: authUser.username,
          userRole: authUser.role,
          action: 'TEST_EXTERNAL_ACCOUNT_FAILED',
          targetType: 'EXTERNAL_ACCOUNT',
          targetId: effectiveUsername,
          description: `Kiểm tra kết nối ${finalSystemName} cho ${effectiveUsername} thất bại: ${loginErr.message}`,
          metadata: { effectiveUsername, error: loginErr.message },
        });

        return NextResponse.json(
          {
            error: `Không thể lấy token: ${loginErr.message}`,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('External account action error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
