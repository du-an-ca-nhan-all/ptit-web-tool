import type { SlinkGuideImage } from './types';

export const SLINK_OIDC_STORAGE_KEY =
  'oidc.user:https://gwdu.ptit.edu.vn/sso/realms/ptit:ptit-connect';

export const SLINK_GUIDE_IMAGES: SlinkGuideImage[] = [
  {
    id: 'step1',
    stepNum: '1',
    title: 'Bước 1: Đăng nhập OAuth trên slink.ptit.edu.vn',
    shortTitle: '1. Đăng nhập OAuth',
    badge: 'Cổng S-Link',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    src: '/assets/slink_oauth_step1_login.jpg',
    caption:
      'Mở slink.ptit.edu.vn trên trình duyệt và đăng nhập qua cổng OAuth / Microsoft PTIT như bình thường.',
  },
  {
    id: 'step2a',
    stepNum: '2A',
    title: 'Bước 2 (Cách 1 - Nhanh nhất): Application → Session Storage',
    shortTitle: '2A. Session Storage',
    badge: 'Khuyên dùng',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    src: '/assets/slink_oauth_step2_session_storage.jpg',
    caption: `Nhấn F12 → tab Application → Session Storage → https://slink.ptit.edu.vn → chọn khóa "${SLINK_OIDC_STORAGE_KEY}" và copy giá trị "refresh_token".`,
  },
  {
    id: 'step2b',
    stepNum: '2B',
    title: 'Bước 2 (Cách 2): Network → POST token → Response',
    shortTitle: '2B. Tab Network',
    badge: 'Chrome DevTools',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    src: '/assets/slink_oauth_step2_devtools.jpg',
    caption:
      'Nhấn F12 → tab Network → lọc "token" → chọn request POST token → tab Response và copy giá trị "refresh_token" (không gồm dấu ngoặc kép).',
  },
  {
    id: 'step3',
    stepNum: '3',
    title: 'Bước 3: Dán Refresh Token → Kiểm Tra & Lưu Kết Nối',
    shortTitle: '3. Dán & Lưu Token',
    badge: 'PTIT Web Tool',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    src: '/assets/slink_oauth_step3_connect.jpg',
    caption:
      'Dán refresh_token vào ô bên dưới, bấm "Kiểm Tra Kết Nối" rồi "Lưu & Kết Nối". Hệ thống sẽ tự động gia hạn định kỳ mỗi 20 phút.',
  },
];
