/**
 * Normalizes date string into DD/MM/YYYY format
 */
export function normalizeDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.trim().split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      const [y, m, d] = parts;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    } else {
      // DD/MM/YYYY
      const [d, m, y] = parts;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
  }
  return dateStr;
}

/**
 * Gets current Vietnam Time (Asia/Ho_Chi_Minh, UTC+7)
 */
export function getVietnamTime(): Date {
  const date = new Date();
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 7);
}

/**
 * Formats a Date object to DD/MM/YYYY string in Vietnam Time
 */
export function formatDateVN(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}
