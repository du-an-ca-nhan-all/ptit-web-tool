import React, { useMemo, useState } from 'react';
import { ExamRecord } from '../../../../types';
import { EnvelopeAssignmentsMap } from '../../../../config/envelopeAssignmentConfig';
import { DebtDetail } from './types';
import {
  computeActiveDetailCalc,
  computeModalClassCounts,
  computeRoomRecords,
  filterStudentRecords,
} from './utils';

interface UseDetailModalStateParams {
  records: ExamRecord[];
  isStudentExcluded: (sessionId: string, r: ExamRecord) => boolean;
  pricingVersion: number;
  envelopeAssignments: EnvelopeAssignmentsMap;
}

export function useDetailModalState({
  records,
  isStudentExcluded,
  pricingVersion,
  envelopeAssignments,
}: UseDetailModalStateParams) {
  const [selectedDetail, setSelectedDetail] = useState<DebtDetail | null>(null);
  const [showStudentList, setShowStudentList] = useState<boolean>(false);
  const [studentClassFilter, setStudentClassFilter] = useState<string>('ALL');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const studentListRef = React.useRef<HTMLDivElement>(null);

  const handleOpenStudentListForClass = (clsName: string) => {
    setStudentClassFilter(clsName);
    setShowStudentList(true);
    setTimeout(() => {
      studentListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const handleToggleStudentList = () => {
    const nextState = !showStudentList;
    setShowStudentList(nextState);
    if (nextState) {
      setStudentClassFilter('ALL');
      setTimeout(() => {
        studentListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  };

  const handleCloseDetailModal = () => {
    setSelectedDetail(null);
    setShowStudentList(false);
    setStudentClassFilter('ALL');
    setStudentSearchQuery('');
  };

  const currentRoomRecords = useMemo(
    () => computeRoomRecords(selectedDetail, records),
    [selectedDetail, records]
  );

  const filteredStudentRecords = useMemo(
    () => filterStudentRecords(currentRoomRecords, studentClassFilter, studentSearchQuery),
    [currentRoomRecords, studentClassFilter, studentSearchQuery]
  );

  const modalClassCounts = useMemo(
    () => computeModalClassCounts(selectedDetail, currentRoomRecords),
    [selectedDetail, currentRoomRecords]
  );

  // Compute effective class counts for the detail modal (accounting for exclusions)
  const effectiveClassCountsForModal = useMemo(() => {
    if (!selectedDetail) return new Map<string, number>();
    const map = new Map<string, number>();
    currentRoomRecords.forEach((r: ExamRecord) => {
      const isExcluded = isStudentExcluded(selectedDetail.session.id, r);
      if (!isExcluded) {
        const cls = r.MaLop || 'Khác';
        map.set(cls, (map.get(cls) || 0) + 1);
      }
    });
    return map;
  }, [selectedDetail, currentRoomRecords, isStudentExcluded]);

  // Count excluded students for the current session in modal
  const excludedCountForModal = useMemo(() => {
    if (!selectedDetail) return 0;
    return currentRoomRecords.filter((r: ExamRecord) =>
      isStudentExcluded(selectedDetail.session.id, r)
    ).length;
  }, [selectedDetail, currentRoomRecords, isStudentExcluded]);

  // Dynamic live calculation for the modal when students are toggled
  const activeDetailCalc = useMemo(
    () => computeActiveDetailCalc(selectedDetail, effectiveClassCountsForModal),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDetail, effectiveClassCountsForModal, pricingVersion, envelopeAssignments]
  );

  return {
    selectedDetail,
    setSelectedDetail,
    showStudentList,
    studentClassFilter,
    setStudentClassFilter,
    studentSearchQuery,
    setStudentSearchQuery,
    studentListRef,
    handleOpenStudentListForClass,
    handleToggleStudentList,
    handleCloseDetailModal,
    currentRoomRecords,
    filteredStudentRecords,
    modalClassCounts,
    effectiveClassCountsForModal,
    excludedCountForModal,
    activeDetailCalc,
  };
}
