import { ExamRecord, SortKey, SortDirection } from '../../types/exam.types';

export type SortConfig = { key: SortKey; direction: SortDirection } | null;

export interface DataTableProps {
  records: ExamRecord[];
  totalRecords?: number;
  currentPage?: number;
  totalPages?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (size: number) => void;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
  onStudentClick: (maSV: string) => void;
  onClassClick: (maLop: string) => void;
  onRowClick?: (record: ExamRecord) => void;
  onTogglePostpone?: (record: ExamRecord, newStatus: boolean) => Promise<void> | void;
  canEditPostpone?: boolean;
  hideStatusColumn?: boolean;
  showRoomClassmatesColumn?: boolean;
  onViewRoomReviewMembers?: (record: ExamRecord) => void;
  isLoading?: boolean;
}
