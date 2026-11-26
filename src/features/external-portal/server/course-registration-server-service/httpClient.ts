import { getValidTokenOrRefresh } from '../qldttxServerService';
import { QLDTTX_BASE_URL, STATIC_HEADERS } from './constants';
import type { QldttxAccountInput } from './types';
import { generateUA } from './uaHeader';

export interface ResolvedTokenState {
  validToken: string;
  accumulatedToken: string | undefined;
}

export async function resolveAccountToken(
  account: QldttxAccountInput,
  onlyTrackIfNew: boolean
): Promise<ResolvedTokenState> {
  let validToken = account.token;
  let accumulatedToken: string | undefined;

  if (!validToken && account.password) {
    const res = await getValidTokenOrRefresh({
      username: account.username,
      password: account.password,
      existingToken: account.token,
    });
    validToken = res.token;
    if (!onlyTrackIfNew || res.isNew) {
      accumulatedToken = validToken;
    }
  }

  if (!validToken) {
    throw new Error('Chưa có token hoặc mật khẩu để kết nối cổng QLDTTX');
  }

  return { validToken, accumulatedToken };
}

export interface PostQldttxEndpointParams {
  endpoint: string;
  body: unknown;
  account: QldttxAccountInput;
  tokenState: ResolvedTokenState;
}

export async function postQldttxEndpoint(
  params: PostQldttxEndpointParams
): Promise<{ parsed: any; accumulatedToken: string | undefined }> {
  const { endpoint, body, account, tokenState } = params;
  const url = `${QLDTTX_BASE_URL}${endpoint}`;
  const rawToken = tokenState.validToken.replace(/^Bearer\s+/i, '').trim();
  let accumulatedToken = tokenState.accumulatedToken;

  let response = await fetch(url, {
    method: 'POST',
    headers: {
      ...STATIC_HEADERS,
      Authorization: `Bearer ${rawToken}`,
      Cookie: `access_token=${rawToken}`,
      ua: generateUA(endpoint),
    },
    body: JSON.stringify(body),
  });

  // Token hết hạn -> tự động login lại & retry
  if ((response.status === 401 || response.status === 403) && account.password) {
    const fresh = await getValidTokenOrRefresh({
      username: account.username,
      password: account.password,
    });
    accumulatedToken = fresh.token;
    const freshRaw = fresh.token.replace(/^Bearer\s+/i, '').trim();
    response = await fetch(url, {
      method: 'POST',
      headers: {
        ...STATIC_HEADERS,
        Authorization: `Bearer ${freshRaw}`,
        Cookie: `access_token=${freshRaw}`,
        ua: generateUA(endpoint),
      },
      body: JSON.stringify(body),
    });
  }

  const text = await response.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }

  if (!response.ok) {
    throw new Error(
      `Cổng QLDTTX phản hồi lỗi (${response.status}): ${typeof parsed === 'string' ? parsed : parsed?.message || JSON.stringify(parsed)}`
    );
  }

  return { parsed, accumulatedToken };
}
