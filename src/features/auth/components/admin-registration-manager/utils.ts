export function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function buildAuthHeaders(includeJsonContentType = false): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const headers: Record<string, string> = includeJsonContentType
    ? { 'Content-Type': 'application/json' }
    : {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}
