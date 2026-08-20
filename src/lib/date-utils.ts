/**
 * Utility functions for date manipulation and formatting (Vietnamese locale)
 */

export function parseDateString(dateStr: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();

  // Match DD/MM/YYYY
  const ddmmyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return isNaN(d.getTime()) ? null : d;
  }

  // Match YYYY-MM-DD
  const yyyymmdd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return isNaN(d.getTime()) ? null : d;
  }

  // Fallback to ISO
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateVN(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateInput.trim())) return dateInput.trim();
    const d = parseDateString(dateInput);
    if (!d) return dateInput;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const day = String(dateInput.getDate()).padStart(2, '0');
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const year = dateInput.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return '';
}

export function formatDateTimeVN(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!d || isNaN(d.getTime())) return String(dateInput);

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

export function getRelativeTimeVN(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!d || isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return formatDateVN(d);
}
