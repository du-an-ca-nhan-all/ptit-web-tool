import type { Metadata, Viewport } from 'next';
import './globals.css';
import PWAProvider from '../components/pwa/PWAProvider';

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
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
      <body className="font-sans antialiased overflow-hidden select-text">
        <PWAProvider>
          {children}
        </PWAProvider>
      </body>
    </html>
  );
}
