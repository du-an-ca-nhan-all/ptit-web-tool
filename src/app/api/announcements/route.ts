import { NextRequest } from 'next/server';
import { handleGetAnnouncements } from './route/getHandler';
import { handlePostAnnouncements } from './route/postHandler';

// GET /api/announcements or /api/announcements?admin=true
export async function GET(req: NextRequest) {
  return handleGetAnnouncements(req);
}

// POST /api/announcements
export async function POST(req: NextRequest) {
  return handlePostAnnouncements(req);
}
