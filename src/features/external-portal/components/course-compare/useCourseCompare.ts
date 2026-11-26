import { useEffect, useMemo, useState } from 'react';
import { LoginUser } from '../../../../types';
import { CourseCompareData, SelectedCourseInfo } from './types';
import {
  computeCourseComparison,
  computePopupStats,
  extractAvailableSemesters,
  extractCoursesFromAccount,
} from './utils';

interface UseCourseCompareParams {
  initialData: CourseCompareData | null;
  currentUser?: LoginUser | null;
  onNavigateTab?: (tab: string, subTab?: string) => void;
  onReload?: () => void;
  onSubTabChange?: (tab: 'COURSES' | 'COMPARE') => void;
}

export function useCourseCompare({
  initialData,
  currentUser,
  onNavigateTab,
  onReload,
  onSubTabChange,
}: UseCourseCompareParams) {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [selectedSemester, setSelectedSemester] = useState<string>('CURRENT');

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setIsLoading(false);
      if (initialData.selectedSemester) {
        setSelectedSemester(initialData.selectedSemester);
      }
    }
  }, [initialData]);

  const loadCompareData = async (semParam?: string) => {
    setIsLoading(true);
    const classCode = currentUser?.lop || 'D25TXCN11-K';
    const username = currentUser?.username || '';
    const activeSem = semParam !== undefined ? semParam : selectedSemester;
    const semQuery = activeSem ? `&semester=${encodeURIComponent(activeSem)}` : '';
    try {
      const res = await fetch(
        `/api/course-compare?classCode=${encodeURIComponent(classCode)}${username ? `&username=${encodeURIComponent(username)}` : ''}${semQuery}`
      );
      const json = await res.json();
      if (json && json.hasData) {
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load course compare data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompareData();
  }, [currentUser]);

  const [selectedStudentUsername, setSelectedStudentUsername] = useState<string>(
    currentUser?.username?.toUpperCase() || initialData?.subAccount?.username?.toUpperCase() || ''
  );

  useEffect(() => {
    if (currentUser?.username) {
      setSelectedStudentUsername(currentUser.username.toUpperCase());
    } else if (data?.subAccount?.username) {
      setSelectedStudentUsername(data.subAccount.username.toUpperCase());
    }
  }, [currentUser?.username, data?.subAccount?.username]);

  const [selectedCourse, setSelectedCourse] = useState<SelectedCourseInfo | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullMsg, setPullMsg] = useState('');

  // Handle direct pull from QLDTTX for current student (including past semesters)
  const handlePullMyCourses = async () => {
    if (!currentUser) return;
    setIsPulling(true);
    setPullMsg('');
    try {
      const res = await fetch('/api/course-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PULL',
          targetUsername: currentUser.username,
          classCode: currentUser.lop,
        }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setPullMsg('Đã đồng bộ toàn bộ môn học và các kỳ cũ thành công!');
        await loadCompareData(selectedSemester);
        if (onReload) onReload();
        setTimeout(() => setPullMsg(''), 5000);
      } else {
        alert(resData.error || 'Đồng bộ thất bại. Vui lòng kiểm tra lại tài khoản liên kết QLDTTX.');
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsPulling(false);
    }
  };

  const activeSubAccount = useMemo(() => {
    if (!data?.allSubAccounts || data.allSubAccounts.length === 0) return data?.subAccount || null;
    if (!selectedStudentUsername) return data?.subAccount || data.allSubAccounts[0] || null;
    return (
      data.allSubAccounts.find(
        (acc: any) => (acc.username || '').toUpperCase() === selectedStudentUsername.toUpperCase()
      ) ||
      data.subAccount ||
      null
    );
  }, [data, selectedStudentUsername]);

  const availableSemesters = useMemo(
    () => extractAvailableSemesters(data, activeSubAccount),
    [data, activeSubAccount]
  );

  const monitorCourses = useMemo(
    () => extractCoursesFromAccount(data?.main, selectedSemester),
    [data, selectedSemester]
  );

  const myCourses = useMemo(
    () => extractCoursesFromAccount(activeSubAccount, selectedSemester),
    [activeSubAccount, selectedSemester]
  );

  const hasMonitorData = monitorCourses.length > 0 && !!data?.main;
  const isCurrentUserMonitor = !!currentUser?.isMonitor || !!currentUser?.isAdmin;

  const popupStats = useMemo(
    () => computePopupStats(selectedCourse, data, selectedSemester),
    [selectedCourse, data, selectedSemester]
  );

  const comparison = useMemo(
    () => computeCourseComparison(monitorCourses, myCourses),
    [monitorCourses, myCourses]
  );

  const currentStudentName =
    activeSubAccount?.username?.toUpperCase() || currentUser?.username?.toUpperCase() || 'Bạn';

  const handleGoToMyCourses = () => {
    if (onSubTabChange) {
      onSubTabChange('COURSES');
    } else if (onNavigateTab) {
      onNavigateTab('registered_courses');
    }
  };

  return {
    data,
    isLoading,
    selectedSemester,
    setSelectedSemester,
    loadCompareData,
    selectedStudentUsername,
    setSelectedStudentUsername,
    selectedCourse,
    setSelectedCourse,
    isPulling,
    pullMsg,
    handlePullMyCourses,
    availableSemesters,
    hasMonitorData,
    isCurrentUserMonitor,
    popupStats,
    comparison,
    currentStudentName,
    handleGoToMyCourses,
  };
}
