import React from 'react';
import {
  ExamRecord,
  ExamBatchItem,
  FilterState,
  SortKey,
  SortDirection,
} from '../../types/exam.types';

export interface AllExamsScheduleProps {
  records: ExamRecord[];
  totalRecords: number;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalPages: number;
  sortConfig: { key: SortKey; direction: SortDirection } | null;
  setSortConfig: (config: { key: SortKey; direction: SortDirection } | null) => void;
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
  isLoading: boolean;
  activeBatch: ExamBatchItem | null;
  loadDataFromApi: (batchCode?: string) => Promise<void>;
}
