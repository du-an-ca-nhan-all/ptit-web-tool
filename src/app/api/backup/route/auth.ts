import { NextRequest, NextResponse } from 'next/server';
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

export type BackupAuthUser = NonNullable<Awaited<ReturnType<typeof getAuthUser>>>;

interface AdminAuthErrorMessages {
  unauthenticated: string;
  forbidden: string;
}

export async function requireAdminUser(
  req: NextRequest,
  messages: AdminAuthErrorMessages
): Promise<{ user: BackupAuthUser } | { response: NextResponse }> {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return { response: NextResponse.json({ error: messages.unauthenticated }, { status: 401 }) };
  }

  const isAdmin = checkIsAdmin(authUser.role);
  if (!isAdmin) {
    return { response: NextResponse.json({ error: messages.forbidden }, { status: 403 }) };
  }

  return { user: authUser };
}
