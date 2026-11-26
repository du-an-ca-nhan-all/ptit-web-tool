import React from 'react';
import Script from 'next/script';
import { GA_TRACKING_ID } from '@/src/lib/gtag';

interface GoogleAnalyticsProps {
  gaId?: string;
}

const SAFE_GA_ID_RE = /^(?:G|AW|DC|UA)-[A-Z0-9-]+$/i;

export default function GoogleAnalytics({ gaId = GA_TRACKING_ID }: GoogleAnalyticsProps) {
  if (!gaId || !SAFE_GA_ID_RE.test(gaId)) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
