/**
 * QLDTTX Student Personal Profile Info fetcher.
 */

import { QLDTTX_STUDENT_INFO_API_URL } from './constants';
import { postQldttxWithAuth } from './httpClient';
import type { QldttxAccountInput, QldttxStudentProfileInfo } from './types';

function cleanOptionalField(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

function pickFirstString(obj: Record<string, any>, keys: string[]): string | null {
  for (const key of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
      const cleaned = cleanOptionalField(obj[key]);
      if (cleaned !== null) return cleaned;
    }
  }
  return null;
}

/**
 * Lấy thông tin cá nhân sinh viên từ cổng QLHT/QLDTTX (https://qldttx.pttc1.edu.vn/api/dkmh/w-locsinhvieninfo)
 */
export async function fetchStudentInfoFromQLDTTX(account: QldttxAccountInput): Promise<{
  profile: QldttxStudentProfileInfo;
  newToken?: string;
}> {
  const { response, parsed, newToken } = await postQldttxWithAuth({
    url: QLDTTX_STUDENT_INFO_API_URL,
    body: {},
    account,
    missingTokenMessage: 'Chưa có token hoặc mật khẩu để kết nối cổng QLHT',
  });

  if (!response.ok || (parsed && parsed.result === false && parsed.code === 401)) {
    throw new Error(
      `Cổng QLHT phản hồi lỗi khi lấy thông tin sinh viên (${response.status}): ${
        typeof parsed === 'string' ? parsed : parsed?.message || JSON.stringify(parsed)
      }`
    );
  }

  const dataObj: Record<string, any> =
    (parsed && typeof parsed === 'object' && parsed.data && typeof parsed.data === 'object'
      ? parsed.data
      : parsed && typeof parsed === 'object'
      ? parsed
      : {}) || {};

  const profile: QldttxStudentProfileInfo = {
    ngaySinh: pickFirstString(dataObj, ['ngay_sinh', 'ngaysinh', 'ngaySinh']),
    gioiTinh: pickFirstString(dataObj, ['gioi_tinh', 'gioitinh', 'gioiTinh', 'phai']),
    soDienThoai: pickFirstString(dataObj, [
      'dien_thoai',
      'so_dien_thoai',
      'dienthoai',
      'soDienThoai',
      'sdt',
    ]),
    soCMND: pickFirstString(dataObj, [
      'so_cmnd',
      'cmnd',
      'so_cccd',
      'cccd',
      'soCmnd',
      'so_cmt',
    ]),
    email1: pickFirstString(dataObj, ['email', 'email1', 'email_1']),
    email2: pickFirstString(dataObj, ['email2', 'email_2']),
    noiSinh: pickFirstString(dataObj, ['noi_sinh', 'noisinh', 'noiSinh']),
    quocTich: pickFirstString(dataObj, ['quoc_tich', 'quoctich', 'quocTich']),
    rawData: dataObj,
  };

  return {
    profile,
    newToken,
  };
}
