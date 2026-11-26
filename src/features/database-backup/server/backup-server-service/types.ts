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
  dbFileSize: number;
  dbFileSizeFormatted: string;
  dbLastModified: string | null;
}

export interface LocalBackupFile {
  name: string;
  format: 'sql' | 'json' | 'sqlite';
  size: number;
  sizeFormatted: string;
  createdAt: string;
}
