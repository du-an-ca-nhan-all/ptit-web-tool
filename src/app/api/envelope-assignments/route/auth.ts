import { NextRequest } from 'next/server';
import { getCurrentUserFromCookie, verifyAuthToken, checkIsAdmin } from '@/src/lib/auth';

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

export function verifyIsMonitorOrAdmin(authUser: any): boolean {
  if (!authUser) return false;
  if (checkIsAdmin(authUser.role) || authUser.isAdmin || authUser.activeRole === 'admin') return true;
  if (authUser.isMonitor) return true;
  if (typeof authUser.role === 'string') {
    const roles = authUser.role.split(',').map((r: string) => r.trim().toLowerCase());
    if (roles.includes('lop_truong') || roles.includes('admin')) return true;
  }
  return false;
}
