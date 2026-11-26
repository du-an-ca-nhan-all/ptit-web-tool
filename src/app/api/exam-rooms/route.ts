import { NextRequest } from 'next/server';
import { handleGetExamRooms } from './route/getHandler';
import { handlePostExamRoom } from './route/postHandler';
import { handlePutPricingConfig } from './route/putHandler';
import { handleDeleteExamRoom } from './route/deleteHandler';

// GET /api/exam-rooms
export async function GET(req: NextRequest) {
  return handleGetExamRooms(req);
}

// POST /api/exam-rooms
export async function POST(req: NextRequest) {
  return handlePostExamRoom(req);
}

// PUT /api/exam-rooms
export async function PUT(req: NextRequest) {
  return handlePutPricingConfig(req);
}

// DELETE /api/exam-rooms
export async function DELETE(req: NextRequest) {
  return handleDeleteExamRoom(req);
}
