export const SLINK_QLDT_API_BASE = 'https://gwdu.ptit.edu.vn/qldt';

export const SLINK_COMPONENT_NAMES: Record<number, { code: string; name: string }> = {
  1: { code: 'CC', name: 'Chuyên cần' },
  2: { code: 'BTTL', name: 'Bài tập, thảo luận' },
  3: { code: 'TBKT', name: 'Trung bình kiểm tra' },
  4: { code: 'TGK', name: 'Thi giữa học phần' },
  5: { code: 'TNTH', name: 'Thí nghiệm, thực hành' },
  6: { code: 'ĐGQTH', name: 'Điểm ĐGTK trong quá trình học' },
  7: { code: 'TP7', name: 'Điểm thành phần 7' },
  8: { code: 'TP8', name: 'Điểm thành phần 8' },
  9: { code: 'TP9', name: 'Điểm thành phần 9' },
  10: { code: 'TP10', name: 'Điểm thành phần 10' },
};

export interface GradeBucketSpec {
  grade: string;
  description: string;
  colorClass: string;
}

export const GRADE_BUCKET_SPECS: GradeBucketSpec[] = [
  { grade: 'A+', description: 'Xuất sắc (9.0 - 10.0)', colorClass: 'bg-emerald-500 text-white' },
  { grade: 'A', description: 'Giỏi (8.5 - 8.9)', colorClass: 'bg-teal-500 text-white' },
  { grade: 'B+', description: 'Khá giỏi (8.0 - 8.4)', colorClass: 'bg-blue-500 text-white' },
  { grade: 'B', description: 'Khá (7.0 - 7.9)', colorClass: 'bg-cyan-500 text-white' },
  { grade: 'C+', description: 'Trung bình khá (6.5 - 6.9)', colorClass: 'bg-amber-500 text-white' },
  { grade: 'C', description: 'Trung bình (5.5 - 6.4)', colorClass: 'bg-orange-500 text-white' },
  { grade: 'D+', description: 'Trung bình yếu (5.0 - 5.4)', colorClass: 'bg-rose-400 text-white' },
  { grade: 'D', description: 'Yếu (4.0 - 4.9)', colorClass: 'bg-rose-600 text-white' },
  { grade: 'F', description: 'Kém (Dưới 4.0 - Học lại)', colorClass: 'bg-red-700 text-white' },
  { grade: 'IN_PROGRESS', description: 'Đang học / Chưa công bố điểm', colorClass: 'bg-slate-400 text-white' },
];

export const SLINK_AUTH_ERROR_KEYWORDS = [
  '401',
  '403',
  'không thành công',
  'mật khẩu',
  'tài khoản',
  'đăng nhập',
  'unauthorized',
  'forbidden',
  'invalid_grant',
];
