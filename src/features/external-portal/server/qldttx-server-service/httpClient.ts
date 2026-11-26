/**
 * Authenticated HTTP helper for QLDTTX POST requests with automatic 401/403 token refresh.
 */

import { getValidTokenOrRefresh, loginAndGetToken } from './auth';
import { STATIC_HEADERS } from './constants';
import type { QldttxAccountInput } from './types';

export function stripBearerPrefix(token: string): string {
  return token.replace(/^Bearer\s+/i, '').trim();
}

export function buildAuthHeaders(rawToken: string): Record<string, string> {
  return {
    ...STATIC_HEADERS,
    Authorization: `Bearer ${rawToken}`,
    Cookie: `access_token=${rawToken}`,
  };
}

export async function resolveInitialToken(
  account: QldttxAccountInput,
  missingTokenMessage = 'Chưa có token hoặc mật khẩu để kết nối cổng QLDTTX'
): Promise<{ validToken: string; accumulatedToken?: string }> {
  let validToken = account.token;
  let accumulatedToken: string | undefined;

  if (!validToken && account.password) {
    const res = await getValidTokenOrRefresh({
      username: account.username,
      password: account.password,
      existingToken: account.token,
    });
    validToken = res.token;
    if (res.isNew) {
      accumulatedToken = validToken;
    }
  }

  if (!validToken) {
    throw new Error(missingTokenMessage);
  }

  return { validToken, accumulatedToken };
}

export async function postQldttxWithAuth(options: {
  url: string;
  body: unknown;
  account: QldttxAccountInput;
  resolvedToken?: string;
  initialAccumulatedToken?: string;
  missingTokenMessage?: string;
}): Promise<{
  response: Response;
  parsed: any;
  effectiveToken: string;
  newToken?: string;
}> {
  let validToken = options.resolvedToken;
  let accumulatedToken = options.initialAccumulatedToken;

  if (!validToken) {
    const resolved = await resolveInitialToken(options.account, options.missingTokenMessage);
    validToken = resolved.validToken;
    accumulatedToken = resolved.accumulatedToken;
  }

  const rawToken = stripBearerPrefix(validToken);
  const serializedBody = JSON.stringify(options.body);

  let response = await fetch(options.url, {
    method: 'POST',
    headers: buildAuthHeaders(rawToken),
    body: serializedBody,
  });

  // If token expired (401/403) and password available, auto refresh token & retry
  if ((response.status === 401 || response.status === 403) && options.account.password) {
    const fresh = await loginAndGetToken({
      username: options.account.username,
      password: options.account.password,
    });
    accumulatedToken = fresh;
    const freshRaw = stripBearerPrefix(fresh);
    response = await fetch(options.url, {
      method: 'POST',
      headers: buildAuthHeaders(freshRaw),
      body: serializedBody,
    });
  }

  const text = await response.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }

  return {
    response,
    parsed,
    effectiveToken: stripBearerPrefix(accumulatedToken || validToken),
    newToken: accumulatedToken,
  };
}
