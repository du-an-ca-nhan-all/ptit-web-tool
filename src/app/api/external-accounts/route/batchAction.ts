import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { AuthUser } from '@/src/lib/auth';
import { getValidTokenOrRefresh } from '@/src/features/external-portal/server/qldttxServerService';
import { syncStudentProfileFromQLDTTX } from '@/src/features/external-portal/server/studentProfileSyncService';
import { getValidLmsTokenOrRefresh } from '@/src/features/external-portal/server/lmsServerService';
import { refreshAndPersistSlinkAccountToken } from '@/src/features/external-portal/server/slinkServerService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';

export async function handleBatchTokensAction(
  req: NextRequest,
  authUser: AuthUser,
  systemKey?: string
) {
  if (!authUser.isAdmin) {
    return NextResponse.json({ error: 'Chỉ Admin mới có quyền lấy token hàng loạt' }, { status: 403 });
  }

  const targetSysKey = systemKey || 'QLDTTX_PTTC1';
  const whereCondition = targetSysKey === 'ALL' ? {} : { systemKey: targetSysKey };
  const allAccounts = await prisma.externalAccount.findMany({
    where: whereCondition,
  });
  let successCount = 0;
  let failCount = 0;

  for (const acc of allAccounts) {
    try {
      let freshToken: string;
      if (acc.systemKey === 'LMS_PTTC1') {
        const res = await getValidLmsTokenOrRefresh({
          username: acc.extUsername,
          password: acc.extPassword,
          existingToken: acc.token,
        });
        freshToken = res.token;
      } else if (acc.systemKey === 'SLINK_PTIT') {
        await refreshAndPersistSlinkAccountToken(acc, {
          force: true,
          syncMessagePrefix: 'Admin làm mới hàng loạt Token & Refresh Token S-Link',
        });
        successCount++;
        continue;
      } else {
        const res = await getValidTokenOrRefresh({
          username: acc.extUsername,
          password: acc.extPassword,
          existingToken: acc.token,
        });
        freshToken = res.token;
      }

      await prisma.externalAccount.update({
        where: { id: acc.id },
        data: {
          token: freshToken,
          status: 'CONNECTED',
          lastSyncAt: new Date(),
          syncMessage: `Đã lấy và xác thực Session/Token ${acc.systemKey} thành công.`,
        },
      });

      if (acc.systemKey === 'QLDTTX_PTTC1') {
        await syncStudentProfileFromQLDTTX({
          username: acc.username,
          token: freshToken,
          extUsername: acc.extUsername,
          extPassword: acc.extPassword,
          skipIfNoAccount: true,
        }).catch((syncErr) => {
          console.warn(`[BATCH_TEST] Auto sync QLHT profile failed for ${acc.username}:`, syncErr?.message || syncErr);
        });
      }

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
    description: `Admin làm mới token hàng loạt cho ${allAccounts.length} tài khoản ${targetSysKey} (${successCount} thành công, ${failCount} thất bại)`,
    metadata: { systemKey: targetSysKey, total: allAccounts.length, successCount, failCount },
  });

  return NextResponse.json({
    success: true,
    message: `Đã làm mới token cho ${allAccounts.length} tài khoản (${successCount} thành công, ${failCount} thất bại).`,
    successCount,
    failCount,
  });
}
