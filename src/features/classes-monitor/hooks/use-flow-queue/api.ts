const FLOW_QUEUE_ENDPOINT = '/api/class-monitors/flow-queue';

export async function getFlowQueueData(
  classCode: string,
  monitorUsername: string,
  batchId?: string
) {
  const url = `${FLOW_QUEUE_ENDPOINT}?classCode=${encodeURIComponent(classCode)}&monitorUsername=${encodeURIComponent(monitorUsername)}${
    batchId ? `&batchId=${encodeURIComponent(batchId)}` : ''
  }`;
  const res = await fetch(url);
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function postFlowQueueAction(payload: Record<string, unknown>) {
  const res = await fetch(FLOW_QUEUE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function postFlowQueueActionNoJson(payload: Record<string, unknown>) {
  await fetch(FLOW_QUEUE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
