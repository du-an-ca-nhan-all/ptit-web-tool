import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { ExamRecord, LoginUser } from '../types/exam.types';
import type {
  QldtErrorType,
  QldtViewLayout,
  StatusFilterType,
  SyncFeedback,
  ViewSourceMode,
} from '../types/studentPersonalExam.types';
import type {
  StudentQldtExamItem,
  StudentQldtExamScheduleResult,
} from '@/src/features/external-portal/server/studentExamScheduleServerService';
import {
  buildRoomClassStatsLookup,
  formatSyncDateTime,
  groupExamsByTimeline,
} from '../utils/studentExamScheduleUtils';
import {
  filterAndSortQldtExams,
  readInitialExamUrlState,
  syncExamStateToUrl,
} from '../utils/studentExamScheduleUrl';

const AUTO_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

interface UseStudentPersonalExamStateParams {
  currentUser: LoginUser;
  records: ExamRecord[];
  setSelectedExamRoom: (room: ExamRecord | null) => void;
}

export function useStudentPersonalExamState({
  currentUser,
  records,
  setSelectedExamRoom,
}: UseStudentPersonalExamStateParams) {
  const initial = useMemo(() => readInitialExamUrlState(), []);

  const [viewSourceMode, setViewSourceMode] = useState<ViewSourceMode>(initial.viewSourceMode);
  const [layoutMode, setLayoutMode] = useState<QldtViewLayout>(initial.layoutMode);
  const [qldtData, setQldtData] = useState<StudentQldtExamScheduleResult | null>(null);
  const [isLoadingQldt, setIsLoadingQldt] = useState(true);
  const [isRefreshingQldt, setIsRefreshingQldt] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<number | undefined>(
    initial.selectedSemester
  );
  const [errorType, setErrorType] = useState<QldtErrorType>(null);
  const [syncFeedback, setSyncFeedback] = useState<SyncFeedback | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>(initial.searchQuery);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>(initial.statusFilter);
  const [formatFilter, setFormatFilter] = useState<string>(initial.formatFilter);
  const [tableSortKey, setTableSortKey] = useState<keyof StudentQldtExamItem>(initial.tableSortKey);
  const [tableSortDirection, setTableSortDirection] = useState<'asc' | 'desc'>(
    initial.tableSortDirection
  );

  const [selectedExamModal, setSelectedExamModal] = useState<StudentQldtExamItem | null>(null);
  const [reviewMembersModalRecord, setReviewMembersModalRecord] = useState<ExamRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allStudentFileRecords, setAllStudentFileRecords] = useState<ExamRecord[]>([]);

  const lastFetchTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!currentUser?.username) return;
    let cancelled = false;
    const params = new URLSearchParams({
      maSV: currentUser.username,
      all: 'true',
      includeClassmatesCount: 'true',
    });

    fetch(`/api/exam-records?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.records)) {
          setAllStudentFileRecords(data.records);
        }
      })
      .catch((error) => {
        console.warn('[PersonalExam] Background room classmate enrichment failed:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.username, records]);

  useEffect(() => {
    syncExamStateToUrl({
      viewSourceMode,
      layoutMode,
      statusFilter,
      formatFilter,
      selectedSemester,
      searchQuery,
      tableSortKey,
      tableSortDirection,
    });
  }, [
    viewSourceMode,
    layoutMode,
    statusFilter,
    formatFilter,
    selectedSemester,
    searchQuery,
    tableSortKey,
    tableSortDirection,
  ]);

  const fetchQldtExams = useCallback(async (refresh = false, semesterId?: number) => {
    if (refresh) setIsRefreshingQldt(true);
    else setIsLoadingQldt(true);
    setErrorType(null);

    try {
      const queryParams = new URLSearchParams();
      if (refresh) queryParams.set('refresh', 'true');
      if (semesterId) queryParams.set('semesterId', String(semesterId));

      const res = await fetch(`/api/student/exam-schedule?${queryParams.toString()}`);
      const json = await res.json();
      lastFetchTimeRef.current = Date.now();

      if (res.ok && json.success) {
        setQldtData(json);
        setSelectedSemester(json.semesterId);
        if (refresh) {
          const timeFormatted = formatSyncDateTime(json.lastSyncAt || new Date().toISOString());
          setSyncFeedback({
            type: 'success',
            message: `Đồng bộ thành công lịch thi cá nhân mới nhất từ QLDTTX (lúc ${timeFormatted})!`,
          });
          setTimeout(() => setSyncFeedback(null), 6000);
        }
        return;
      }

      const type = json.errorType || (res.status === 401 ? 'INVALID_CREDENTIALS' : 'SERVER_ERROR');
      setErrorType(type);
      if (json.username) setQldtData(json);
      if (refresh) {
        setSyncFeedback({
          type: 'error',
          message: json.error || 'Đồng bộ từ cổng QLDTTX thất bại.',
        });
      }
    } catch (error) {
      console.error('[PersonalExam] Failed to fetch QLDTTX exam schedule:', error);
      setErrorType('SERVER_ERROR');
      if (refresh) {
        setSyncFeedback({
          type: 'error',
          message: 'Lỗi kết nối máy chủ khi đồng bộ lịch thi từ QLDTTX.',
        });
      }
    } finally {
      setIsLoadingQldt(false);
      setIsRefreshingQldt(false);
    }
  }, []);

  useEffect(() => {
    fetchQldtExams(false, selectedSemester);
  }, [fetchQldtExams, selectedSemester]);

  useEffect(() => {
    const refreshIfStale = () => {
      if (Date.now() - lastFetchTimeRef.current < AUTO_REFRESH_INTERVAL_MS) return;
      lastFetchTimeRef.current = Date.now();
      fetchQldtExams(false, selectedSemester);
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') refreshIfStale();
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    const intervalId = setInterval(refreshIfStale, 60 * 1000);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      clearInterval(intervalId);
    };
  }, [fetchQldtExams, selectedSemester]);

  const handleChangeLayoutMode = (mode: QldtViewLayout) => {
    setLayoutMode(mode);
    try {
      localStorage.setItem('qldt_exam_layout_mode', mode);
    } catch (error) {
      console.warn('[PersonalExam] Failed to persist layout mode:', error);
    }
  };

  const handleOpenRoomMembersFromQldt = (matchedRecord: ExamRecord) => {
    setSelectedExamModal(null);
    setSelectedExamRoom(matchedRecord);
    setViewSourceMode('FILE_TONG');
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSortTable = (key: keyof StudentQldtExamItem) => {
    if (tableSortKey === key) {
      setTableSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setTableSortKey(key);
    setTableSortDirection('asc');
  };

  const roomClassStatsLookup = useMemo(
    () => buildRoomClassStatsLookup(records, allStudentFileRecords),
    [records, allStudentFileRecords]
  );

  const distinctFormats = useMemo(() => {
    if (!qldtData?.exams) return [];
    const formatSet = new Set<string>();
    qldtData.exams.forEach((ex) => {
      if (ex.hinhThucThi) formatSet.add(ex.hinhThucThi);
    });
    return Array.from(formatSet);
  }, [qldtData]);

  const filteredQldtExams = useMemo(() => {
    if (!qldtData || !Array.isArray(qldtData.exams)) return [];
    return filterAndSortQldtExams({
      exams: qldtData.exams,
      searchQuery,
      statusFilter,
      formatFilter,
      tableSortKey,
      tableSortDirection,
    });
  }, [qldtData, searchQuery, statusFilter, formatFilter, tableSortKey, tableSortDirection]);

  const timelineGroups = useMemo(
    () => groupExamsByTimeline(filteredQldtExams),
    [filteredQldtExams]
  );

  return {
    viewSourceMode,
    setViewSourceMode,
    layoutMode,
    handleChangeLayoutMode,
    qldtData,
    isLoadingQldt,
    isRefreshingQldt,
    selectedSemester,
    setSelectedSemester,
    errorType,
    syncFeedback,
    setSyncFeedback,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    formatFilter,
    setFormatFilter,
    tableSortKey,
    handleSortTable,
    selectedExamModal,
    setSelectedExamModal,
    reviewMembersModalRecord,
    setReviewMembersModalRecord,
    copiedId,
    handleCopyText,
    fetchQldtExams,
    roomClassStatsLookup,
    handleOpenRoomMembersFromQldt,
    distinctFormats,
    filteredQldtExams,
    timelineGroups,
  };
}
