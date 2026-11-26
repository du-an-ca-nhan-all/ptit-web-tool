import { GLOBAL_SYNC_API_ENDPOINT, QUEUE_FETCH_LIMIT } from './constants';

export async function fetchGlobalSyncQueueApi(targetBatchId: string) {
  const url = new URL(GLOBAL_SYNC_API_ENDPOINT, window.location.origin);
  if (targetBatchId) url.searchParams.set('batchId', targetBatchId);
  url.searchParams.set('limit', QUEUE_FETCH_LIMIT);

  const res = await fetch(url.toString(), {
    headers: { 'Cache-Control': 'no-cache' },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function postGlobalSyncActionApi(payload: Record<string, unknown>) {
  const res = await fetch(GLOBAL_SYNC_API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return { res, data };
}

export async function postGlobalSyncRawActionApi(payload: Record<string, unknown>) {
  return fetch(GLOBAL_SYNC_API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
