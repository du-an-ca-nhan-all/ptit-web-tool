import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose/jwt/verify';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'ptit-secret-key-exam-portal-secure-token-2026'
);

// Public API endpoints that do not require authentication
const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/cron',
  '/api/init-db',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Create response
  const response = NextResponse.next();

  // 2. Attach Security Headers
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // 3. API Protection Layer
  if (pathname.startsWith('/api/')) {
    const isPublicApi = PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));

    if (!isPublicApi) {
      const token =
        request.cookies.get('auth_token')?.value ||
        request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

      if (!token) {
        return NextResponse.json(
          {
            error: 'Yêu cầu không hợp lệ hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
            unauthorized: true,
          },
          { status: 401, headers: response.headers }
        );
      }

      try {
        await jwtVerify(token, JWT_SECRET);
      } catch (err) {
        return NextResponse.json(
          {
            error: 'Phiên làm việc không hợp lệ. Vui lòng đăng nhập lại.',
            unauthorized: true,
          },
          { status: 401, headers: response.headers }
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg, sw.js, site.webmanifest (metadata / PWA files)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|site.webmanifest|sw.js|.*\\.(?:jpg|jpeg|gif|png|webp|svg|ico)$).*)',
  ],
};
