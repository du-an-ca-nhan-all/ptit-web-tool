export const GA_TRACKING_ID =
  process.env.NEXT_PUBLIC_GA_ID ||
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
  'G-XLPKR5RKT7';

export type GTagEvent = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
};

// Track page views manually if needed
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function' && GA_TRACKING_ID) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Track custom events
export const event = ({ action, category, label, value, ...rest }: GTagEvent) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', action, {
      ...(category ? { event_category: category } : {}),
      ...(label ? { event_label: label } : {}),
      ...(value !== undefined ? { value } : {}),
      ...rest,
    });
  }
};

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
