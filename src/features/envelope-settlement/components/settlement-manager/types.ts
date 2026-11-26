import { ExamRecord, LoginUser, ExamSession } from '../../../../types';

export interface SettlementManagerProps {
  records: ExamRecord[];
  sessions?: ExamSession[];
  loginUsers?: LoginUser[];
  onTogglePostpone?: (record: ExamRecord, newStatus: boolean) => Promise<void> | void;
  isAdmin?: boolean;
}

export interface DebtDetail {
  session: any;
  fromClass: string;
  toClass: string;
  amount: number;
  studentsCount: number;
  pricePerStudent: number;
  totalRoomPrice: number;
}

export interface PartnerBalance {
  partnerClass: string;
  partnerMonitor: string;
  netBalance: number;
  detailsOweUs: DebtDetail[];
  detailsWeOwe: DebtDetail[];
}

export type SettlementScope = 'CLAIMED_ONLY' | 'ALL';

export interface AvailableClasses {
  monClasses: string[];
  otherClasses: string[];
  allClasses: string[];
}

export interface SettlementData {
  receivables: PartnerBalance[];
  payables: PartnerBalance[];
  settled: PartnerBalance[];
  totalReceive: number;
  totalPay: number;
  netTotal: number;
  involvedRoomsCount: number;
  claimedRoomsInvolvedCount: number;
}

export interface ClassCountItem {
  className: string;
  count: number;
}

export interface ActiveDetailCalc {
  responsibleClass: string;
  totalMonitoredStudents: number;
  pricePerStudent: number;
  totalRoomPrice: number;
  fromClassCount: number;
  amount: number;
}
