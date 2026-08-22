import { LoginUser } from '../features/auth/types/auth.types';

export const AUTH_EXPIRED_EVENT = 'ptit:auth_expired';

/**
 * Get saved auth token from localStorage (client-side only)
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

/**
 * Get saved user from localStorage (client-side only)
 */
export function getStoredUser(): LoginUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

/**
 * Clear all authentication data from localStorage
 */
export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('currentUser');
  } catch {}
}

/**
 * Trigger auth expiration event and clear stored credentials
 */
export function handleAuthExpired(
  message: string = 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.'
): void {
  if (typeof window === 'undefined') return;
  clearStoredAuth();
  window.dispatchEvent(
    new CustomEvent(AUTH_EXPIRED_EVENT, {
      detail: { message },
    })
  );
}

/**
 * Initializes a global fetch interceptor in the browser to:
 * 1. Automatically attach `Authorization: Bearer <token>` to internal `/api/*` requests
 * 2. Detect 401 Unauthorized responses from protected endpoints and redirect/switch to login
 */
export function initAuthInterceptor(): void {
  if (typeof window === 'undefined') return;
  if ((window as any).__ptit_auth_interceptor_installed) return;
  (window as any).__ptit_auth_interceptor_installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const rawUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.toString()
        : input instanceof Request
        ? input.url
        : String(input);

    const isInternalApi = rawUrl.startsWith('/api/') || rawUrl.includes('/api/');
    const isAuthBypassEndpoint =
      rawUrl.includes('/api/auth/login') ||
      rawUrl.includes('/api/auth/register') ||
      rawUrl.includes('/api/auth/logout');

    let modifiedInit = init;

    if (isInternalApi && !isAuthBypassEndpoint) {
      const token = getStoredToken();
      if (token) {
        const headers = new Headers(
          init?.headers || (input instanceof Request ? input.headers : undefined)
        );
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
          modifiedInit = {
            ...init,
            headers,
          };
        }
      }
    }

    const response = await originalFetch(input, modifiedInit);

    // If any protected API responds with 401 Unauthorized, trigger auth expiration
    if (response.status === 401 && isInternalApi && !isAuthBypassEndpoint) {
      handleAuthExpired('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.');
    }

    return response;
  };
}
