import { DEFAULT_PRICING_CONFIG, PricingConfig } from '@/src/config/pricingConfig';

export function parseGlobalPricing(rawValue?: string | null): PricingConfig {
  let globalPricing: PricingConfig = DEFAULT_PRICING_CONFIG;
  if (rawValue) {
    try {
      const parsed = JSON.parse(rawValue);
      globalPricing = {
        commonRoom:
          typeof parsed.commonRoom === 'number' && parsed.commonRoom >= 0
            ? parsed.commonRoom
            : DEFAULT_PRICING_CONFIG.commonRoom,
        englishOralRoom:
          typeof parsed.englishOralRoom === 'number' && parsed.englishOralRoom >= 0
            ? parsed.englishOralRoom
            : DEFAULT_PRICING_CONFIG.englishOralRoom,
      };
    } catch (caughtError) {
      console.warn(`[utils] Non-fatal error:`, caughtError);
    }
  }
  return globalPricing;
}
