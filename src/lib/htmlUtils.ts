/**
 * HTML entities decoding and text cleaning utilities for external portals & Telegram notifications.
 */

import { HTML_NAMED_ENTITIES } from './html-utils/constants';

/**
 * Giải mã các ký tự HTML Entity (Named, Decimal &#123;, Hex &#xABC;) thành ký tự hiển thị UTF-8.
 * Hỗ trợ multi-pass cho chuỗi bị double encoded (ví dụ &amp;ecirc;).
 */
export function decodeHtmlEntities(text?: string): string {
  if (!text || typeof text !== 'string') return '';

  let current = text;
  let prev = '';
  let passes = 0;

  // Lặp tối đa 3 lần để xử lý double encoding nếu có
  while (current !== prev && passes < 3) {
    prev = current;
    passes++;

    // 1. Hex numeric entities: &#xEA; hoặc &#XEA;
    current = current.replace(/&#[xX]([0-9a-fA-F]{1,6});/g, (_, hex) => {
      try {
        const code = parseInt(hex, 16);
        if (code >= 0 && code <= 0x10ffff) {
          return String.fromCodePoint(code);
        }
      } catch (caughtError) {
        console.warn(`[htmlUtils] Non-fatal error:`, caughtError);
      }
      return _;
    });

    // 2. Decimal numeric entities: &#234;
    current = current.replace(/&#([0-9]{1,7});/g, (_, dec) => {
      try {
        const code = parseInt(dec, 10);
        if (code >= 0 && code <= 0x10ffff) {
          return String.fromCodePoint(code);
        }
      } catch (caughtError) {
        console.warn(`[htmlUtils] Non-fatal error:`, caughtError);
      }
      return _;
    });

    // 3. Named entities: &ecirc;, &oacute;, &nbsp;, ...
    current = current.replace(/&([a-zA-Z0-9]+);/g, (match, entityName) => {
      if (Object.prototype.hasOwnProperty.call(HTML_NAMED_ENTITIES, entityName)) {
        return HTML_NAMED_ENTITIES[entityName];
      }
      return match;
    });
  }

  return current;
}

/**
 * Xóa sạch thẻ HTML và giải mã toàn bộ HTML entities thành chuỗi văn bản thuần túy (plain text).
 */
export function cleanHtml(html?: string): string {
  if (!html || typeof html !== 'string') return '';

  const processed = html
    // Chuyển ngắt dòng và thẻ block thành ký tự xuống dòng
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    // Xóa tất cả các thẻ HTML còn lại
    .replace(/<[^>]+>/g, '');

  // Giải mã toàn bộ HTML entities
  const decoded = decodeHtmlEntities(processed);

  // Chuẩn hóa khoảng trắng và dòng trống
  return decoded
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

/**
 * Escape các ký tự đặc biệt cho Telegram HTML parse mode (`parse_mode: 'HTML'`).
 * Khi format message động (title, content, name) nằm trong các tag `<b>`, `<i>`, ...
 * cần escape `<` -> `&lt;`, `>` -> `&gt;`, `&` -> `&amp;` để tránh lỗi Telegram parser.
 */
export function escapeTelegramHtml(text?: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
