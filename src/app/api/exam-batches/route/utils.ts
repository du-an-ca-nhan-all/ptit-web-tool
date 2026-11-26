import { NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken, type AuthUser } from '@/src/lib/auth';

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
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

export async function generateUniqueBatchCode(name: string): Promise<string> {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);

  const baseCode = normalized || `DOT_THI_${Date.now()}`;
  let candidate = baseCode;
  let counter = 2;

  while (await prisma.examBatch.findUnique({ where: { code: candidate }, select: { id: true } })) {
    candidate = `${baseCode}_${counter}`;
    counter += 1;
  }

  return candidate;
}

export function revalidateExamBatchCaches(): void {
  revalidateTag('exam-batches', { expire: 0 });
  revalidateTag('metadata-filters', { expire: 0 });
}
