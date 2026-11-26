import {
  DEFAULT_PRICING_CONFIG,
  STORAGE_KEY_OVERRIDES,
  STORAGE_KEY_PRICING,
} from './constants';
import type {
  ExamRoomData,
  PricingConfig,
  SessionPriceOverrideMeta,
} from './types';

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function getPricingConfig(): PricingConfig {
  if (typeof window === 'undefined') return DEFAULT_PRICING_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRICING);
    if (!raw) return DEFAULT_PRICING_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      commonRoom:
        typeof parsed.commonRoom === 'number' && parsed.commonRoom >= 0
          ? parsed.commonRoom
          : DEFAULT_PRICING_CONFIG.commonRoom,
      englishOralRoom:
        typeof parsed.englishOralRoom === 'number' && parsed.englishOralRoom >= 0
          ? parsed.englishOralRoom
          : DEFAULT_PRICING_CONFIG.englishOralRoom,
    };
  } catch {
    return DEFAULT_PRICING_CONFIG;
  }
}

export async function fetchPricingFromBackend(): Promise<{
  globalPricing: PricingConfig;
  overrides: Record<string, number>;
}> {
  if (typeof window === 'undefined') {
    return { globalPricing: DEFAULT_PRICING_CONFIG, overrides: {} };
  }
  try {
    const res = await fetch('/api/exam-rooms');
    if (!res.ok) throw new Error('Failed to fetch pricing');
    const data = await res.json();

    const globalPricing: PricingConfig = data.globalPricing || DEFAULT_PRICING_CONFIG;
    const overrides: Record<string, number> = {};

    if (Array.isArray(data.examRooms)) {
      data.examRooms.forEach((r: ExamRoomData) => {
        if (r.roomKey && typeof r.customPrice === 'number') {
          overrides[r.roomKey] = r.customPrice;
        }
      });
    }

    localStorage.setItem(STORAGE_KEY_PRICING, JSON.stringify(globalPricing));
    localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(overrides));
    window.dispatchEvent(new CustomEvent('pricing_config_changed', { detail: globalPricing }));

    return { globalPricing, overrides };
  } catch {
    return {
      globalPricing: getPricingConfig(),
      overrides: getSessionPriceOverrides(),
    };
  }
}

export function savePricingConfig(config: Partial<PricingConfig>): PricingConfig {
  if (typeof window === 'undefined') return DEFAULT_PRICING_CONFIG;
  const current = getPricingConfig();
  const next: PricingConfig = {
    commonRoom:
      config.commonRoom !== undefined && config.commonRoom >= 0
        ? Number(config.commonRoom)
        : current.commonRoom,
    englishOralRoom:
      config.englishOralRoom !== undefined && config.englishOralRoom >= 0
        ? Number(config.englishOralRoom)
        : current.englishOralRoom,
  };
  try {
    localStorage.setItem(STORAGE_KEY_PRICING, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('pricing_config_changed', { detail: next }));

    // Sync to backend DB asynchronously
    fetch('/api/exam-rooms', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(next),
    }).catch(() => {});
  } catch {}
  return next;
}

export function resetPricingConfig(): PricingConfig {
  if (typeof window === 'undefined') return DEFAULT_PRICING_CONFIG;
  try {
    localStorage.removeItem(STORAGE_KEY_PRICING);
    window.dispatchEvent(
      new CustomEvent('pricing_config_changed', { detail: DEFAULT_PRICING_CONFIG })
    );

    // Reset on backend DB
    fetch('/api/exam-rooms', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(DEFAULT_PRICING_CONFIG),
    }).catch(() => {});
  } catch {}
  return DEFAULT_PRICING_CONFIG;
}

export function getSessionPriceOverrides(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OVERRIDES);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

export function saveSessionPriceOverride(
  sessionKey: string,
  price: number,
  meta?: SessionPriceOverrideMeta
): void {
  if (typeof window === 'undefined' || !sessionKey) return;
  const current = getSessionPriceOverrides();
  const priceNum = Math.max(0, Number(price) || 0);
  current[sessionKey] = priceNum;
  try {
    localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('pricing_config_changed'));

    // Extract default mapThi from sessionKey if not provided
    const mapThi = meta?.mapThi || sessionKey.split('|')[0] || sessionKey;

    // Sync to backend ExamRoom table
    fetch('/api/exam-rooms', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        roomKey: sessionKey,
        mapThi,
        maMH: meta?.maMH,
        tenMH: meta?.tenMH,
        ngayThi: meta?.ngayThi,
        gioThi: meta?.gioThi,
        maHTThi: meta?.maHTThi,
        batchCode: meta?.batchCode,
        customPrice: priceNum,
        note: meta?.note,
      }),
    }).catch(() => {});
  } catch {}
}

export function removeSessionPriceOverride(sessionKey: string): void {
  if (typeof window === 'undefined' || !sessionKey) return;
  const current = getSessionPriceOverrides();
  delete current[sessionKey];
  try {
    localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('pricing_config_changed'));

    // Sync deletion to backend DB
    fetch(`/api/exam-rooms?roomKey=${encodeURIComponent(sessionKey)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).catch(() => {});
  } catch {}
}

export function clearAllSessionPriceOverrides(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_OVERRIDES);
    window.dispatchEvent(new CustomEvent('pricing_config_changed'));

    // Sync clear-all to backend DB
    fetch('/api/exam-rooms?clearAll=true', {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).catch(() => {});
  } catch {}
}
