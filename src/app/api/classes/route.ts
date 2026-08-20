import { NextRequest, NextResponse } from 'next/server';
import { ensureDatabaseSeeded } from '@/src/lib/dbSeeder';
import { monitorsServerService } from '@/src/features/classes-monitor/server/monitorsServerService';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded(false);
    const data = await monitorsServerService.getClassesWithDetails();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Classes API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
