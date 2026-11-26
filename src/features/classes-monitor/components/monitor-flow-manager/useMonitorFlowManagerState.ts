'use client';

import { useState, useMemo, useEffect } from 'react';
import { LoginUser } from '../../../../types';
import { useMonitorFlow } from '../../hooks/useMonitorFlow';
import { CourseItem, FollowerStudentItem } from '../../server/monitorFlowServerService';
import { CompareFilter, MainSubTab } from './types';

export function useMonitorFlowManagerState(
  currentUser: LoginUser,
  availableClasses: string[],
  initialClassCode?: string
) {
  const defaultClass = initialClassCode || currentUser.lop || availableClasses[0] || '';
  const flow = useMonitorFlow(currentUser, defaultClass);
  const { selectedClass, setSelectedClass, students, monitorData } = flow;

  // Sync with initialClassCode from URL if changed
  useEffect(() => {
    if (initialClassCode && initialClassCode !== selectedClass) {
      setSelectedClass(initialClassCode);
    }
  }, [initialClassCode, setSelectedClass, selectedClass]);

  // Sub-tabs: Default to 'FLOW_CONFIG' (Tab 1)
  const [activeSubTab, setActiveSubTab] = useState<MainSubTab>('FLOW_CONFIG');

  // Matrix Filter
  const [compareFilter, setCompareFilter] = useState<CompareFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Trigger Modal States
  const [showQuickRegisterModal, setShowQuickRegisterModal] = useState(false);
  const [quickTargetIdToHoc, setQuickTargetIdToHoc] = useState('');
  const [quickTargetGroupName, setQuickTargetGroupName] = useState('');

  const [showQuickCancelModal, setShowQuickCancelModal] = useState(false);
  const [cancelTargetIdToHoc, setCancelTargetIdToHoc] = useState('');

  const [showSyncAllModal, setShowSyncAllModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Selected student for single drawer inspection
  const [inspectingStudent, setInspectingStudent] = useState<FollowerStudentItem | null>(null);

  // Statistics
  const activeFollowersCount = useMemo(() => students.filter((s) => s.isEnabled).length, [students]);
  const linkedAccountsCount = useMemo(() => students.filter((s) => s.isExternalConfigured).length, [students]);

  // Monitor's courses
  const monitorCourses: CourseItem[] = useMemo(() => monitorData?.courses || [], [monitorData]);

  // Students who match 100%
  const matched100Count = useMemo(() => {
    if (monitorCourses.length === 0) return 0;
    return students.filter((s) => s.diffSummary?.matchPercent === 100).length;
  }, [students, monitorCourses]);

  // Students who need attention (have flow enabled or linked, but < 100% match)
  const needsAttentionCount = useMemo(() => {
    if (monitorCourses.length === 0) return 0;
    return students.filter((s) => (s.isEnabled || s.isExternalConfigured) && s.diffSummary?.matchPercent < 100).length;
  }, [students, monitorCourses]);

  // Filtered students for ALL Comparison Matrix
  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return students.filter((st) => {
      const matchQuery =
        !query ||
        st.maSV.toLowerCase().includes(query) ||
        st.hoTen.toLowerCase().includes(query) ||
        (st.soDienThoai && st.soDienThoai.includes(query));

      if (!matchQuery) return false;

      if (compareFilter === 'ACTIVE_FLOW') return st.isEnabled;
      if (compareFilter === 'NEEDS_ATTENTION') {
        return (st.isEnabled || st.isExternalConfigured) && st.diffSummary?.matchPercent < 100;
      }
      if (compareFilter === 'MATCHED_100') return st.diffSummary?.matchPercent === 100;
      if (compareFilter === 'NOT_LINKED') return !st.isExternalConfigured;

      return true;
    });
  }, [students, searchQuery, compareFilter]);

  return {
    ...flow,
    activeSubTab,
    setActiveSubTab,
    compareFilter,
    setCompareFilter,
    searchQuery,
    setSearchQuery,
    showQuickRegisterModal,
    setShowQuickRegisterModal,
    quickTargetIdToHoc,
    setQuickTargetIdToHoc,
    quickTargetGroupName,
    setQuickTargetGroupName,
    showQuickCancelModal,
    setShowQuickCancelModal,
    cancelTargetIdToHoc,
    setCancelTargetIdToHoc,
    showSyncAllModal,
    setShowSyncAllModal,
    showImportModal,
    setShowImportModal,
    inspectingStudent,
    setInspectingStudent,
    activeFollowersCount,
    linkedAccountsCount,
    monitorCourses,
    matched100Count,
    needsAttentionCount,
    filteredStudents,
  };
}
