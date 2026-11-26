'use client';

import { useState, useMemo, useEffect } from 'react';
import { ExamRecord, SortKey, SortDirection } from '../../types/exam.types';
import { SortConfig } from './types';
import { sortExamRecords } from './utils';

interface UseDataTableParams {
  records: ExamRecord[];
  propTotalRecords?: number;
  propCurrentPage?: number;
  propTotalPages?: number;
  propItemsPerPage?: number;
  onPageChange?: (page: number) => void;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
}

export function useDataTable({
  records,
  propTotalRecords,
  propCurrentPage,
  propTotalPages,
  propItemsPerPage,
  onPageChange,
  sortConfig,
  onSortChange,
}: UseDataTableParams) {
  const isServerPaginated = Boolean(onPageChange);

  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const localItemsPerPage = propItemsPerPage || 25;

  // Reset page to 1 when records change in local mode
  useEffect(() => {
    if (!isServerPaginated) {
      setLocalCurrentPage(1);
    }
  }, [records, isServerPaginated]);

  const sortedRecords = useMemo(() => {
    if (isServerPaginated) {
      return records;
    }
    return sortExamRecords(records, sortConfig);
  }, [records, sortConfig, isServerPaginated]);

  const activeCurrentPage = isServerPaginated
    ? propCurrentPage || 1
    : localCurrentPage;
  const activeItemsPerPage = propItemsPerPage || (isServerPaginated ? 25 : 20);
  const totalCount = isServerPaginated
    ? propTotalRecords ?? records.length
    : records.length;
  const calculatedTotalPages = Math.max(
    1,
    propTotalPages ?? Math.ceil(totalCount / activeItemsPerPage)
  );

  const startIndex = isServerPaginated
    ? (activeCurrentPage - 1) * activeItemsPerPage
    : (localCurrentPage - 1) * localItemsPerPage;

  const currentRecords = isServerPaginated
    ? sortedRecords
    : sortedRecords.slice(startIndex, startIndex + localItemsPerPage);

  const goToPage = (page: number) => {
    const targetPage = Math.max(1, Math.min(page, calculatedTotalPages));
    if (isServerPaginated && onPageChange) {
      onPageChange(targetPage);
    } else {
      setLocalCurrentPage(targetPage);
    }
  };

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    onSortChange({ key, direction });
  };

  return {
    activeCurrentPage,
    activeItemsPerPage,
    totalCount,
    calculatedTotalPages,
    startIndex,
    currentRecords,
    goToPage,
    handleSort,
  };
}
