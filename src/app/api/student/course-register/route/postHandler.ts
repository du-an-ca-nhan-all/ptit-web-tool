import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJsonBody } from '@/src/lib/requestValidation';
import {
  checkFlowLockForAction,
  findQldttxExternalAccount,
  getAuthUser,
} from './helpers';
import {
  handleCancelCourseAction,
  handleCheckSlotsAction,
  handleRegisterCourseAction,
} from './postActions';

const stringOrNumberSchema = z.union([z.string(), z.number()]);

const courseRegisterPostBodySchema = z
  .object({
    action: z.string().nullish().transform((v) => v ?? undefined),
    id_to_hoc: stringOrNumberSchema.nullish(),
    id_rs: stringOrNumberSchema.nullish(),
    sv_nganh: stringOrNumberSchema.nullish().transform((v) => v ?? undefined),
    targetUsername: z.string().nullish(),
    targetKeys: z.array(stringOrNumberSchema).nullish(),
  })
  .passthrough();

export async function handlePostCourseRegister(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện thao tác' }, { status: 401 });
    }

    const parsed = await parseJsonBody(req, courseRegisterPostBodySchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const {
      action = 'REGISTER', // 'REGISTER' | 'CANCEL' | 'CHECK_SLOTS'
      id_to_hoc,
      id_rs,
      sv_nganh = 1,
      targetUsername,
      targetKeys, // For CHECK_SLOTS: ['TAB1', 'TT03', '-23049182390']
    } = body;

    const effectiveUsername = (targetUsername || authUser.username).toUpperCase();

    // Check permission
    if (effectiveUsername !== authUser.username.toUpperCase() && !authUser.isAdmin && !authUser.isMonitor) {
      return NextResponse.json({ error: 'Bạn không có quyền thao tác trên tài khoản khác' }, { status: 403 });
    }

    // 0. KIỂM TRA KHÓA ĐKMH NẾU SINH VIÊN ĐANG BẬT FLOW THEO LỚP TRƯỞNG
    if (action === 'REGISTER' || action === 'CANCEL') {
      const flowLockResponse = await checkFlowLockForAction(effectiveUsername, authUser);
      if (flowLockResponse) {
        return flowLockResponse;
      }
    }

    // Lấy thông tin tài khoản QLDTTX
    const extAccount = await findQldttxExternalAccount(effectiveUsername);

    if (!extAccount) {
      return NextResponse.json(
        { error: 'Chưa liên kết tài khoản Cổng QLDTTX. Vui lòng vào Hồ sơ cá nhân để cấu hình trước.' },
        { status: 400 }
      );
    }

    const accountCreds = {
      username: extAccount.extUsername,
      password: extAccount.extPassword,
      token: extAccount.token,
    };

    // 1. ACTION: CHECK_SLOTS (Phục vụ Auto Canh Slot / Sniper)
    if (action === 'CHECK_SLOTS') {
      return handleCheckSlotsAction(accountCreds, targetKeys);
    }

    // 2. ACTION: REGISTER (Đăng ký môn học)
    if (action === 'REGISTER') {
      return handleRegisterCourseAction({
        req,
        authUser,
        effectiveUsername,
        extAccount,
        accountCreds,
        id_to_hoc,
        id_rs,
        sv_nganh,
      });
    }

    // 3. ACTION: CANCEL (Hủy đăng ký môn học)
    if (action === 'CANCEL') {
      return handleCancelCourseAction({
        req,
        authUser,
        effectiveUsername,
        extAccount,
        accountCreds,
        id_to_hoc,
        id_rs,
        sv_nganh,
      });
    }

    return NextResponse.json({ error: `Hành động '${action}' không được hỗ trợ` }, { status: 400 });
  } catch (error: any) {
    console.error('Course registration portal POST error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi thực hiện thao tác ĐKMH' }, { status: 500 });
  }
}
