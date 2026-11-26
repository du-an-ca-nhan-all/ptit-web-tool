import { useState, useEffect, useMemo, useCallback } from 'react';
import { LoginUser } from '../../../../types';
import {
  StudentCourseGrade,
  StudentGradesResult,
} from '../../server/studentGradesServerService';
import {
  AnalyticsTab,
  DataSource,
  GpaModeView,
  GpaScaleView,
  GradesErrorType,
  SyncFeedback,
} from './types';
import {
  buildGradesSummaryText,
  exportGradesCsv,
  filterSemesters,
  formatSyncDateTime,
} from './utils';

export function useStudentGrades(
  currentUser: LoginUser,
  initialSource?: DataSource
) {
  const [dataSource, setDataSource] = useState<DataSource>(() => {
    if (initialSource) return initialSource;
    if (typeof window === 'undefined') return 'SLINK';
    const params = new URLSearchParams(window.location.search);
    const s = params.get('source')?.toUpperCase();
    if (s === 'QLDTTX' || s === 'QLHT') return 'QLDTTX';
    return 'SLINK';
  });

  useEffect(() => {
    if (initialSource && initialSource !== dataSource) {
      setDataSource(initialSource);
    }
  }, [initialSource]);

  const [data, setData] = useState<StudentGradesResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<GradesErrorType>(null);
  const [syncFeedback, setSyncFeedback] = useState<SyncFeedback>(null);

  // Filters & Search
  const [selectedSemester, setSelectedSemester] = useState<string>(() => {
    if (typeof window === 'undefined') return 'ALL';
    const params = new URLSearchParams(window.location.search);
    return params.get('semester') || 'ALL';
  });

  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>(() => {
    if (typeof window === 'undefined') return 'ALL';
    const params = new URLSearchParams(window.location.search);
    return params.get('grade') || 'ALL';
  });

  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || params.get('search') || '';
  });

  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<AnalyticsTab>(() => {
    if (typeof window === 'undefined') return 'PROGRESSION';
    const params = new URLSearchParams(window.location.search);
    const a = params.get('analytics')?.toUpperCase();
    if (a === 'PROGRESSION' || a === 'DISTRIBUTION' || a === 'ADVISING' || a === 'SIMULATOR') return a;
    return 'PROGRESSION';
  });

  const [selectedCourseModal, setSelectedCourseModal] = useState<StudentCourseGrade | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showGpaModal, setShowGpaModal] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [gpaScaleView, setGpaScaleView] = useState<GpaScaleView>('both');
  const [gpaModeView, setGpaModeView] = useState<GpaModeView>('BOTH');

  // Sync filters to URL query params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    let changed = false;

    if (dataSource !== 'SLINK') {
      if (url.searchParams.get('source') !== 'qldttx' && url.searchParams.get('source') !== 'qlht') {
        url.searchParams.set('source', 'qldttx');
        changed = true;
      }
    } else if (url.searchParams.has('source') && (url.searchParams.get('source') === 'qldttx' || url.searchParams.get('source') === 'qlht' || url.searchParams.get('source') === 'slink')) {
      url.searchParams.delete('source');
      changed = true;
    }

    if (selectedSemester !== 'ALL') {
      if (url.searchParams.get('semester') !== selectedSemester) {
        url.searchParams.set('semester', selectedSemester);
        changed = true;
      }
    } else if (url.searchParams.has('semester')) {
      url.searchParams.delete('semester');
      changed = true;
    }

    if (selectedGradeFilter !== 'ALL') {
      if (url.searchParams.get('grade') !== selectedGradeFilter) {
        url.searchParams.set('grade', selectedGradeFilter);
        changed = true;
      }
    } else if (url.searchParams.has('grade')) {
      url.searchParams.delete('grade');
      changed = true;
    }

    if (searchQuery) {
      if (url.searchParams.get('q') !== searchQuery) {
        url.searchParams.set('q', searchQuery);
        changed = true;
      }
    } else if (url.searchParams.has('q')) {
      url.searchParams.delete('q');
      changed = true;
    }

    if (activeAnalyticsTab !== 'PROGRESSION') {
      if (url.searchParams.get('analytics') !== activeAnalyticsTab.toLowerCase()) {
        url.searchParams.set('analytics', activeAnalyticsTab.toLowerCase());
        changed = true;
      }
    } else if (url.searchParams.has('analytics')) {
      url.searchParams.delete('analytics');
      changed = true;
    }

    if (changed) {
      window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
    }
  }, [dataSource, selectedSemester, selectedGradeFilter, searchQuery, activeAnalyticsTab]);

  // Fetch grades from API
  const fetchGrades = useCallback(async (refresh = false, targetSource?: DataSource) => {
    const activeSrc = targetSource || dataSource;
    if (refresh) {
      setIsRefreshing(true);
      setSyncFeedback(null);
    } else {
      setIsLoading(true);
    }
    setError(null);
    setErrorType(null);

    const isSlink = activeSrc === 'SLINK';
    const sourceLabel = isSlink ? 'PTIT S-Link' : 'QLDTTX';

    try {
      const endpoint = isSlink
        ? `/api/slink/grades${refresh ? '?refresh=true' : ''}`
        : `/api/student/grades${refresh ? '?refresh=true' : ''}`;

      const res = await fetch(endpoint);
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
        setErrorType(null);
        if (refresh) {
          const syncTimeFormatted = formatSyncDateTime(json.lastSyncAt || new Date().toISOString());
          setSyncFeedback({
            type: 'success',
            message: `Đồng bộ thành công dữ liệu bảng điểm mới nhất từ ${sourceLabel} (lúc ${syncTimeFormatted})!`,
          });
          setTimeout(() => setSyncFeedback(null), 6000);
        }
      } else {
        const type = json.errorType || (res.status === 401 ? 'INVALID_CREDENTIALS' : 'SERVER_ERROR');
        setErrorType(type);
        setError(json.error || `Không thể tải kết quả học tập từ ${sourceLabel}`);
        if (json.username) {
          setData(json);
        }
        if (refresh) {
          setSyncFeedback({
            type: 'error',
            message: json.error || `Đồng bộ từ cổng ${sourceLabel} thất bại. Vui lòng kiểm tra lại tài khoản.`,
          });
        }
      }
    } catch (err: any) {
      setErrorType('SERVER_ERROR');
      setError(`Lỗi kết nối máy chủ khi lấy dữ liệu bảng điểm từ ${sourceLabel}`);
      if (refresh) {
        setSyncFeedback({
          type: 'error',
          message: `Lỗi kết nối máy chủ khi đồng bộ điểm từ ${sourceLabel}.`,
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dataSource]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const semesters = useMemo(() => data?.semesters || [], [data]);

  const filteredSemesters = useMemo(
    () =>
      filterSemesters({
        semesters,
        selectedSemester,
        selectedGradeFilter,
        searchQuery,
      }),
    [semesters, selectedSemester, selectedGradeFilter, searchQuery]
  );

  const handleSwitchSource = useCallback(
    (source: DataSource) => {
      if (dataSource !== source) {
        setDataSource(source);
        fetchGrades(false, source);
      }
    },
    [dataSource, fetchGrades]
  );

  const handleExportCSV = useCallback(() => {
    if (!data || !data.semesters) return;
    exportGradesCsv(data, currentUser.username);
  }, [data, currentUser.username]);

  const handleCopySummary = useCallback(() => {
    if (!data?.summary) return;
    const text = buildGradesSummaryText(data, currentUser);
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  }, [data, currentUser]);

  return {
    dataSource,
    data,
    summary: data?.summary,
    isLoading,
    isRefreshing,
    error,
    errorType,
    syncFeedback,
    setSyncFeedback,
    selectedSemester,
    setSelectedSemester,
    selectedGradeFilter,
    setSelectedGradeFilter,
    searchQuery,
    setSearchQuery,
    activeAnalyticsTab,
    setActiveAnalyticsTab,
    selectedCourseModal,
    setSelectedCourseModal,
    showCreditsModal,
    setShowCreditsModal,
    showGpaModal,
    setShowGpaModal,
    copiedSummary,
    gpaScaleView,
    setGpaScaleView,
    gpaModeView,
    setGpaModeView,
    semesters,
    filteredSemesters,
    fetchGrades,
    handleSwitchSource,
    handleExportCSV,
    handleCopySummary,
  };
}
