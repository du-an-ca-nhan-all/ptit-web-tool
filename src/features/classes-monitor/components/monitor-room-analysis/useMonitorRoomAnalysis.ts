'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { isUserAdmin } from '../../../../types';
import {
  ExamDateTimeSortOrder,
  ReferenceCandidate,
  ReferenceStudentInfo,
  RoomAnalysisRecord,
  RoomCountOperator,
  SplitFilterMode,
  StudentScope,
  analyzeClassRooms,
} from '../../types/roomAnalysis.types';
import { MonitorRoomAnalysisProps, ToastMessage, ViewTab } from './types';
import {
  computeSplitCounts,
  extractDistinctSubjects,
  filterAndSortRecords,
  filterAndSortRooms,
} from './analysisUtils';
import {
  buildRoomsCopyText,
  buildRoomsCsv,
  buildSplitStudentsCopyText,
  buildSplitStudentsCsv,
  downloadCsvFile,
} from './exportUtils';

export function useMonitorRoomAnalysis({
  currentUser,
  availableClasses,
  initialClassCode,
  examBatches,
  activeBatch,
}: MonitorRoomAnalysisProps) {
  const adminMode = isUserAdmin(currentUser);

  const [selectedBatchCode, setSelectedBatchCode] = useState<string>(
    activeBatch?.code || examBatches[0]?.code || ''
  );
  const [selectedClass, setSelectedClass] = useState<string>(
    adminMode
      ? initialClassCode || currentUser.lop || availableClasses[0] || ''
      : currentUser.lop || initialClassCode || availableClasses[0] || ''
  );
  const [selectedRefMaSV, setSelectedRefMaSV] = useState<string>('');

  // API state
  const [records, setRecords] = useState<RoomAnalysisRecord[]>([]);
  const [referenceRecords, setReferenceRecords] = useState<RoomAnalysisRecord[]>([]);
  const [referenceStudent, setReferenceStudent] = useState<ReferenceStudentInfo | null>(null);
  const [candidates, setCandidates] = useState<ReferenceCandidate[]>([]);
  const [reviewRegisteredCount, setReviewRegisteredCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Filters
  const [scope, setScope] = useState<StudentScope>('CLASS');
  const [viewTab, setViewTab] = useState<ViewTab>('SPLIT_STUDENTS');
  const [splitFilter, setSplitFilter] = useState<SplitFilterMode>('ALL_SPLIT');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [roomCountOp, setRoomCountOp] = useState<RoomCountOperator>('ALL');
  const [roomCountN, setRoomCountN] = useState<number>(5);
  const [onlyNonMonitorRooms, setOnlyNonMonitorRooms] = useState<boolean>(false);
  const [hidePostponed, setHidePostponed] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [examTimeSort, setExamTimeSort] = useState<ExamDateTimeSortOrder>('DATE_ASC');

  const toggleExamTimeSort = useCallback(() => {
    setExamTimeSort((prev) => (prev === 'DATE_ASC' ? 'DATE_DESC' : 'DATE_ASC'));
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    if (activeBatch?.code) {
      setSelectedBatchCode(activeBatch.code);
    } else if (!selectedBatchCode && examBatches.length > 0) {
      setSelectedBatchCode(examBatches[0].code);
    }
  }, [activeBatch?.code, examBatches, selectedBatchCode]);

  const fetchAnalysis = useCallback(async () => {
    if (!selectedBatchCode || !selectedClass) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams({
        batchCode: selectedBatchCode,
        classCode: selectedClass,
      });
      if (selectedRefMaSV) {
        params.set('referenceMaSV', selectedRefMaSV);
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`/api/class-monitors/room-analysis?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecords(data.records || []);
        setReferenceRecords(data.referenceRecords || []);
        setReferenceStudent(data.referenceStudent || null);
        setCandidates(data.candidates || []);
        setReviewRegisteredCount(data.reviewRegisteredCount || 0);
      } else {
        setErrorMsg(data.error || 'Không thể tải dữ liệu phân tích phòng thi');
      }
    } catch {
      setErrorMsg('Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedBatchCode, selectedClass, selectedRefMaSV]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const handleClassChange = (nextClass: string) => {
    setSelectedClass(nextClass);
    setSelectedRefMaSV('');
    setSelectedSubject('ALL');
  };

  const { analyzedRecords, analyzedRooms } = useMemo(
    () =>
      analyzeClassRooms({
        allClassRecords: records,
        referenceRecords,
        scope,
        hidePostponed,
      }),
    [records, referenceRecords, scope, hidePostponed]
  );

  const subjects = useMemo(() => extractDistinctSubjects(analyzedRecords), [analyzedRecords]);

  const subjectRecords = useMemo(() => {
    if (selectedSubject === 'ALL') return analyzedRecords;
    return analyzedRecords.filter((r) => r.maMH === selectedSubject);
  }, [analyzedRecords, selectedSubject]);

  const splitCounts = useMemo(() => computeSplitCounts(subjectRecords), [subjectRecords]);

  const filteredRecords = useMemo(
    () =>
      filterAndSortRecords({
        subjectRecords,
        splitFilter,
        roomCountOp,
        roomCountN,
        searchQuery,
        examTimeSort,
      }),
    [subjectRecords, splitFilter, roomCountOp, roomCountN, searchQuery, examTimeSort]
  );

  const filteredRooms = useMemo(
    () =>
      filterAndSortRooms({
        analyzedRooms,
        selectedSubject,
        onlyNonMonitorRooms,
        roomCountOp,
        roomCountN,
        searchQuery,
        examTimeSort,
      }),
    [
      analyzedRooms,
      selectedSubject,
      onlyNonMonitorRooms,
      roomCountOp,
      roomCountN,
      searchQuery,
      examTimeSort,
    ]
  );

  const handleCopyResult = async () => {
    let text = '';

    if (viewTab === 'SPLIT_STUDENTS') {
      if (filteredRecords.length === 0) {
        showToast('Không có dữ liệu sinh viên để sao chép', 'error');
        return;
      }
      text = buildSplitStudentsCopyText({
        selectedClass,
        selectedBatchCode,
        scope,
        referenceStudent,
        filteredRecords,
      });
    } else {
      if (filteredRooms.length === 0) {
        showToast('Không có dữ liệu phòng thi để sao chép', 'error');
        return;
      }
      text = buildRoomsCopyText({
        selectedClass,
        selectedBatchCode,
        scope,
        roomCountOp,
        roomCountN,
        filteredRooms,
      });
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('Đã sao chép kết quả vào bộ nhớ tạm');
      setTimeout(() => setCopied(false), 2400);
    } catch {
      showToast('Trình duyệt không hỗ trợ sao chép tự động', 'error');
    }
  };

  const handleExportCSV = () => {
    if (viewTab === 'SPLIT_STUDENTS') {
      if (filteredRecords.length === 0) {
        showToast('Không có dữ liệu để xuất CSV', 'error');
        return;
      }
      const csv = buildSplitStudentsCsv(filteredRecords);
      downloadCsvFile(csv, `Tach_Phong_${selectedClass}_${selectedBatchCode}_${scope}.csv`);
      showToast(`Đã xuất ${filteredRecords.length} dòng dữ liệu`);
    } else {
      if (filteredRooms.length === 0) {
        showToast('Không có phòng thi nào để xuất CSV', 'error');
        return;
      }
      const csv = buildRoomsCsv(filteredRooms);
      downloadCsvFile(csv, `Loc_Phong_Thi_${selectedClass}_${selectedBatchCode}_${scope}.csv`);
      showToast(`Đã xuất ${filteredRooms.length} phòng thi`);
    }
  };

  return {
    adminMode,
    selectedBatchCode,
    setSelectedBatchCode,
    selectedClass,
    handleClassChange,
    selectedRefMaSV,
    setSelectedRefMaSV,
    referenceStudent,
    candidates,
    reviewRegisteredCount,
    isLoading,
    errorMsg,
    copied,
    toast,
    scope,
    setScope,
    viewTab,
    setViewTab,
    splitFilter,
    setSplitFilter,
    selectedSubject,
    setSelectedSubject,
    roomCountOp,
    setRoomCountOp,
    roomCountN,
    setRoomCountN,
    onlyNonMonitorRooms,
    setOnlyNonMonitorRooms,
    hidePostponed,
    setHidePostponed,
    searchQuery,
    setSearchQuery,
    examTimeSort,
    toggleExamTimeSort,
    fetchAnalysis,
    analyzedRooms,
    subjects,
    splitCounts,
    filteredRecords,
    filteredRooms,
    handleCopyResult,
    handleExportCSV,
  };
}
