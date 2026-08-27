import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale records every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 3600 * 1000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export function getClientIp(req: NextRequest | Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim());
    if (ips[0]) return ips[0];
  }
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;

  return '127.0.0.1';
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Sliding window in-memory rate limiter
 * @param identifier Unique key (e.g. `login:192.168.1.1` or `user:K25DTCN402`)
 * @param limit Maximum allowed requests within window
 * @param windowSeconds Window length in seconds
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const cutoff = now - windowMs;

  let record = rateLimitStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(identifier, record);
  }

  // Filter out timestamps older than window
  record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

  const currentCount = record.timestamps.length;
  const oldestTimestamp = record.timestamps[0] || now;
  const resetSeconds = Math.max(1, Math.ceil((oldestTimestamp + windowMs - now) / 1000));

  if (currentCount >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetSeconds,
    };
  }

  record.timestamps.push(now);

  return {
    success: true,
    limit,
    remaining: limit - record.timestamps.length,
    resetSeconds,
  };
}

/**
 * Standard 429 Too Many Requests response
 */
export function createRateLimitExceededResponse(
  message = 'Bạn đang thực hiện thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
  resetSeconds = 60
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      rateLimited: true,
      retryAfter: resetSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(resetSeconds),
        'X-RateLimit-Reset': String(resetSeconds),
      },
    }
  );
}
