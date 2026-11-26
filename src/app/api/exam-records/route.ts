import { NextRequest } from 'next/server';
import { handleGetExamRecords } from './route/getHandler';
import { handlePatchExamRecords } from './route/patchHandler';

export async function GET(req: NextRequest) {
  return handleGetExamRecords(req);
}

export async function PATCH(req: NextRequest) {
  return handlePatchExamRecords(req);
}
