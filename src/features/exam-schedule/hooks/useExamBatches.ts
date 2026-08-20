'use client';

import { useState, useCallback, useMemo } from 'react';
import { ExamBatchItem } from '../types/exam.types';

export function useExamBatches() {
  const [examBatches, setExamBatches] = useState<ExamBatchItem[]>([]);
  const [activeBatch, setActiveBatch] = useState<ExamBatchItem | null>(null);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);

  const hasActiveBatch = useMemo(
    () => examBatches.some((b) => b.isActive),
    [examBatches]
  );

  const fetchBatches = useCallback(async () => {
    try {
      setIsLoadingBatches(true);
      const res = await fetch('/api/exam-batches');
      const data = await res.json();
      if (res.ok && data.batches) {
        setExamBatches(data.batches);
        const currentActive = data.batches.find((b: ExamBatchItem) => b.isActive);
        if (currentActive) {
          setActiveBatch(currentActive);
        }
      }
    } catch (err) {
      console.error('Error fetching exam batches:', err);
    } finally {
      setIsLoadingBatches(false);
    }
  }, []);

  return {
    examBatches,
    setExamBatches,
    activeBatch,
    setActiveBatch,
    hasActiveBatch,
    isLoadingBatches,
    fetchBatches,
  };
}
