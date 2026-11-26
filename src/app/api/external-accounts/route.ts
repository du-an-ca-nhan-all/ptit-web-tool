import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AVAILABLE_EXTERNAL_SYSTEMS } from '@/src/types';
import { parseJsonBody } from '@/src/lib/requestValidation';
import { getAuthUser } from './route/auth';
import { handleGetExternalAccounts } from './route/getHandler';
import { handleBatchTokensAction } from './route/batchAction';
import { handleDeleteAccountAction } from './route/deleteAction';
import { handleSaveAccountAction } from './route/saveAction';
import { handleTestOrSyncAction } from './route/testExistingAction';
import { ExternalAccountActionBody, ExternalAccountActionContext } from './route/types';

const optionalString = z.string().nullish().transform((v) => v ?? undefined);

const externalAccountActionBodySchema = z
  .object({
    action: optionalString,
    systemKey: optionalString,
    extUsername: optionalString,
    extPassword: optionalString,
    refreshToken: optionalString,
    accessToken: optionalString,
    systemName: optionalString,
    systemUrl: optionalString,
    targetUsername: optionalString,
  })
  .passthrough();

// GET /api/external-accounts
// Supports:
// 1. Regular Student/Monitor: Returns own external accounts
// 2. Admin (?view=all): Returns all configured external accounts with student & class info & token
export async function GET(req: NextRequest) {
  return handleGetExternalAccounts(req);
}

// POST /api/external-accounts
// Save, Update, Delete, Get Token or Test Connection for an external system account
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện thao tác' }, { status: 401 });
    }

    const parsed = await parseJsonBody(req, externalAccountActionBodySchema);
    if (!parsed.ok) return parsed.response;
    const body: ExternalAccountActionBody = parsed.data;
    const {
      action = 'SAVE',
      systemKey,
      systemName,
      systemUrl,
      targetUsername,
    } = body;

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
      return await handleBatchTokensAction(req, authUser, systemKey);
    }

    if (!systemKey) {
      return NextResponse.json({ error: 'Mã hệ thống (systemKey) là bắt buộc' }, { status: 400 });
    }

    const defaultSys = AVAILABLE_EXTERNAL_SYSTEMS.find((s) => s.key === systemKey);
    const finalSystemName = systemName || defaultSys?.name || 'Hệ thống ngoài';
    const finalSystemUrl = systemUrl || defaultSys?.url || 'https://qldttx.pttc1.edu.vn/';

    const ctx: ExternalAccountActionContext = {
      req,
      authUser,
      effectiveUsername,
      systemKey,
      finalSystemName,
      finalSystemUrl,
    };

    // 1. ACTION: DELETE / DISCONNECT
    if (action === 'DELETE' || action === 'DISCONNECT') {
      return await handleDeleteAccountAction(ctx);
    }

    // 2. ACTION: SAVE / CONNECT (Enforce successful login/refresh test before saving!)
    if (action === 'SAVE' || action === 'CONNECT') {
      return await handleSaveAccountAction(ctx, body);
    }

    // 3. ACTION: GET_TOKEN / TEST / SYNC
    if (action === 'GET_TOKEN' || action === 'TEST' || action === 'SYNC' || action === 'TEST_CREDENTIALS') {
      return await handleTestOrSyncAction(ctx, body);
    }

    return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('External account action error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
