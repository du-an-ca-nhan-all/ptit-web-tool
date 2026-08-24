/**
 * HTML entities decoding and text cleaning utilities for external portals & Telegram notifications.
 */

const HTML_NAMED_ENTITIES: Record<string, string> = {
  // XML / Basic
  quot: '"',
  amp: '&',
  apos: "'",
  lt: '<',
  gt: '>',
  nbsp: ' ',

  // Latin-1 / ISO-8859-1 (Commonly used in Vietnamese CMS / rich-text editors)
  iexcl: '¡',
  cent: '¢',
  pound: '£',
  curren: '¤',
  yen: '¥',
  brvbar: '¦',
  sect: '§',
  uml: '¨',
  copy: '©',
  ordf: 'ª',
  laquo: '«',
  not: '¬',
  shy: '',
  reg: '®',
  macr: '¯',
  deg: '°',
  plusmn: '±',
  sup1: '¹',
  sup2: '²',
  sup3: '³',
  acute: '´',
  micro: 'µ',
  para: '¶',
  middot: '·',
  cedil: '¸',
  ordm: 'º',
  raquo: '»',
  frac14: '¼',
  frac12: '½',
  frac34: '¾',
  iquest: '¿',
  times: '×',
  divide: '÷',

  // Uppercase Latin Letters with Accents
  Agrave: 'À',
  Aacute: 'Á',
  Acirc: 'Â',
  Atilde: 'Ã',
  Auml: 'Ä',
  Aring: 'Å',
  AElig: 'Æ',
  Ccedil: 'Ç',
  Egrave: 'È',
  Eacute: 'É',
  Ecirc: 'Ê',
  Euml: 'Ë',
  Igrave: 'Ì',
  Iacute: 'Í',
  Icirc: 'Î',
  Iuml: 'Ï',
  ETH: 'Ð',
  Ntilde: 'Ñ',
  Ograve: 'Ò',
  Oacute: 'Ó',
  Ocirc: 'Ô',
  Otilde: 'Õ',
  Ouml: 'Ö',
  Oslash: 'Ø',
  Ugrave: 'Ù',
  Uacute: 'Ú',
  Ucirc: 'Û',
  Uuml: 'Ü',
  Yacute: 'Ý',
  THORN: 'Þ',
  szlig: 'ß',

  // Lowercase Latin Letters with Accents
  agrave: 'à',
  aacute: 'á',
  acirc: 'â',
  atilde: 'ã',
  auml: 'ä',
  aring: 'å',
  aelig: 'æ',
  ccedil: 'ç',
  egrave: 'è',
  eacute: 'é',
  ecirc: 'ê',
  euml: 'ë',
  igrave: 'ì',
  iacute: 'í',
  icirc: 'î',
  iuml: 'ï',
  eth: 'ð',
  ntilde: 'ñ',
  ograve: 'ò',
  oacute: 'ó',
  ocirc: 'ô',
  otilde: 'õ',
  ouml: 'ö',
  oslash: 'ø',
  ugrave: 'ù',
  uacute: 'ú',
  ucirc: 'û',
  uuml: 'ü',
  yacute: 'ý',
  thorn: 'þ',
  yuml: 'ÿ',

  // Latin Extended (A & B)
  Amacr: 'Ā',
  amacr: 'ā',
  Abreve: 'Ă',
  abreve: 'ă',
  Aogon: 'Ą',
  aogon: 'ą',
  Cacute: 'Ć',
  cacute: 'ć',
  Ccirc: 'Ĉ',
  ccirc: 'ĉ',
  Cdot: 'Ċ',
  cdot: 'ċ',
  Ccaron: 'Č',
  ccaron: 'č',
  Dcaron: 'Ď',
  dcaron: 'ď',
  Dstrok: 'Đ',
  dstrok: 'đ',
  Emacr: 'Ē',
  emacr: 'ē',
  Ebreve: 'Ĕ',
  ebreve: 'ĕ',
  Edot: 'Ė',
  edot: 'ė',
  Eogon: 'Ę',
  eogon: 'ę',
  Ecaron: 'Ě',
  ecaron: 'ě',
  Gcirc: 'Ĝ',
  gcirc: 'ĝ',
  Gbreve: 'Ğ',
  gbreve: 'ğ',
  Gdot: 'Ġ',
  gdot: 'ġ',
  Gcedil: 'Ģ',
  gcedil: 'ģ',
  Hcirc: 'Ĥ',
  hcirc: 'ĥ',
  Hstrok: 'Ħ',
  hstrok: 'ħ',
  Itilde: 'Ĩ',
  itilde: 'ĩ',
  Imacr: 'Ī',
  imacr: 'ī',
  Ibreve: 'Ĭ',
  ibreve: 'ĭ',
  Iogon: 'Į',
  iogon: 'į',
  Idot: 'İ',
  imath: 'ı',
  IJlig: 'Ĳ',
  ijlig: 'ĳ',
  Jcirc: 'Ĵ',
  jcirc: 'ĵ',
  Kcedil: 'Ķ',
  kcedil: 'ķ',
  kgreen: 'ĸ',
  Lacute: 'Ĺ',
  lacute: 'ĺ',
  Lcedil: 'Ļ',
  lcedil: 'ļ',
  Lcaron: 'Ľ',
  lcaron: 'ľ',
  Lmidot: 'Ŀ',
  lmidot: 'ŀ',
  Lstrok: 'Ł',
  lstrok: 'ł',
  Nacute: 'Ń',
  nacute: 'ń',
  Ncedil: 'Ņ',
  ncedil: 'ņ',
  Ncaron: 'Ň',
  ncaron: 'ň',
  napos: 'ŉ',
  ENG: 'Ŋ',
  eng: 'ŋ',
  Omacr: 'Ō',
  omacr: 'ō',
  Obreve: 'Ŏ',
  obreve: 'ŏ',
  Odblac: 'Ő',
  odblac: 'ő',
  OElig: 'Œ',
  oelig: 'œ',
  Racute: 'Ŕ',
  racute: 'ŕ',
  Rcedil: 'Ŗ',
  rcedil: 'ŗ',
  Rcaron: 'Ř',
  rcaron: 'ř',
  Sacute: 'Ś',
  sacute: 'ś',
  Scirc: 'Ŝ',
  scirc: 'ŝ',
  Scedil: 'Ş',
  scedil: 'ş',
  Scaron: 'Š',
  scaron: 'š',
  Tcedil: 'Ţ',
  tcedil: 'ţ',
  Tcaron: 'Ť',
  tcaron: 'ť',
  Tstrok: 'Ŧ',
  tstrok: 'ŧ',
  Utilde: 'Ũ',
  utilde: 'ũ',
  Umacr: 'Ū',
  umacr: 'ū',
  Ubreve: 'Ŭ',
  ubreve: 'ŭ',
  Uring: 'Ů',
  uring: 'ů',
  Udblac: 'Ű',
  udblac: 'ű',
  Uogon: 'Ų',
  uogon: 'ų',
  Wcirc: 'Ŵ',
  wcirc: 'ŵ',
  Ycirc: 'Ŷ',
  ycirc: 'ŷ',
  Yuml: 'Ÿ',
  Zacute: 'Ź',
  zacute: 'ź',
  Zdot: 'Ż',
  zdot: 'ż',
  Zcaron: 'Ž',
  zcaron: 'ž',
  fnof: 'ƒ',

  // Typography / General Punctuation
  circ: 'ˆ',
  tilde: '˜',
  ndash: '–',
  mdash: '—',
  horbar: '―',
  lsquo: '‘',
  rsquo: '’',
  sbquo: '‚',
  ldquo: '“',
  rdquo: '”',
  bdquo: '„',
  dagger: '†',
  Dagger: '‡',
  bull: '•',
  hellip: '…',
  permil: '‰',
  prime: '′',
  Prime: '″',
  lsaquo: '‹',
  rsaquo: '›',
  oline: '‾',
  euro: '€',
  trade: '™',

  // Symbols & Math
  larr: '←',
  uarr: '↑',
  rarr: '→',
  darr: '↓',
  harr: '↔',
  crarr: '↵',
  le: '≤',
  ge: '≥',
  ne: '≠',
  equiv: '≡',
  asymp: '≈',
  approx: '≈',
  sum: '∑',
  prod: '∏',
  radic: '√',
  infin: '∞',
  empty: '∅',
  cap: '∩',
  cup: '∪',
  int: '∫',
  sim: '∼',
  minus: '−',
  lowast: '∗',
  sdot: '⋅',
  perp: '⊥',
  ang: '∠',
  and: '∧',
  or: '∨',
  exist: '∃',
  forall: '∀',
  isin: '∈',
  notin: '∉',
  ni: '∋',
  sub: '⊂',
  sup: '⊃',
  nsub: '⊄',
  sube: '⊆',
  supe: '⊇',
  spades: '♠',
  clubs: '♣',
  hearts: '♥',
  diams: '♦',
  loz: '◊',
  lceil: '⌈',
  rceil: '⌉',
  lfloor: '⌊',
  rfloor: '⌋',

  // Greek Letters
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ε',
  zeta: 'ζ',
  eta: 'η',
  theta: 'θ',
  iota: 'ι',
  kappa: 'κ',
  lambda: 'λ',
  mu: 'μ',
  nu: 'ν',
  xi: 'ξ',
  omicron: 'ο',
  pi: 'π',
  rho: 'ρ',
  sigma: 'σ',
  tau: 'τ',
  upsilon: 'υ',
  phi: 'φ',
  chi: 'χ',
  psi: 'ψ',
  omega: 'ω',
  Alpha: 'Α',
  Beta: 'Β',
  Gamma: 'Γ',
  Delta: 'Δ',
  Epsilon: 'Ε',
  Zeta: 'Ζ',
  Eta: 'Η',
  Theta: 'Θ',
  Iota: 'Ι',
  Kappa: 'Κ',
  Lambda: 'Λ',
  Mu: 'Μ',
  Nu: 'Ν',
  Xi: 'Ξ',
  Omicron: 'Ο',
  Pi: 'Π',
  Rho: 'Ρ',
  Sigma: 'Σ',
  Tau: 'Τ',
  Upsilon: 'Υ',
  Phi: 'Φ',
  Chi: 'Χ',
  Psi: 'Ψ',
  Omega: 'Ω',
};

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
      } catch {}
      return _;
    });

    // 2. Decimal numeric entities: &#234;
    current = current.replace(/&#([0-9]{1,7});/g, (_, dec) => {
      try {
        const code = parseInt(dec, 10);
        if (code >= 0 && code <= 0x10ffff) {
          return String.fromCodePoint(code);
        }
      } catch {}
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
