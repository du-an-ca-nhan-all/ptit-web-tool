import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { parseGlobalPricing } from './utils';

// GET /api/exam-rooms
// Trả về danh sách tất cả các phòng thi có mức giá tùy chỉnh và cấu hình giá chung
export async function handleGetExamRooms(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const batchCode = searchParams.get('batchCode') || undefined;
    const mapThi = searchParams.get('mapThi') || undefined;

    const where: any = {};
    if (batchCode) where.batchCode = batchCode;
    if (mapThi) where.mapThi = mapThi;

    const [examRooms, globalConfigRecord] = await Promise.all([
      prisma.examRoom.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      }),
      prisma.globalConfig.findUnique({
        where: { key: 'pricing_config' },
      }),
    ]);

    const globalPricing = parseGlobalPricing(globalConfigRecord?.value);

    return NextResponse.json({
      success: true,
      examRooms,
      globalPricing,
    });
  } catch (error: any) {
    console.error('Error fetching exam rooms:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
