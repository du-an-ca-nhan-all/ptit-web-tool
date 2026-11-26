import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import { resolveEffectiveBotToken } from '@/src/features/telegram/server/telegramServerService';

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

export type AuthUser = NonNullable<Awaited<ReturnType<typeof getAuthUser>>>;

export async function findQldttxAccount(username: string) {
  return prisma.externalAccount.findFirst({
    where: {
      username: username.toUpperCase(),
      systemKey: 'QLDTTX_PTTC1',
    },
  });
}

export function isQldttxAccountValid(
  extAccount: Awaited<ReturnType<typeof findQldttxAccount>>
): boolean {
  return !!(
    extAccount &&
    (extAccount.token || extAccount.extPassword) &&
    extAccount.status !== 'ERROR'
  );
}

export async function findSlinkAccount(username: string) {
  return prisma.externalAccount.findFirst({
    where: {
      username: username.toUpperCase(),
      OR: [
        { systemKey: 'SLINK_PTIT' },
        { systemUrl: { contains: 'slink.ptit.edu.vn' } },
      ],
    },
  });
}

export function isSlinkAccountValid(
  slinkAccount: Awaited<ReturnType<typeof findSlinkAccount>>
): boolean {
  return !!(
    slinkAccount &&
    (slinkAccount.token || slinkAccount.refreshToken) &&
    slinkAccount.status !== 'ERROR'
  );
}

export async function resolveEffectiveTokenOrResponse(
  customToken: string | null | undefined,
  fallbackError?: string
): Promise<{ token: string; errorResponse?: never } | { token?: never; errorResponse: NextResponse }> {
  try {
    const resolved = await resolveEffectiveBotToken(customToken);
    return { token: resolved.token };
  } catch (err: any) {
    return {
      errorResponse: NextResponse.json(
        { error: fallbackError ? err.message || fallbackError : err.message },
        { status: 400 }
      ),
    };
  }
}
