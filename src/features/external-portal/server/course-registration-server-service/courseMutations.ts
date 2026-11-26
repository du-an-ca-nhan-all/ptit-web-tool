import { fetchOpenCourseGroupsFromQLDTTX } from './courseQueries';
import { postQldttxEndpoint, resolveAccountToken, type ResolvedTokenState } from './httpClient';
import type { CourseMutationOptions, QldttxAccountInput, RegisterCourseResponse } from './types';

async function resolveEffectiveIdRs(
  account: QldttxAccountInput,
  idRs: string | undefined,
  tokenState: ResolvedTokenState
): Promise<{ effectiveIdRs: string | undefined; tokenState: ResolvedTokenState }> {
  let effectiveIdRs = idRs;
  let validToken = tokenState.validToken;
  let accumulatedToken = tokenState.accumulatedToken;

  // Nếu chưa có id_rs, tự động fetch w-locdsnhomto để lấy id_rs
  if (!effectiveIdRs) {
    const openRes = await fetchOpenCourseGroupsFromQLDTTX({
      username: account.username,
      password: account.password,
      token: validToken,
    });
    effectiveIdRs = openRes.id_rs;
    if (openRes.newToken) {
      validToken = openRes.newToken;
      accumulatedToken = openRes.newToken;
    }
  }

  return {
    effectiveIdRs,
    tokenState: { validToken, accumulatedToken },
  };
}

/**
 * Đăng ký một nhóm tổ môn học (/api/dkmh/w-xulydkmhsinhvien)
 */
export async function registerCourseGroupQLDTTX(
  account: QldttxAccountInput,
  options: CourseMutationOptions
): Promise<RegisterCourseResponse> {
  const initialTokenState = await resolveAccountToken(account, false);
  const { effectiveIdRs, tokenState } = await resolveEffectiveIdRs(account, options.id_rs, initialTokenState);

  const endpoint = '/api/dkmh/w-xulydkmhsinhvien';
  const body = {
    filter: {
      id_to_hoc: options.id_to_hoc,
      is_checked: true,
      sv_nganh: options.sv_nganh ?? 1,
      id_rs: effectiveIdRs || '',
    },
  };

  const { parsed, accumulatedToken } = await postQldttxEndpoint({ endpoint, body, account, tokenState });

  const resData = parsed?.data || {};
  const isThanhCong = Boolean(
    resData?.is_thanh_cong || (parsed?.code === 200 && parsed?.result === true && !resData?.thong_bao_loi)
  );
  const newIdRs = String(resData?.id_rs || parsed?.id_rs || effectiveIdRs || '');
  const thongBaoLoi = resData?.thong_bao_loi || parsed?.message || '';

  return {
    success: isThanhCong,
    message: isThanhCong ? 'Đăng ký môn học thành công' : (thongBaoLoi || 'Đăng ký không thành công'),
    id_rs: newIdRs,
    ket_qua_dang_ky: resData?.ket_qua_dang_ky,
    newToken: accumulatedToken,
    rawResponse: parsed,
  };
}

/**
 * Hủy đăng ký một môn học (/api/dkmh/w-xulydkmhsinhvien)
 */
export async function cancelCourseGroupQLDTTX(
  account: QldttxAccountInput,
  options: CourseMutationOptions
): Promise<RegisterCourseResponse> {
  const initialTokenState = await resolveAccountToken(account, false);
  const { effectiveIdRs, tokenState } = await resolveEffectiveIdRs(account, options.id_rs, initialTokenState);

  const endpoint = '/api/dkmh/w-xulydkmhsinhvien';
  const body = {
    filter: {
      id_to_hoc: options.id_to_hoc,
      is_checked: false,
      sv_nganh: options.sv_nganh ?? 1,
      id_rs: effectiveIdRs || '',
    },
  };

  const { parsed, accumulatedToken } = await postQldttxEndpoint({ endpoint, body, account, tokenState });

  const resData = parsed?.data || {};
  const thongBaoLoi = resData?.thong_bao_loi || parsed?.message || '';
  const isThanhCong = Boolean(
    resData?.is_thanh_cong === true ||
    resData?.is_thanh_cong === 'true' ||
    (parsed?.result === true && !thongBaoLoi && resData?.is_thanh_cong !== false) ||
    (parsed?.code === 200 && parsed?.result === true && !thongBaoLoi) ||
    (parsed?.code === 200 && !thongBaoLoi && resData?.is_thanh_cong !== false && parsed?.result !== false)
  );
  const newIdRs = String(resData?.id_rs || parsed?.id_rs || effectiveIdRs || '');

  return {
    success: isThanhCong,
    message: isThanhCong ? 'Hủy môn học thành công' : (thongBaoLoi || 'Hủy môn học không thành công'),
    id_rs: newIdRs,
    newToken: accumulatedToken,
    rawResponse: parsed,
  };
}
