import { getStoredEnvelopeAssignments } from '../envelopeAssignmentConfig';
import { getPricingConfig, getSessionPriceOverrides } from './storage';
import type { PricingConfig } from './types';

export interface GetDefaultRoomPriceParams {
  subject: string;
  subjectCode: string;
  room: string;
  examFormat?: string;
  customConfig?: PricingConfig;
}

export const getDefaultRoomPrice = ({
  subject,
  room,
  examFormat = '',
  customConfig,
}: GetDefaultRoomPriceParams): number => {
  const config = customConfig || getPricingConfig();
  const subjectLower = (subject || '').toLowerCase();
  const formatLower = (examFormat || '').toLowerCase();
  const roomLower = (room || '').toLowerCase();

  // Kiểm tra nếu là tiếng Anh và thi vấn đáp
  const isEnglish = subjectLower.includes('tiếng anh') || subjectLower.includes('english');
  const isOral =
    subjectLower.includes('vấn đáp') ||
    roomLower.includes('vấn đáp') ||
    formatLower.includes('vấn đáp') ||
    formatLower.includes('vđ') ||
    formatLower === 'vd';

  if (isEnglish && isOral) {
    return config.englishOralRoom;
  }

  return config.commonRoom;
};

export interface CalculateRoomPriceParams {
  subject: string;
  subjectCode: string;
  room: string;
  examFormat?: string;
  sessionKey?: string;
  customConfig?: PricingConfig;
  overrides?: Record<string, number>;
}

function getLocalStorageCustomPrice(sessionKey: string): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const rawAssign =
      localStorage.getItem('ptit_envelope_assignments') ||
      localStorage.getItem('custom_envelope_assignments');
    if (!rawAssign) return null;
    const map = JSON.parse(rawAssign);
    const customPrice = map[sessionKey]?.customPrice;
    return typeof customPrice === 'number' ? Number(customPrice) : null;
  } catch (caughtError) {
    console.warn(`[calculator] Non-fatal error:`, caughtError);
    return null;
  }
}

export const calculateRoomPrice = ({
  subject,
  subjectCode,
  room,
  examFormat = '',
  sessionKey,
  customConfig,
  overrides,
}: CalculateRoomPriceParams): number => {
  if (!sessionKey) {
    return getDefaultRoomPrice({ subject, subjectCode, room, examFormat, customConfig });
  }

  // 1. Kiểm tra nếu phòng/buổi thi này có mức giá tùy chỉnh riêng
  const sessionOverrides = overrides || getSessionPriceOverrides();
  if (typeof sessionOverrides[sessionKey] === 'number') {
    return sessionOverrides[sessionKey];
  }

  // 2. Kiểm tra từ envelope assignments confirmation (bảng/cache phân công phong bì)
  try {
    const assignments = getStoredEnvelopeAssignments();
    const customPrice = assignments?.[sessionKey]?.customPrice;
    if (typeof customPrice === 'number') {
      return Number(customPrice);
    }
  } catch (caughtError) {
    console.warn(`[calculator] Non-fatal error:`, caughtError);
  }

  const localPrice = getLocalStorageCustomPrice(sessionKey);
  if (localPrice !== null) return localPrice;

  return getDefaultRoomPrice({ subject, subjectCode, room, examFormat, customConfig });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};
