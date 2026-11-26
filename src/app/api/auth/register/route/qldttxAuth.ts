import { loginAndGetToken } from '@/src/features/external-portal/server/qldttxServerService';
import { QLDTTX_TIMEOUT_ERROR, QLDTTX_TIMEOUT_MS } from './constants';

export interface QldttxVerificationResult {
  token: string | null;
  errorMsg: string;
  isTimeout: boolean;
}

export async function verifyQldttxCredentials(
  username: string,
  password: string
): Promise<QldttxVerificationResult> {
  let token: string | null = null;
  let errorMsg = '';
  let isTimeout = false;

  try {
    const tokenPromise = loginAndGetToken({
      username,
      password,
    });
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error(QLDTTX_TIMEOUT_ERROR)), QLDTTX_TIMEOUT_MS)
    );

    const tokenRes = await Promise.race([tokenPromise, timeoutPromise]);
    if (tokenRes && tokenRes.startsWith('Bearer ')) {
      token = tokenRes;
    }
  } catch (err: any) {
    const msg = String(err?.message || '');
    if (msg.includes(QLDTTX_TIMEOUT_ERROR)) {
      isTimeout = true;
    } else {
      errorMsg = msg;
    }
  }

  return { token, errorMsg, isTimeout };
}
