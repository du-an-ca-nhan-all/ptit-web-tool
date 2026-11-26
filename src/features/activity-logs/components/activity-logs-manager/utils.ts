export const parseUserAgent = (ua?: string | null) => {
  if (!ua) return 'Không xác định';
  if (ua.includes('Postman')) return 'Postman API Client';
  if (ua.includes('node-fetch') || ua.includes('axios')) return 'Internal Server Worker';
  let browser = 'Trình duyệt web';
  if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edge/')) browser = 'Edge';

  let os = '';
  if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  return os ? `${browser} (${os})` : browser;
};

export const formatDateTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};
