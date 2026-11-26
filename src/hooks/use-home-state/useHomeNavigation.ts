'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FilterState } from '../../features/exam-schedule';
import { ExamRecord } from '../../types';
import {
  NavigationTab,
  ProfileSubTab,
  TabChangeOptions,
  getNavigationPath,
} from '../../types/navigation';
import { ADMIN_ONLY_TABS, MONITOR_ONLY_TABS } from './constants';
import {
  FilterMeta,
  ProfileInitialTab,
  SortConfig,
  UseHomeNavigationParams,
} from './types';

export function useHomeNavigation({
  initialState,
  isAdmin,
  canAccessMonitorTools,
  monitorClass,
  setMonitorClass,
  currentUser,
}: UseHomeNavigationParams) {
  // Pagination states
  const [page, setPage] = useState<number>(initialState.page || 1);
  const [pageSize, setPageSize] = useState(25);

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<NavigationTab>(initialState.tab);
  const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>(
    initialState.profileSubTab || 'OVERVIEW'
  );
  const [isMounted, setIsMounted] = useState(false);

  // Filters & Sorting
  const [filters, setFilters] = useState<FilterState>({
    search: initialState.search,
    classCode: initialState.classCode,
    subjectCode: initialState.subjectCode,
    date: initialState.date,
  });
  const [searchInput, setSearchInput] = useState(initialState.search);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: initialState.sortKey,
    direction: initialState.sortDir,
  });
  const [selectedExamRoom, setSelectedExamRoom] = useState<ExamRecord | null>(null);

  const [filterMeta] = useState<FilterMeta>({
    classes: [],
    subjects: [],
    dates: [],
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] =
    useState<ProfileInitialTab>('PROFILE');

  // Reset page to 1 only when filter/sort criteria change after initial mount
  const isFirstFilterChange = useRef(true);
  useEffect(() => {
    if (isFirstFilterChange.current) {
      isFirstFilterChange.current = false;
      return;
    }
    setPage(1);
  }, [filters.search, filters.classCode, filters.subjectCode, filters.date, sortConfig]);

  // Tab change handler
  const handleTabChange = useCallback(
    (
      tab: NavigationTab,
      subTab?: ProfileSubTab,
      options?: TabChangeOptions
    ) => {
      if (ADMIN_ONLY_TABS.includes(tab) && !isAdmin) {
        return;
      }
      if (MONITOR_ONLY_TABS.includes(tab) && !canAccessMonitorTools) {
        return;
      }

      if (tab !== activeTab || options) {
        if (!options?.preserveFilters) {
          const newSearch = options?.search ?? '';
          const newClassCode = options?.classCode ?? '';
          const newSubjectCode = options?.subjectCode ?? '';
          const newDate = options?.date ?? '';
          const newPage = options?.page ?? 1;

          setSearchInput(newSearch);
          setFilters({
            search: newSearch,
            classCode: newClassCode,
            subjectCode: newSubjectCode,
            date: newDate,
          });
          setPage(newPage);
          setSelectedExamRoom(null);
          setSortConfig({ key: 'DateTime', direction: 'asc' });

          if (options?.monitorClass !== undefined) {
            setMonitorClass(options.monitorClass);
          } else if (tab === 'members' || tab === 'monitor') {
            if (!monitorClass && currentUser?.lop) {
              setMonitorClass(currentUser.lop);
            }
          }
        }
      }

      setActiveTab(tab);
      if (tab === 'profile') {
        if (subTab) {
          setProfileSubTab(subTab);
        }
        if (options?.source && typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('source', options.source);
          window.history.replaceState(
            null,
            '',
            url.pathname + (url.search ? url.search : '')
          );
        }
      }
      setIsMobileMenuOpen(false);
    },
    [activeTab, isAdmin, canAccessMonitorTools, monitorClass, currentUser, setMonitorClass]
  );

  // Sync browser URL
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;
    const url = getNavigationPath(activeTab, profileSubTab, {
      search: filters.search,
      classCode: filters.classCode,
      subjectCode: filters.subjectCode,
      date: filters.date,
      monitorClass,
      page,
    });
    if (window.location.pathname + window.location.search !== url) {
      window.history.replaceState(null, '', url);
    }
  }, [activeTab, profileSubTab, filters, monitorClass, page, isMounted]);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    activeTab,
    setActiveTab,
    profileSubTab,
    setProfileSubTab,
    isMounted,
    setIsMounted,
    filters,
    setFilters,
    searchInput,
    setSearchInput,
    sortConfig,
    setSortConfig,
    selectedExamRoom,
    setSelectedExamRoom,
    filterMeta,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isProfileOpen,
    setIsProfileOpen,
    profileInitialTab,
    setProfileInitialTab,
    handleTabChange,
  };
}
