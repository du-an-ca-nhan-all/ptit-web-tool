import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PTIT EduSync - Cổng Tiện Ích Sinh Viên & Đồng Bộ Học Vụ PTIT',
  description: 'Hệ thống tiện ích sinh viên, tra cứu lịch thi, đối chiếu đăng ký môn học và công cụ lớp trưởng PTIT',
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
