import type { Metadata, Viewport } from 'next';
import './globals.css';
import PWAProvider from '../components/pwa/PWAProvider';

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'PTIT EduSync - Cổng Tiện Ích Sinh Viên & Đồng Bộ Học Vụ PTIT',
  description: 'Hệ thống tiện ích sinh viên, tra cứu lịch thi, đối chiếu đăng ký môn học và công cụ lớp trưởng PTIT',
  applicationName: 'PTIT EduSync',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PTIT EduSync',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PTIT EduSync" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="font-sans antialiased overflow-hidden select-text">
        <PWAProvider>
          {children}
        </PWAProvider>
      </body>
    </html>
  );
}
