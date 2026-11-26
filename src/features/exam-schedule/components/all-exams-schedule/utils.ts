export function getFormatBadgeColor(formatStr?: string): string {
  const f = (formatStr || '').toLowerCase();
  if (f.includes('trắc nghiệm') || f === 'tn' || f === 'tt') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (f.includes('thực hành') || f.includes('máy') || f === 'th') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (f.includes('tiểu luận') || f.includes('báo cáo') || f === 'bctl') return 'bg-purple-100 text-purple-800 border-purple-200';
  if (f.includes('tự luận') || f.includes('viết') || f === 'tl') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export function getDayOfWeekVietnamese(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split(/[\/\-]/);
  if (parts.length !== 3) return '';
  let d = 1, m = 1, y = 1970;
  const p0 = parseInt(parts[0], 10);
  const p1 = parseInt(parts[1], 10);
  const p2 = parseInt(parts[2], 10);
  y = p2;
  if (p1 > 12) {
    m = p0;
    d = p1;
  } else if (p0 > 12) {
    d = p0;
    m = p1;
  } else {
    m = p0;
    d = p1;
  }
  const dateObj = new Date(y, m - 1, d);
  if (isNaN(dateObj.getTime())) return '';
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return days[dateObj.getDay()] || '';
}
