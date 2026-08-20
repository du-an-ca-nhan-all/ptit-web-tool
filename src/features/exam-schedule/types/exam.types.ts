import { ExamRecord, ExamBatchItem, ExamSession, SessionClassCount, LoginUser } from '../../../types';

export type { ExamRecord, ExamBatchItem, ExamSession, SessionClassCount, LoginUser };

export type SortKey = 'MaSV' | 'Name' | 'MaLop' | 'MaMH' | 'DateTime' | null;
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  search: string;
  classCode: string;
  subjectCode: string;
  date: string;
}

export interface ExamFilterMetadata {
  classes: string[];
  subjects: { code: string; name: string }[];
  dates: string[];
}

export interface PaginatedExamRecords {
  records: ExamRecord[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}
