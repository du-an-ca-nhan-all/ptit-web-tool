import { getStoredEnvelopeAssignments } from '../envelopeAssignmentConfig';
import { getPricingConfig, getSessionPriceOverrides } from './storage';
import type { PricingConfig } from './types';

export const getDefaultRoomPrice = (
  subject: string,
  subjectCode: string,
  room: string,
  examFormat: string = '',
  customConfig?: PricingConfig
): number => {
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

export const calculateRoomPrice = (
  subject: string,
  subjectCode: string,
  room: string,
  examFormat: string = '',
  sessionKey?: string,
  customConfig?: PricingConfig,
  overrides?: Record<string, number>
): number => {
  // 1. Kiểm tra nếu phòng/buổi thi này có mức giá tùy chỉnh riêng
  if (sessionKey) {
    const sessionOverrides = overrides || getSessionPriceOverrides();
    if (sessionOverrides[sessionKey] !== undefined && typeof sessionOverrides[sessionKey] === 'number') {
      return sessionOverrides[sessionKey];
    }

    // 2. Kiểm tra từ envelope assignments confirmation (bảng/cache phân công phong bì)
    try {
      const assignments = getStoredEnvelopeAssignments();
      if (
        assignments &&
        assignments[sessionKey]?.customPrice !== undefined &&
        assignments[sessionKey]?.customPrice !== null &&
        typeof assignments[sessionKey]?.customPrice === 'number'
      ) {
        return Number(assignments[sessionKey].customPrice);
      }
    } catch {}

    try {
      if (typeof window !== 'undefined') {
        const rawAssign =
          localStorage.getItem('ptit_envelope_assignments') ||
          localStorage.getItem('custom_envelope_assignments');
        if (rawAssign) {
          const map = JSON.parse(rawAssign);
          if (
            map[sessionKey]?.customPrice !== undefined &&
            map[sessionKey]?.customPrice !== null &&
            typeof map[sessionKey]?.customPrice === 'number'
          ) {
            return Number(map[sessionKey].customPrice);
          }
        }
      }
    } catch {}
  }

  return getDefaultRoomPrice(subject, subjectCode, room, examFormat, customConfig);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};
