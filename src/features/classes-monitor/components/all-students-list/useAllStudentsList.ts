import { useState, useEffect, useCallback } from 'react';
import { LoginUser } from '../../types/class.types';
import { ClassSummary, ResetTarget, StudentItem } from './types';

export function useAllStudentsList(currentUser?: LoginUser | null) {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classesList, setClassesList] = useState<ClassSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Admin Reset Password Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<ResetTarget>({
    username: '',
    fullName: '',
    lop: '',
  });

  const isAdmin = Boolean(
    currentUser?.isAdmin ||
    currentUser?.activeRole === 'admin' ||
    (currentUser?.role === 'admin' && !currentUser?.activeRole)
  );

  // Fetch Students API
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', String(pageSize));
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedClass !== 'ALL') params.set('classCode', selectedClass);
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/students?${params.toString()}`, { headers });
      const data = await res.json();

      if (res.ok && data.success) {
        setStudents(data.students || []);
        if (data.classes) setClassesList(data.classes);
        if (data.pagination) {
          setTotalStudents(data.pagination.total || 0);
          setTotalPages(data.pagination.totalPages || 1);
        }
      } else {
        setErrorMsg(data.error || 'Không thể tải danh sách sinh viên.');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ khi tải danh sách sinh viên.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, selectedClass, selectedStatus]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Reset page when search or filters change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleClassChange = (val: string) => {
    setSelectedClass(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const openResetModal = (target: ResetTarget = { username: '', fullName: '', lop: '' }) => {
    setResetTarget(target);
    setIsResetModalOpen(true);
  };

  const closeResetModal = () => {
    setIsResetModalOpen(false);
  };

  return {
    students,
    classesList,
    isLoading,
    errorMsg,
    searchQuery,
    selectedClass,
    selectedStatus,
    currentPage,
    setCurrentPage,
    pageSize,
    totalStudents,
    totalPages,
    isResetModalOpen,
    resetTarget,
    isAdmin,
    fetchStudents,
    handleSearchChange,
    handleClassChange,
    handleStatusChange,
    handlePageSizeChange,
    openResetModal,
    closeResetModal,
  };
}
