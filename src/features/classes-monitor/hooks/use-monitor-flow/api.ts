const FLOW_CONFIG_ENDPOINT = '/api/class-monitors/flow-config';

export interface FlowApiResponse {
  ok: boolean;
  data: any;
}

export async function fetchFlowConfigApi(
  classCode: string,
  monitorUsername: string
): Promise<FlowApiResponse> {
  const res = await fetch(
    `${FLOW_CONFIG_ENDPOINT}?classCode=${classCode}&monitorUsername=${monitorUsername}`
  );
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function postFlowConfigAction(
  payload: Record<string, unknown>
): Promise<FlowApiResponse> {
  const res = await fetch(FLOW_CONFIG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}
