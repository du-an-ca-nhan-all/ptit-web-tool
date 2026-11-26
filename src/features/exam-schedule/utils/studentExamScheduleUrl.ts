import type {
  QldtViewLayout,
  StatusFilterType,
  ViewSourceMode,
} from '../types/studentPersonalExam.types';
import type { StudentQldtExamItem } from '@/src/features/external-portal/server/studentExamScheduleServerService';

const VALID_LAYOUTS: QldtViewLayout[] = ['GRID', 'TABLE', 'TIMELINE', 'PRINT'];
const VALID_SORT_KEYS: (keyof StudentQldtExamItem)[] = [
  'stt',
  'ngayThi',
  'gioBatDau',
  'tenMon',
  'maMon',
  'maPhong',
  'hinhThucThi',
];

function getSearchParams(): URLSearchParams | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search);
}

export function readInitialExamUrlState() {
  const params = getSearchParams();
  const source = params?.get('source')?.toLowerCase();
  const viewSourceMode: ViewSourceMode =
    source === 'file' || source === 'file_tong' || source === 'batch' ? 'FILE_TONG' : 'QLDTTX';

  const layoutParam = params?.get('layout')?.toUpperCase() as QldtViewLayout | undefined;
  let layoutMode: QldtViewLayout = 'TABLE';
  if (layoutParam && VALID_LAYOUTS.includes(layoutParam)) {
    layoutMode = layoutParam;
  } else if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('qldt_exam_layout_mode') as QldtViewLayout | null;
      if (saved && VALID_LAYOUTS.includes(saved)) layoutMode = saved;
    } catch (error) {
      console.warn('[PersonalExam] Failed to read layout mode from localStorage:', error);
    }
  }

  const semRaw = params?.get('semester') || params?.get('semesterId');
  const selectedSemester = semRaw && !isNaN(Number(semRaw)) ? Number(semRaw) : undefined;
  const searchQuery = params?.get('q') || params?.get('search') || '';
  const statusRaw = params?.get('status')?.toUpperCase();
  const statusFilter: StatusFilterType =
    statusRaw === 'UPCOMING' || statusRaw === 'PAST' || statusRaw === 'ALL' ? statusRaw : 'ALL';
  const formatFilter = params?.get('format') || 'ALL';
  const sortKeyRaw = params?.get('sortKey') as keyof StudentQldtExamItem | undefined;
  const tableSortKey: keyof StudentQldtExamItem =
    sortKeyRaw && VALID_SORT_KEYS.includes(sortKeyRaw) ? sortKeyRaw : 'ngayThi';
  const tableSortDirection: 'asc' | 'desc' =
    params?.get('sortDir')?.toLowerCase() === 'desc' ? 'desc' : 'asc';

  return {
    viewSourceMode,
    layoutMode,
    selectedSemester,
    searchQuery,
    statusFilter,
    formatFilter,
    tableSortKey,
    tableSortDirection,
  };
}

function syncQueryParam(url: URL, key: string, value: string | null): boolean {
  if (value) {
    if (url.searchParams.get(key) === value) return false;
    url.searchParams.set(key, value);
    return true;
  }
  if (!url.searchParams.has(key)) return false;
  url.searchParams.delete(key);
  return true;
}

export interface ExamUrlSyncParams {
  viewSourceMode: ViewSourceMode;
  layoutMode: QldtViewLayout;
  statusFilter: StatusFilterType;
  formatFilter: string;
  selectedSemester?: number;
  searchQuery: string;
  tableSortKey: keyof StudentQldtExamItem;
  tableSortDirection: 'asc' | 'desc';
}

export function syncExamStateToUrl(params: ExamUrlSyncParams): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const updates = [
    syncQueryParam(url, 'source', params.viewSourceMode === 'FILE_TONG' ? 'file' : null),
    syncQueryParam(url, 'layout', params.layoutMode !== 'TABLE' ? params.layoutMode.toLowerCase() : null),
    syncQueryParam(url, 'status', params.statusFilter !== 'ALL' ? params.statusFilter.toLowerCase() : null),
    syncQueryParam(url, 'format', params.formatFilter !== 'ALL' ? params.formatFilter : null),
    syncQueryParam(url, 'semester', params.selectedSemester ? String(params.selectedSemester) : null),
    syncQueryParam(url, 'q', params.searchQuery || null),
    syncQueryParam(url, 'sortKey', params.tableSortKey !== 'ngayThi' ? String(params.tableSortKey) : null),
    syncQueryParam(url, 'sortDir', params.tableSortDirection !== 'asc' ? params.tableSortDirection : null),
  ];

  if (updates.some(Boolean)) {
    window.history.replaceState(null, '', url.pathname + (url.search || ''));
  }
}

export interface FilterQldtExamsOptions {
  exams: StudentQldtExamItem[];
  searchQuery: string;
  statusFilter: StatusFilterType;
  formatFilter: string;
  tableSortKey: keyof StudentQldtExamItem;
  tableSortDirection: 'asc' | 'desc';
}

export function filterAndSortQldtExams(options: FilterQldtExamsOptions): StudentQldtExamItem[] {
  const { exams, searchQuery, statusFilter, formatFilter, tableSortKey, tableSortDirection } =
    options;
  const query = searchQuery.toLowerCase().trim();

  const filtered = exams.filter((ex) => {
    const matchSearch =
      !query ||
      ex.tenMon.toLowerCase().includes(query) ||
      ex.maMon.toLowerCase().includes(query) ||
      ex.maPhong.toLowerCase().includes(query) ||
      ex.hinhThucThi.toLowerCase().includes(query) ||
      ex.diaDiemThi.toLowerCase().includes(query);

    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'UPCOMING' ? ex.daysUntil >= 0 : ex.daysUntil < 0);

    const matchFormat = formatFilter === 'ALL' || ex.hinhThucThi === formatFilter;
    return matchSearch && matchStatus && matchFormat;
  });

  return [...filtered].sort((a, b) => {
    let valA: string | number =
      tableSortKey === 'ngayThi' ? a.dateIso || a.ngayThi : String(a[tableSortKey] ?? '');
    let valB: string | number =
      tableSortKey === 'ngayThi' ? b.dateIso || b.ngayThi : String(b[tableSortKey] ?? '');
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return tableSortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return tableSortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}
