import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'S-Exam Portal - Cổng Thông Tin & Quản Lý Lịch Thi',
  description: 'Hệ thống tra cứu lịch thi, quản lý thành viên lớp, phong bì thi và bù trừ thanh toán',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased overflow-hidden select-text">
        {children}
      </body>
    </html>
  );
}
