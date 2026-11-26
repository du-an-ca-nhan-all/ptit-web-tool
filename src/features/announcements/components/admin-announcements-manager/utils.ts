export function getAuthHeaders(includeJsonContentType = false): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const headers: Record<string, string> = includeJsonContentType
    ? { 'Content-Type': 'application/json' }
    : {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export function formatDateTimeLocalInput(dateValue?: string | null): string {
  return dateValue ? new Date(dateValue).toISOString().slice(0, 16) : '';
}
