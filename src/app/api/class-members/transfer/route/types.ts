import type { NextRequest } from 'next/server';
import type { AuthUser } from '@/src/lib/auth';

export interface TransferActionContext {
  req: NextRequest;
  authUser: AuthUser;
  cleanMaSV: string;
  isAdmin: boolean;
  userClass?: string | null;
}

export interface ReceiveActionPayload {
  currentClass?: any;
  targetClass?: any;
  reason?: any;
  studentInfo?: any;
}

export interface ExcludeActionPayload {
  currentClass?: any;
  targetClass?: any;
  type?: any;
  reason?: any;
}

export interface RestoreActionPayload {
  targetClass?: any;
}
