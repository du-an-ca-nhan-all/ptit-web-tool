import { NextRequest } from 'next/server';
import { AuthUser } from '@/src/lib/auth';

export interface ExternalAccountActionBody {
  action?: string;
  systemKey?: string;
  extUsername?: string;
  extPassword?: string;
  refreshToken?: string;
  accessToken?: string;
  systemName?: string;
  systemUrl?: string;
  targetUsername?: string;
}

export interface ExternalAccountActionContext {
  req: NextRequest;
  authUser: AuthUser;
  effectiveUsername: string;
  systemKey: string;
  finalSystemName: string;
  finalSystemUrl: string;
}
