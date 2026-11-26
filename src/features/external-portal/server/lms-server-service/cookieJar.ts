/**
 * Quản lý Cookies trong suốt quá trình gửi HTTP requests tới LMS
 */
export class CookieJar {
  private cookies: Map<string, string>;

  constructor(initialCookies?: string) {
    this.cookies = new Map();
    if (initialCookies) {
      this.loadFromCookieString(initialCookies);
    }
  }

  loadFromCookieString(cookieStr: string) {
    if (!cookieStr) return;
    const pairs = cookieStr.split(';');
    pairs.forEach((p) => {
      const parts = p.trim().split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        if (key) this.cookies.set(key, val);
      }
    });
  }

  updateFromResponse(response: Response) {
    let setCookies: string[] = [];
    if (typeof (response.headers as any).getSetCookie === 'function') {
      setCookies = (response.headers as any).getSetCookie();
    } else {
      const raw = response.headers.get('set-cookie');
      if (raw) setCookies = [raw];
    }

    setCookies.forEach((cookieStr) => {
      const parts = cookieStr.split(';')[0].trim().split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        if (key) this.cookies.set(key, val);
      }
    });
  }

  getCookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  get(name: string): string | undefined {
    return this.cookies.get(name);
  }
}
