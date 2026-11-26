import { NextRequest } from 'next/server';
import { handleGetReviewRegistrations } from './route/getHandler';
import { handlePostReviewRegistrations } from './route/postHandler';

// GET /api/class-monitors/review-registrations?batchCode=...&classCode=...
export async function GET(req: NextRequest) {
  return handleGetReviewRegistrations(req);
}

// POST /api/class-monitors/review-registrations
// Actions: TOGGLE_ONE | SAVE_BULK | IMPORT_MASV
export async function POST(req: NextRequest) {
  return handlePostReviewRegistrations(req);
}
