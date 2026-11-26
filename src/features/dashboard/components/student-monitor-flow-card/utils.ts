export function formatActionTypeName(type?: string | null): string {
  if (!type) return 'Đồng bộ môn học';
  const upper = type.toUpperCase();
  if (upper.includes('REGISTER')) return 'Đăng ký môn học';
  if (upper.includes('CANCEL')) return 'Hủy môn học';
  if (upper.includes('SYNC')) return 'Đồng bộ danh sách môn';
  return type;
}
