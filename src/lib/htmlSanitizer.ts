const BLOCKED_TAG_BLOCKS = [
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  /<style\b[^>]*>[\s\S]*?<\/style>/gi,
  /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
  /<object\b[^>]*>[\s\S]*?<\/object>/gi,
  /<embed\b[^>]*>[\s\S]*?<\/embed>/gi,
  /<svg\b[^>]*>[\s\S]*?<\/svg>/gi,
  /<math\b[^>]*>[\s\S]*?<\/math>/gi,
];

const BLOCKED_STANDALONE_TAGS =
  /<\/?(?:script|style|iframe|object|embed|svg|math|form|input|button|textarea|select|meta|link|base)\b[^>]*>/gi;

const EVENT_HANDLER_ATTRS = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const DANGEROUS_PROTOCOLS = /\b(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/gi;

/**
 * Sanitizes HTML strings coming from external portals (e.g. QLDTTX timetable snippets)
 * before rendering with dangerouslySetInnerHTML.
 */
export function sanitizeHtml(rawHtml?: string | null): string {
  if (!rawHtml) return '';

  let clean = String(rawHtml);
  for (const pattern of BLOCKED_TAG_BLOCKS) {
    clean = clean.replace(pattern, '');
  }
  clean = clean.replace(BLOCKED_STANDALONE_TAGS, '');
  clean = clean.replace(EVENT_HANDLER_ATTRS, '');
  clean = clean.replace(DANGEROUS_PROTOCOLS, '');

  return clean;
}
