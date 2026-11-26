import { useState, useEffect, useMemo } from 'react';
import { LoginUser } from '../../../../types';
import { RegisteredCoursesSubTab, RegistrationSummary, SemesterInfo } from './types';
import { filterRegisteredCourses } from './utils';

interface UseStudentCourseRegistrationParams {
  currentUser: LoginUser;
  initialSubTab: RegisteredCoursesSubTab;
  onReloadCourseCompare?: () => void;
}

export function useStudentCourseRegistration({
  currentUser,
  initialSubTab,
  onReloadCourseCompare,
}: UseStudentCourseRegistrationParams) {
  const [courses, setCourses] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<SemesterInfo[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('CURRENT');
  const [selectedSemesterName, setSelectedSemesterName] = useState<string>('Đợt ĐKMH Hiện Tại');

  const [summary, setSummary] = useState<RegistrationSummary>({
    totalCourses: 0,
    totalCredits: 0,
    tuitionFee: 0,
    lastPulledAt: null,
    hasRegistration: false,
    classCode: currentUser.lop || '',
    externalAccount: {
      isConfigured: false,
      status: 'DISCONNECTED',
      hasToken: false,
      lastSyncAt: null,
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isPulling, setIsPulling] = useState(false);
  const [isBatchPulling, setIsBatchPulling] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<any | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<RegisteredCoursesSubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Feedback notifications
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isAdmin = !!currentUser?.isAdmin;
  const isMonitor = !!currentUser?.isMonitor;

  // 1. Fetch registered courses from database (supports semester filter)
  const fetchRegisteredCourses = async (semParam?: string) => {
    setIsLoading(true);
    try {
      const activeSem = semParam !== undefined ? semParam : selectedSemester;
      const semQuery = activeSem ? `&semester=${encodeURIComponent(activeSem)}` : '';
      const res = await fetch(
        `/api/course-registrations?username=${currentUser.username}&classCode=${currentUser.lop || ''}${semQuery}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setCourses(data.courses || []);
        if (Array.isArray(data.semesters)) {
          setSemesters(data.semesters);
        }
        if (data.selectedSemester !== undefined) {
          setSelectedSemester(String(data.selectedSemester));
        }
        if (data.selectedSemesterName) {
          setSelectedSemesterName(data.selectedSemesterName);
        }
        setSummary({
          totalCourses: data.totalCourses || (data.courses || []).length,
          totalCredits: data.totalCredits || 0,
          tuitionFee: data.tuitionFee || 0,
          lastPulledAt: data.lastPulledAt,
          hasRegistration: data.hasRegistration,
          classCode: data.classCode,
          externalAccount: data.externalAccount || {
            isConfigured: false,
            status: 'DISCONNECTED',
            hasToken: false,
            lastSyncAt: null,
          },
        });
      } else {
        setErrorMsg(data.error || 'Không thể tải dữ liệu môn học đã đăng ký');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegisteredCourses();
  }, [currentUser.username]);

  const handleSemesterChange = (newSem: string) => {
    setSelectedSemester(newSem);
    fetchRegisteredCourses(newSem);
  };

  // 2. Active Pull from QLDTTX portal (pulls current + all past semesters)
  const handlePullFromQLDTTX = async () => {
    setIsPulling(true);
    setErrorMsg('');
    setSuccessMsg('');

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

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        if (Array.isArray(data.semesters)) {
          setSemesters(data.semesters);
        }
        await fetchRegisteredCourses(selectedSemester);
        if (onReloadCourseCompare) onReloadCourseCompare();
        setTimeout(() => setSuccessMsg(''), 6000);
      } else {
        setErrorMsg(data.error || 'Đồng bộ từ cổng QLDTTX thất bại');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setIsPulling(false);
    }
  };

  // 3. Batch Pull for class (Admin / Monitor)
  const handleBatchPullClass = async () => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn đồng bộ toàn bộ môn học và các kỳ cũ từ QLDTTX cho các sinh viên lớp ${currentUser.lop}?`
      )
    ) {
      return;
    }

    setIsBatchPulling(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/course-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BATCH_PULL',
          classCode: currentUser.lop,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        await fetchRegisteredCourses(selectedSemester);
        if (onReloadCourseCompare) onReloadCourseCompare();
        setTimeout(() => setSuccessMsg(''), 7000);
      } else {
        setErrorMsg(data.error || 'Đồng bộ hàng loạt thất bại');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setIsBatchPulling(false);
    }
  };

  // Filtered courses by search query
  const filteredCourses = useMemo(
    () => filterRegisteredCourses(courses, searchQuery),
    [courses, searchQuery]
  );

  return {
    courses,
    semesters,
    selectedSemester,
    selectedSemesterName,
    summary,
    isLoading,
    isPulling,
    isBatchPulling,
    searchQuery,
    setSearchQuery,
    selectedCourseDetail,
    setSelectedCourseDetail,
    activeSubTab,
    setActiveSubTab,
    successMsg,
    setSuccessMsg,
    errorMsg,
    setErrorMsg,
    isAdmin,
    isMonitor,
    filteredCourses,
    fetchRegisteredCourses,
    handleSemesterChange,
    handlePullFromQLDTTX,
    handleBatchPullClass,
  };
}
