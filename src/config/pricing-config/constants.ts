import type { PricingConfig } from './types';

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  commonRoom: 600000,
  englishOralRoom: 2000000, // Tiếng anh vấn đáp
};

export const PRICING_CONFIG = DEFAULT_PRICING_CONFIG;

export const STORAGE_KEY_PRICING = 'custom_pricing_config';
export const STORAGE_KEY_OVERRIDES = 'custom_session_price_overrides';
