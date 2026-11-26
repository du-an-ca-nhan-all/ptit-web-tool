export const TIMETABLE_AUTO_REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export const PERIOD_TIMES: Record<number, { start: string; end: string; startMin: number }> = {
  1: { start: '07:00', end: '07:50', startMin: 7 * 60 },
  2: { start: '07:55', end: '08:45', startMin: 7 * 60 + 55 },
  3: { start: '08:50', end: '09:40', startMin: 8 * 60 + 50 },
  4: { start: '09:45', end: '10:35', startMin: 9 * 60 + 45 },
  5: { start: '10:40', end: '11:30', startMin: 10 * 60 + 40 },
  6: { start: '11:35', end: '12:25', startMin: 11 * 60 + 35 },
  7: { start: '12:30', end: '13:20', startMin: 12 * 60 + 30 },
  8: { start: '13:25', end: '14:15', startMin: 13 * 60 + 25 },
  9: { start: '14:20', end: '15:10', startMin: 14 * 60 + 20 },
  10: { start: '15:15', end: '16:05', startMin: 15 * 60 + 15 },
  11: { start: '16:10', end: '17:00', startMin: 16 * 60 + 10 },
  12: { start: '17:05', end: '17:55', startMin: 17 * 60 + 5 },
  13: { start: '19:00', end: '19:50', startMin: 19 * 60 },
  14: { start: '20:00', end: '20:50', startMin: 20 * 60 },
  15: { start: '21:00', end: '21:50', startMin: 21 * 60 },
  16: { start: '21:55', end: '22:45', startMin: 21 * 60 + 55 },
};

export const DOW_MAP: Record<number, string> = {
  2: 'Thứ 2',
  3: 'Thứ 3',
  4: 'Thứ 4',
  5: 'Thứ 5',
  6: 'Thứ 6',
  7: 'Thứ 7',
  8: 'Chủ Nhật',
};

export const AUTH_ERROR_KEYWORDS = [
  '401',
  '403',
  'không thành công',
  'mật khẩu',
  'tài khoản',
  'đăng nhập',
  'unauthorized',
  'forbidden',
  'không đúng',
  'user không tồn tại',
] as const;
