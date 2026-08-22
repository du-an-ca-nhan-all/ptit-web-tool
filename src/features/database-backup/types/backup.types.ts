import { LoginUser } from '../../../types';

export type { LoginUser };

export interface TableStat {
  name: string;
  label: string;
  count: number;
  description: string;
}

export interface DatabaseStats {
  tables: Record<string, number>;
  tableBreakdown: TableStat[];
  totalRecords: number;
  dbFileSize?: number;
  dbFileSizeFormatted?: string;
  dbLastModified?: string | null;
}

