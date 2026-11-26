import { parseDateString } from '@/src/lib/date-utils';
import type { SlinkJwtPayload } from './types';

/**
 * Giải mã payload JWT (không verify chữ ký) để đọc metadata như azp (client_id), exp, iss, email...
 */
export function decodeSlinkJwtPayload(token?: string | null): SlinkJwtPayload | null {
  if (!token) return null;
  try {
    const clean = token.replace(/^Bearer\s+/i, '').trim().replace(/^["']|["']$/g, '');
    const parts = clean.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const jsonStr = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(jsonStr) as SlinkJwtPayload;
  } catch {
    return null;
  }
}

/**
 * Tính thời điểm hết hạn của Access Token & Refresh Token từ phản hồi Keycloak hoặc JWT exp
 */
export function computeSlinkTokenExpiry(tokenRes: {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
}): { tokenExpiresAt: Date | null; refreshTokenExpiresAt: Date | null } {
  const now = Date.now();

  let tokenExpiresAt: Date | null = null;
  if (typeof tokenRes.expires_in === 'number' && tokenRes.expires_in > 0) {
    tokenExpiresAt = new Date(now + tokenRes.expires_in * 1000);
  } else {
    const accessPayload = decodeSlinkJwtPayload(tokenRes.access_token);
    if (accessPayload?.exp) {
      tokenExpiresAt = new Date(accessPayload.exp * 1000);
    }
  }

  let refreshTokenExpiresAt: Date | null = null;
  if (typeof tokenRes.refresh_expires_in === 'number' && tokenRes.refresh_expires_in > 0) {
    refreshTokenExpiresAt = new Date(now + tokenRes.refresh_expires_in * 1000);
  } else {
    const refreshPayload = decodeSlinkJwtPayload(tokenRes.refresh_token);
    if (refreshPayload?.exp) {
      refreshTokenExpiresAt = new Date(refreshPayload.exp * 1000);
    }
  }

  return { tokenExpiresAt, refreshTokenExpiresAt };
}

/**
 * Chuẩn hóa tên đăng nhập S-Link thành địa chỉ Email sinh viên PTIT (...@stu.ptit.edu.vn)
 * @param identifier Mã SV hoặc Email sinh viên
 */
export function formatSlinkEmail(identifier: string): string {
  const clean = identifier.trim();
  if (!clean) return '';
  if (clean.includes('@')) return clean.toLowerCase();
  return `${clean.toLowerCase()}@stu.ptit.edu.vn`;
}

/**
 * Format ngày tháng ISO sang định dạng ngày giờ Việt Nam
 */
export function formatSlinkDate(isoStr?: string | Date | number): string {
  if (!isoStr) return 'N/A';
  try {
    const d = parseDateString(isoStr);
    if (!d || isNaN(d.getTime())) return String(isoStr);
    return d.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return String(isoStr);
  }
}
