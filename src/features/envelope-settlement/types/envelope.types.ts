import { ExamRecord, LoginUser, ExamBatchItem } from '../../../types';

export type { ExamRecord, LoginUser, ExamBatchItem };

export interface EnvelopeItem {
  id: number;
  batchCode: string;
  classCode: string;
  monitorUsername?: string | null;
  monitorName?: string | null;
  totalRooms: number;
  totalStudents: number;
  totalAmount: number;
  isPaid: boolean;
  paidAt?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PricingConfigItem {
  id: number;
  batchCode?: string;
  pricePerExam: number;
  pricePerSubject?: number;
  pricePerRoom?: number;
  effectiveFrom?: string;
  note?: string;
}
