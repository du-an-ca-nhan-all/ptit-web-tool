import type React from 'react';
import type { ExamRecord, LoginUser, ExamBatchItem } from './exam.types';
import type { FilterState } from '../components/FilterBar';
import type { SortKey, SortDirection } from '../components/DataTable';
import type { StudentQldtExamItem } from '@/src/features/external-portal/server/studentExamScheduleServerService';

export type QldtViewLayout = 'GRID' | 'TABLE' | 'TIMELINE' | 'PRINT';
export type ViewSourceMode = 'QLDTTX' | 'FILE_TONG';
export type StatusFilterType = 'ALL' | 'UPCOMING' | 'PAST';
export type QldtErrorType = 'NOT_CONFIGURED' | 'INVALID_CREDENTIALS' | 'SERVER_ERROR' | null;

export interface SyncFeedback {
  type: 'success' | 'error';
  message: string;
}

export interface RoomClassMatch {
  classmates: number;
  total?: number;
  record: ExamRecord;
}

export type RoomClassStatsLookupFn = (
  maMon?: string,
  ngayThi?: string,
  maPhong?: string
) => RoomClassMatch | null;

export interface TimelineGroup {
  dateStr: string;
  dateIso: string;
  dayOfWeek: string;
  daysUntil: number;
  items: StudentQldtExamItem[];
}

export interface StudentPersonalExamScheduleProps {
  currentUser: LoginUser;
  onNavigateToExternalAccounts?: () => void;
  records: ExamRecord[];
  totalRecords: number;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalPages: number;
  sortConfig: { key: SortKey; direction: SortDirection } | null;
  setSortConfig: React.Dispatch<
    React.SetStateAction<{ key: SortKey; direction: SortDirection } | null>
  >;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  classes: string[];
  subjects: { code: string; name: string }[];
  dates: string[];
  selectedExamRoom: ExamRecord | null;
  setSelectedExamRoom: (room: ExamRecord | null) => void;
  setConfirmStudentId: (id: string | null) => void;
  setConfirmClassCode: (code: string | null) => void;
  handleToggleExamPostpone: (record: ExamRecord, newStatus: boolean) => Promise<void>;
  canAccessMonitorTools: boolean;
  isLoadingBatchData: boolean;
  activeBatch: ExamBatchItem | null;
  loadDataFromApi: (batchCode?: string) => Promise<void>;
}
