import { useState, useMemo, useEffect } from 'react';
import { LoginUser } from '../../types/class.types';
import { buildPageNumbers, filterMonitors, isMonitorUser } from './utils';

export function useMonitorsList(users: LoginUser[], currentUser?: LoginUser | null) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(12);

  const isAdmin = Boolean(
    currentUser?.isAdmin ||
    currentUser?.activeRole === 'admin' ||
    (currentUser?.role === 'admin' && !currentUser?.activeRole)
  );

  const monitors = useMemo(() => {
    return users.filter(isMonitorUser);
  }, [users]);

  const filteredMonitors = useMemo(() => {
    return filterMonitors(monitors, searchQuery);
  }, [monitors, searchQuery]);

  // Reset to page 1 on search or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  // Pagination math
  const totalItems = filteredMonitors.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const pagedMonitors = filteredMonitors.slice(startIndex, endIndex);

  // Page numbers with ellipsis
  const pageNumbers = useMemo(() => {
    return buildPageNumbers(totalPages, validPage);
  }, [totalPages, validPage]);

  return {
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    isAdmin,
    monitors,
    filteredMonitors,
    totalItems,
    totalPages,
    validPage,
    startIndex,
    endIndex,
    pagedMonitors,
    pageNumbers,
  };
}
