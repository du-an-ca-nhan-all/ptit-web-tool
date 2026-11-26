import { ExamBatchItem } from '../../types/exam.types';
import { ImportMode } from './types';

export async function fetchExamBatchesApi(): Promise<{ ok: boolean; batches?: ExamBatchItem[]; error?: string }> {
  const res = await fetch('/api/exam-batches');
  const data = await res.json();
  return { ok: res.ok, batches: data.batches, error: data.error };
}

export async function postExamBatchActionApi(payload: Record<string, unknown>): Promise<{
  ok: boolean;
  success?: boolean;
  message?: string;
  error?: string;
  batch?: ExamBatchItem;
}> {
  const res = await fetch('/api/exam-batches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return {
    ok: res.ok,
    success: data.success,
    message: data.message,
    error: data.error,
    batch: data.batch,
  };
}

export async function importExamBatchCsvApi(
  file: File,
  batchCode: string,
  mode: ImportMode
): Promise<{
  ok: boolean;
  success?: boolean;
  message?: string;
  error?: string;
  totalRecords?: number;
}> {
  const formDataUpload = new FormData();
  formDataUpload.append('file', file);
  formDataUpload.append('batchCode', batchCode);
  formDataUpload.append('mode', mode);

  const res = await fetch('/api/exam-batches/import', {
    method: 'POST',
    body: formDataUpload,
  });
  const data = await res.json();
  return {
    ok: res.ok,
    success: data.success,
    message: data.message,
    error: data.error,
    totalRecords: data.totalRecords,
  };
}
