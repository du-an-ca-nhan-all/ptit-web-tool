'use client';

import { useState, useCallback } from 'react';

export function useExternalPortalData() {
  const [courseCompareData, setCourseCompareData] = useState<{
    main: any;
    subAccount: any;
    allSubAccounts?: any[];
  } | null>(null);
  const [isLoadingCourseCompare, setIsLoadingCourseCompare] = useState(false);

  const fetchCourseCompareData = useCallback(async () => {
    try {
      setIsLoadingCourseCompare(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/course-compare', { headers });
      const data = await res.json();
      if (res.ok && data.success) {
        setCourseCompareData(data);
      }
    } catch (err) {
      console.error('Error fetching course compare data:', err);
    } finally {
      setIsLoadingCourseCompare(false);
    }
  }, []);

  return {
    courseCompareData,
    setCourseCompareData,
    isLoadingCourseCompare,
    fetchCourseCompareData,
  };
}
