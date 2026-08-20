import { LoginUser } from '../../../types';

export type { LoginUser };

export interface TableStat {
  name: string;
  label: string;
  count: number;
  description: string;
}

export interface DatabaseStats {
  tables: {
    users: number;
    students: number;
    examBatches: number;
    examRecords: number;
    courseRegistrations: number;
    systemMeta: number;
    externalAccounts: number;
    envelopeAssignments: number;
    priceOverrides: number;
    pricingConfigs: number;
    activityLogs: number;
    telegramConfigs: number;
    telegramLogs: number;
    telegramSubscribers: number;
    announcements: number;
    announcementReads: number;
    studentGrades: number;
    studentTimetableEvents: number;
  };
  totalRecords: number;
  dbSizeEstimate: string;
}
