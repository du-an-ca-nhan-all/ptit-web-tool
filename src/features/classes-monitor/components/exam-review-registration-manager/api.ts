import { ReviewStudentItem } from './types';

interface FetchReviewListResponse {
  ok: boolean;
  success: boolean;
  students?: ReviewStudentItem[];
  error?: string;
}

interface MutationResponse {
  ok: boolean;
  success: boolean;
  error?: string;
}

export async function fetchReviewRegistrations(
  batchCode: string,
  classCode: string
): Promise<FetchReviewListResponse> {
  const params = new URLSearchParams({ batchCode, classCode });
  const res = await fetch(`/api/class-monitors/review-registrations?${params.toString()}`);
  const data = await res.json();
  return {
    ok: res.ok,
    success: Boolean(data.success),
    students: data.students,
    error: data.error,
  };
}

export async function postToggleStudentReview(payload: {
  batchCode: string;
  classCode: string;
  maSV: string;
  isRegistered: boolean;
  note?: string;
}): Promise<MutationResponse> {
  const res = await fetch('/api/class-monitors/review-registrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'TOGGLE_ONE',
      ...payload,
    }),
  });
  const data = await res.json();
  return {
    ok: res.ok,
    success: Boolean(data.success),
    error: data.error,
  };
}

export async function postBulkReviewRegistrations(payload: {
  batchCode: string;
  classCode: string;
  items: Array<{ maSV: string; isRegistered: boolean }>;
}): Promise<MutationResponse> {
  const res = await fetch('/api/class-monitors/review-registrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'SAVE_BULK',
      ...payload,
    }),
  });
  const data = await res.json();
  return {
    ok: res.ok,
    success: Boolean(data.success),
    error: data.error,
  };
}
