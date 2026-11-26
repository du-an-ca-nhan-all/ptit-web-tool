import { NextRequest } from 'next/server';
import type { AuthUser } from '@/src/lib/auth';

export interface ExamBatchActionBody {
  action?: string;
  code?: unknown;
  name?: unknown;
  semester?: unknown;
  academicYear?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  description?: unknown;
  isActive?: unknown;
  deleteRecords?: unknown;
}

export interface ExamBatchActionContext {
  req: NextRequest;
  authUser: AuthUser;
  body: ExamBatchActionBody;
}
