import { NextRequest } from 'next/server';
import { handleGetClassMembers } from './route/getHandler';
import { handlePostClassMember } from './route/postHandler';
import { handleDeleteClassMember } from './route/deleteHandler';

export async function GET(req: NextRequest) {
  return handleGetClassMembers(req);
}

export async function POST(req: NextRequest) {
  return handlePostClassMember(req);
}

export async function DELETE(req: NextRequest) {
  return handleDeleteClassMember(req);
}
