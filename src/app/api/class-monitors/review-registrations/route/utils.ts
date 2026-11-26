import { NextRequest } from 'next/server';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';

export async function getAuthUser(req: NextRequest) {
  let authUser = await getCurrentUserFromCookie();
  if (!authUser) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      authUser = await verifyAuthToken(token);
    }
  }
  return authUser;
}

export function normalizeCode(value?: string | null): string {
  return String(value || '').trim().toUpperCase();
}
