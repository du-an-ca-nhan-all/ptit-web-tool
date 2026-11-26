import { NextRequest, NextResponse } from 'next/server';
import { checkIsAdmin } from '@/src/lib/auth';
import { examBatchService } from '@/src/features/exam-schedule/server/examBatchServerService';
import type { ExamBatchActionBody, ExamBatchActionContext } from './route/types';
import { getAuthUser } from './route/utils';
import { handleCreateBatch, handleDeleteBatch, handleUpdateBatch } from './route/manageActions';
import { handleSetActiveBatch, handleToggleBatch } from './route/statusActions';

// GET /api/exam-batches
// Returns all exam batches with summary statistics (Cached)
export async function GET() {
  try {
    const batchesWithStats = await examBatchService.getBatches();

    return NextResponse.json({
      batches: batchesWithStats,
      activeBatch: batchesWithStats.find((b) => b.isActive) || batchesWithStats[0] || null,
      total: batchesWithStats.length,
    });
  } catch (error: any) {
    console.error('Fetch exam batches error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/exam-batches
// Create, update, activate, or delete an exam batch (Admin only)
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !checkIsAdmin(authUser.role)) {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên (Admin) mới có quyền quản lý đợt thi' },
        { status: 403 }
      );
    }

    const body = (await req.json()) as ExamBatchActionBody;
    const ctx: ExamBatchActionContext = { req, authUser, body };

    if (body.action === 'CREATE') {
      return await handleCreateBatch(ctx);
    }
    if (body.action === 'SET_ACTIVE') {
      return await handleSetActiveBatch(ctx);
    }
    if (body.action === 'TOGGLE') {
      return await handleToggleBatch(ctx);
    }
    if (body.action === 'UPDATE') {
      return await handleUpdateBatch(ctx);
    }
    if (body.action === 'DELETE') {
      return await handleDeleteBatch(ctx);
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Exam batch modification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
