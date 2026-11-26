'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExamRecord, ExamSession } from '../../types';
import { buildSessions } from '../../utils/dataModel';
import { TABS_REQUIRING_EXAM_RECORDS } from './constants';
import { UseHomeExamRecordsParams } from './types';

export function useHomeExamRecords({
  activeBatch,
  filters,
  sortConfig,
  activeTab,
  effectiveUser,
  monitorClass,
  page,
  pageSize,
}: UseHomeExamRecordsParams) {
  const [records, setRecords] = useState<ExamRecord[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Load data from API for active batch
  const loadDataFromApi = useCallback(
    async (batchCodeArg?: string) => {
      if (!TABS_REQUIRING_EXAM_RECORDS.includes(activeTab)) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        let currentBatchCode = batchCodeArg;
        if (!currentBatchCode && activeBatch) {
          currentBatchCode = activeBatch.code;
        }

        const params = new URLSearchParams();
        if (currentBatchCode && currentBatchCode !== 'ALL') {
          params.set('batchCode', currentBatchCode);
        }
        if (filters.search) params.set('search', filters.search);
        if (filters.classCode && filters.classCode !== 'ALL') {
          params.set('classCode', filters.classCode);
        }
        if (filters.subjectCode && filters.subjectCode !== 'ALL') {
          params.set('subjectCode', filters.subjectCode);
        }
        if (filters.date && filters.date !== 'ALL') {
          params.set('date', filters.date);
        }

        if (sortConfig?.key) {
          params.set('sortKey', sortConfig.key);
          params.set('sortDir', sortConfig.direction);
        }

        if (activeTab === 'personal_schedule' && effectiveUser?.username) {
          params.set('maSV', effectiveUser.username);
          params.set('includeClassmatesCount', 'true');
        } else if (
          (activeTab === 'members' || activeTab === 'monitor') &&
          monitorClass &&
          monitorClass !== 'ALL'
        ) {
          params.set('classCode', monitorClass);
        }

        const isPagedTab =
          activeTab === 'schedule' || activeTab === 'personal_schedule';
        if (isPagedTab) {
          params.set('page', String(page));
          params.set('limit', String(pageSize));
        } else {
          params.set('all', 'true');
        }

        const res = await fetch(`/api/exam-records?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const rawRecords: ExamRecord[] = data.records || [];
          setRecords(rawRecords);
          setTotalRecords(data.total || rawRecords.length);
          setTotalPages(data.totalPages || 1);
          setSessions(buildSessions(rawRecords));
        }
      } catch (err) {
        console.error('Error loading exam records:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [
      activeBatch,
      filters,
      sortConfig,
      activeTab,
      effectiveUser,
      monitorClass,
      page,
      pageSize,
    ]
  );

  // Toggle postponement
  const handleToggleExamPostpone = useCallback(
    async (record: ExamRecord, newStatus: boolean) => {
      try {
        const token =
          typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const res = await fetch('/api/exam-records', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            id: record.id,
            maSV: record.MaSV,
            maMH: record.MaMH,
            mapThi: record.MAPTHI,
            ngayThi: record.NgayThi,
            gioThi: record.GioThi,
            isPostponed: newStatus,
          }),
        });

        if (res.ok) {
          setRecords((prev) =>
            prev.map((r) => {
              if (
                (record.id && r.id === record.id) ||
                (r.MaSV === record.MaSV &&
                  r.MaMH === record.MaMH &&
                  r.MAPTHI === record.MAPTHI &&
                  r.NgayThi === record.NgayThi &&
                  r.GioThi === record.GioThi)
              ) {
                return { ...r, isPostponed: newStatus };
              }
              return r;
            })
          );
        }
      } catch (err) {
        console.error('Error toggling postponement:', err);
      }
    },
    []
  );

  // Load records when active batch or filters change
  useEffect(() => {
    if (activeBatch && TABS_REQUIRING_EXAM_RECORDS.includes(activeTab)) {
      loadDataFromApi();
    }
  }, [activeBatch, filters, sortConfig, page, pageSize, activeTab, loadDataFromApi]);

  return {
    records,
    setRecords,
    sessions,
    setSessions,
    isLoading,
    setIsLoading,
    totalRecords,
    totalPages,
    loadDataFromApi,
    handleToggleExamPostpone,
  };
}
