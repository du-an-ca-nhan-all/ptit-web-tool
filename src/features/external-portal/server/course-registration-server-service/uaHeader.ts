/**
 * Thuật toán mã hóa Header 'ua' reverse-engineered từ hệ thống Frontend netweb (AQTech)
 */
export class CT {
  rk(start: number): number[] {
    const ks = this.sc();
    const step = (start % 3) + 1;
    return Array.from({ length: 10 }, (_, i) => ks[(start + i * step) % ks.length]);
  }

  sc(): number[] {
    const ki = [
      58, 43, 197, 133, 4, 165, 110, 3, 44, 202, 186, 28, 118, 177, 32, 94,
      219, 6, 199, 27, 101, 191, 66, 115, 234, 120, 10, 236, 104, 108, 74, 247,
      68, 198, 62, 203, 17, 102, 185, 42,
    ];
    return ki.slice(-36).slice(0, 32);
  }

  ec(s: string, start: number): number[] {
    const pw = this.rk(start).reverse();
    const hx = s.split('').map((x) => x.charCodeAt(0));
    let bi: number[] = [];
    while (bi.length < hx.length) bi = [...bi, ...pw];
    return hx.map((x, i) => x ^ bi[i]);
  }
}

function rnd(mx: number): number {
  return Math.ceil(Math.random() * mx);
}

/**
 * Tạo header 'ua' cần thiết cho tất cả các API endpoint /api/* của AQTech
 * @param endpoint - URI endpoint (ví dụ: '/api/dkmh/w-locdsnhomto')
 */
export function generateUA(endpoint: string): string {
  const parts = endpoint.toLowerCase().split('/api/');
  let pfx = (parts[1] || endpoint).toUpperCase();
  if (pfx.length > 22) pfx = pfx.slice(0, 22);
  const now = `${rnd(89) + 10}${Date.now()}${rnd(89) + 10}${pfx}`;
  const start = rnd(31);
  const ret = [start + 32, ...new CT().ec(now, start)].map((x) => String.fromCharCode(x)).join('');
  return Buffer.from(ret, 'latin1').toString('base64');
}
