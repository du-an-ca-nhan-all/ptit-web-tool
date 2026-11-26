export const REGISTER_RATE_LIMIT = {
  maxAttempts: 6,
  windowSeconds: 60,
} as const;

export const QLDTTX_TIMEOUT_MS = 10000;
export const QLDTTX_TIMEOUT_ERROR = 'QLDTTX_TIMEOUT';

export const QLDTTX_SYSTEM_CONFIG = {
  systemKey: 'QLDTTX_PTTC1',
  systemName: 'Cổng Quản Lý Đào Tạo Từ Xa (PTTC1)',
  systemUrl: 'https://qldttx.pttc1.edu.vn/',
  syncMessage: 'Đã tự động xác thực và liên kết qua Cổng QLDTTX khi đăng ký tài khoản',
} as const;

export const AUTO_APPROVE_REVIEWER = 'TỰ ĐỘNG (QLHT)';
export const AUTO_APPROVE_NOTE_SUFFIX = '[Tự động duyệt: Mật khẩu khớp Cổng QLDTTX (QLHT)]';
