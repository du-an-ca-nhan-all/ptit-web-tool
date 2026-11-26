import { useMemo, useState, useEffect, useCallback } from 'react';
import { ExamRecord, LoginUser } from '../../types/class.types';
import { ActiveTab, GenderFilter, ToastMessage } from './types';
import { calculateClassStats, exportClassMembersCsv, filterStudents } from './utils';

interface UseClassMembersDataParams {
  records: ExamRecord[];
  selectedClass: string;
  onClassChange: (cls: string) => void;
  currentUser?: LoginUser | null;
  loginUsers: LoginUser[];
  hasExamSchedule: boolean;
}

export function useClassMembersData({
  records,
  selectedClass,
  onClassChange,
  currentUser,
  loginUsers,
  hasExamSchedule,
}: UseClassMembersDataParams) {
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('ALL');
  const [activeTab, setActiveTab] = useState<ActiveTab>('ACTIVE');
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

  // Database students & excluded students
  const [activeStudents, setActiveStudents] = useState<any[]>([]);
  const [excludedStudents, setExcludedStudents] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const [allSystemClasses, setAllSystemClasses] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/exam-records?distinct=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.classes && Array.isArray(data.classes)) {
          setAllSystemClasses(data.classes);
        }
      })
      .catch(() => {});
  }, []);

  // Available classes in dataset
  const classes = useMemo(() => {
    const set = new Set<string>();
    allSystemClasses.forEach((c) => c && set.add(c));
    loginUsers.forEach((u) => u.lop && set.add(u.lop));
    records.forEach((r) => r.MaLop && set.add(r.MaLop));
    if (currentUser?.lop) set.add(currentUser.lop);
    if (selectedClass) set.add(selectedClass);
    return Array.from(set).filter(Boolean).sort();
  }, [allSystemClasses, loginUsers, records, currentUser?.lop, selectedClass]);

  // Load students from database API when selectedClass changes
  const fetchClassMembers = useCallback(async () => {
    if (!selectedClass) return;
    setIsLoadingList(true);
    try {
      const res = await fetch(`/api/class-members?classCode=${encodeURIComponent(selectedClass)}`);
      if (res.ok) {
        const data = await res.json();
        setActiveStudents(data.students || []);
        setExcludedStudents(data.excludedStudents || []);
      }
    } catch (err) {
      console.error('Failed to fetch class members:', err);
    } finally {
      setIsLoadingList(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    fetchClassMembers();
  }, [fetchClassMembers]);

  // Set default class only if current selected is empty
  useEffect(() => {
    if (!selectedClass) {
      const userClass = currentUser?.lop;
      if (userClass) {
        onClassChange(userClass);
      } else if (classes.length > 0) {
        onClassChange(classes[0]);
      }
    }
  }, [classes, selectedClass, currentUser, onClassChange]);

  const isAdmin = Boolean(
    currentUser?.isAdmin ||
      currentUser?.activeRole === 'admin' ||
      (currentUser?.role === 'admin' && !currentUser?.activeRole)
  );

  // Class monitor for the current selected class
  const classMonitor = useMemo(() => {
    return (
      loginUsers.find(
        (u) =>
          u.lop === selectedClass &&
          (u.role === 'lop_truong' || (u.role && u.role.includes('lop_truong')) || u.isMonitor)
      ) || null
    );
  }, [loginUsers, selectedClass]);

  const userOwnClass = currentUser?.lop;
  const isMyClass = Boolean(userOwnClass && userOwnClass === selectedClass);
  const canManageClass = isAdmin || (!!currentUser?.isMonitor && isMyClass);

  // Filtered active & excluded lists
  const currentList = activeTab === 'ACTIVE' ? activeStudents : excludedStudents;

  const filteredStudents = useMemo(
    () => filterStudents(currentList, search, genderFilter),
    [currentList, search, genderFilter]
  );

  // Stats calculation
  const stats = useMemo(() => calculateClassStats(activeStudents), [activeStudents]);

  // Export CSV
  const handleExportCSV = () => {
    exportClassMembersCsv({ filteredStudents, activeTab, selectedClass, hasExamSchedule });
  };

  return {
    search,
    setSearch,
    genderFilter,
    setGenderFilter,
    activeTab,
    setActiveTab,
    toastMessage,
    showToast,
    activeStudents,
    excludedStudents,
    isLoadingList,
    classes,
    fetchClassMembers,
    isAdmin,
    classMonitor,
    userOwnClass,
    isMyClass,
    canManageClass,
    filteredStudents,
    stats,
    handleExportCSV,
  };
}
