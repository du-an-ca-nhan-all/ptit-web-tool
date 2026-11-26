import { NextRequest } from 'next/server';
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

export function appendStudentNote(existingNote: string | null | undefined, newNote: string): string {
  return existingNote ? `${existingNote} • ${newNote}` : newNote;
}

export interface ResolveExcludeStatusParams {
  actionType: string;
  actionReason: string;
  cleanCurrentClass: string;
  targetClass?: any;
}

export function resolveExcludeStatus({
  actionType,
  actionReason,
  cleanCurrentClass,
  targetClass,
}: ResolveExcludeStatusParams): { targetTrangThai: string; statusNote: string } {
  if (actionType === 'BAO_LUU') {
    return {
      targetTrangThai: 'BAO_LUU',
      statusNote: `[Bảo lưu] ${actionReason}`.trim(),
    };
  }
  if (actionType === 'NGHI_HOC') {
    return {
      targetTrangThai: 'NGHI_HOC',
      statusNote: `[Nghỉ học] ${actionReason}`.trim(),
    };
  }
  if (actionType === 'CHUYEN_LOP') {
    return {
      targetTrangThai: 'CHUYEN_LOP',
      statusNote: `[Chuyển lớp sang ${targetClass || 'mới'}] ${actionReason}`.trim(),
    };
  }
  return {
    targetTrangThai: 'LOAI_BO',
    statusNote: `[Loại khỏi lớp ${cleanCurrentClass}] ${actionReason}`.trim(),
  };
}
