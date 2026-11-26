import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { DEFAULT_PRICING_CONFIG } from '@/src/config/pricingConfig';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { ACTIVITY_LOG_ACTIONS } from '@/src/features/activity-logs/types/activityLogActions';
import { getAuthUser, verifyIsAdmin } from './auth';

// PUT /api/exam-rooms
// Lưu cấu hình định mức giá chung toàn hệ thống
export async function handlePutPricingConfig(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!verifyIsAdmin(authUser)) {
      return NextResponse.json({ error: 'Chỉ Quản trị viên mới có quyền cấu hình định mức tiền phòng' }, { status: 403 });
    }
    const body = await req.json();

    const commonRoom = Math.max(0, parseInt(String(body.commonRoom), 10) || DEFAULT_PRICING_CONFIG.commonRoom);
    const englishOralRoom = Math.max(0, parseInt(String(body.englishOralRoom), 10) || DEFAULT_PRICING_CONFIG.englishOralRoom);

    const configValue = JSON.stringify({ commonRoom, englishOralRoom });

    await prisma.globalConfig.upsert({
      where: { key: 'pricing_config' },
      create: {
        key: 'pricing_config',
        value: configValue,
        description: 'Cấu hình định mức giá tiền phòng thi',
      },
      update: {
        value: configValue,
      },
    });

    await logActivity({
      req,
      userId: authUser?.id,
      username: authUser?.username,
      userRole: authUser?.role,
      action: ACTIVITY_LOG_ACTIONS.UPDATE_GLOBAL_PRICING_CONFIG,
      targetType: 'GLOBAL_CONFIG',
      targetId: 'pricing_config',
      description: `Quản trị viên ${authUser?.username} đã cập nhật định mức tiền phòng chung: Phòng thường = ${commonRoom.toLocaleString('vi-VN')} đ, Vấn đáp TA = ${englishOralRoom.toLocaleString('vi-VN')} đ`,
      metadata: { commonRoom, englishOralRoom },
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật cấu hình định mức tiền phòng thành công',
      globalPricing: { commonRoom, englishOralRoom },
    });
  } catch (error: any) {
    console.error('Error updating pricing config:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
