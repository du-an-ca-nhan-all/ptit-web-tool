import { useState, useEffect, useMemo } from 'react';
import { LmsCourseOverviewItem, LmsDashboardOverview } from '../../server/lmsServerService';
import { ActiveCourseDetails, LmsSortBy, LmsStatusFilter } from './types';
import { computeFilterCounts, extractSemestersList, filterAndSortCourses } from './utils';

export function useLmsCourses() {
  const [data, setData] = useState<LmsDashboardOverview | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LmsStatusFilter>('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [sortBy, setSortBy] = useState<LmsSortBy>('PROGRESS_ASC');

  // Course Details Modal
  const [activeCourseDetails, setActiveCourseDetails] = useState<ActiveCourseDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchLmsCourses = async (forceRefresh: boolean = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMsg('');

    try {
      const url = forceRefresh ? '/api/lms/courses?refresh=true' : '/api/lms/courses';
      const res = await fetch(url);
      const json = await res.json();

      if (res.ok && json.isConfigured !== false) {
        setIsConfigured(true);
        setData(json);
        if (forceRefresh) {
          if (json.syncWarning) {
            setErrorMsg(json.syncWarning);
          } else {
            setSuccessMsg('Đã cập nhật dữ liệu mới nhất từ LMS thành công!');
            setTimeout(() => setSuccessMsg(''), 4000);
          }
        }
      } else if (json.isConfigured === false) {
        setIsConfigured(false);
      } else {
        setErrorMsg(json.error || 'Không thể tải dữ liệu khóa học từ LMS');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ khi tải dữ liệu LMS');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLmsCourses(false);
  }, []);

  // Fetch course activities modal
  const handleOpenCourseDetails = async (course: LmsCourseOverviewItem) => {
    setIsLoadingDetails(true);
    try {
      const res = await fetch('/api/lms/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'COURSE_ACTIVITIES', courseId: course.id }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setActiveCourseDetails({
          course,
          sections: json.sections || [],
          totalActivities: json.totalActivities || 0,
        });
      } else {
        alert(json.error || 'Không thể lấy chi tiết hoạt động môn học');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Distinct semesters list
  const semestersList = useMemo(() => extractSemestersList(data?.courses), [data?.courses]);

  // Counts for status filters
  const filterCounts = useMemo(() => computeFilterCounts(data?.courses), [data?.courses]);

  // Filtered & Sorted courses
  const filteredCourses = useMemo(
    () => filterAndSortCourses(data?.courses, searchQuery, statusFilter, selectedSemester, sortBy),
    [data?.courses, searchQuery, statusFilter, selectedSemester, sortBy]
  );

  return {
    data,
    isConfigured,
    isLoading,
    isRefreshing,
    errorMsg,
    setErrorMsg,
    successMsg,
    setSuccessMsg,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedSemester,
    setSelectedSemester,
    sortBy,
    setSortBy,
    activeCourseDetails,
    setActiveCourseDetails,
    isLoadingDetails,
    fetchLmsCourses,
    handleOpenCourseDetails,
    semestersList,
    filterCounts,
    filteredCourses,
  };
}
