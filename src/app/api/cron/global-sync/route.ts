import { NextResponse } from 'next/server';
import { runGlobalNightlySyncScheduler } from '@/src/features/external-portal/server/globalSyncQueueServerService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await runGlobalNightlySyncScheduler();

    return NextResponse.json({
      success: true,
      message: 'Đã thực hiện kiểm tra lịch quét đồng bộ dữ liệu tự động',
      result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Lỗi khi kiểm tra trình quét đồng bộ ban đêm' },
      { status: 500 }
    );
  }
}
