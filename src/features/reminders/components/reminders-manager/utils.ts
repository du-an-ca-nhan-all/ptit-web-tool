/**
 * Kiểm tra và chuyển đổi một chuỗi địa điểm thành URL hợp lệ nếu có dạng liên kết
 */
export function parseUrl(text?: string | null): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(?:www\.|meet\.google\.com|zoom\.us|teams\.microsoft\.com|[a-zA-Z0-9-]+\.(?:edu|com|org|net|vn|io|app|me|gg|link)\b)/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return null;
}

/**
 * Chuyển đổi Date object thành chuỗi định dạng 'YYYY-MM-DDTHH:mm' theo giờ địa phương
 * để gán làm giá trị cho input datetime-local
 */
export function formatToDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Định dạng nhãn đếm ngược tới thời điểm diễn ra sự kiện
 */
export function getCountdownLabel(dateStr: string): string {
  const now = Date.now();
  const event = new Date(dateStr).getTime();
  const diffMs = event - now;

  if (diffMs < 0) {
    const pastHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
    if (pastHours < 24) return 'Đã qua';
    return `Đã qua ${Math.floor(pastHours / 24)} ngày`;
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const remainHours = diffHours % 24;

  if (diffDays === 0 && remainHours === 0) return 'Sắp diễn ra (< 1 giờ)';
  if (diffDays === 0) return `Hôm nay (còn ${remainHours} giờ)`;
  if (diffDays === 1) return `Ngày mai (còn 1 ngày ${remainHours}h)`;
  return `Còn ${diffDays} ngày ${remainHours}h`;
}
