import { useState, useEffect } from 'react';
import { CalendarViewMode } from './types';
import { formatIso } from './utils';

export function useTimetableUrlState() {
  // Calendar View Mode: 'MONTH' | 'WEEK' | 'AGENDA'
  const [viewMode, setViewMode] = useState<CalendarViewMode>(() => {
    if (typeof window === 'undefined') return 'MONTH';
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view')?.toUpperCase();
    if (v === 'WEEK' || v === 'AGENDA' || v === 'MONTH') return v;
    return 'MONTH';
  });

  // Active Date (Default: Today or URL query)
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    if (typeof window === 'undefined') return formatIso(new Date());
    const params = new URLSearchParams(window.location.search);
    const d = params.get('date') || params.get('day');
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    return formatIso(new Date());
  });

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (typeof window === 'undefined') return new Date();
    const params = new URLSearchParams(window.location.search);
    const d = params.get('date') || params.get('day');
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>(() => {
    if (typeof window === 'undefined') return 'ALL';
    const params = new URLSearchParams(window.location.search);
    return params.get('subject') || 'ALL';
  });

  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || params.get('search') || '';
  });

  // Sync viewMode, selectedSubjectFilter, selectedDay, searchQuery to URL query params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    let changed = false;

    if (viewMode !== 'MONTH') {
      if (url.searchParams.get('view') !== viewMode.toLowerCase()) {
        url.searchParams.set('view', viewMode.toLowerCase());
        changed = true;
      }
    } else if (url.searchParams.has('view')) {
      url.searchParams.delete('view');
      changed = true;
    }

    if (selectedSubjectFilter !== 'ALL') {
      if (url.searchParams.get('subject') !== selectedSubjectFilter) {
        url.searchParams.set('subject', selectedSubjectFilter);
        changed = true;
      }
    } else if (url.searchParams.has('subject')) {
      url.searchParams.delete('subject');
      changed = true;
    }

    const todayIso = formatIso(new Date());
    if (selectedDay && selectedDay !== todayIso) {
      if (url.searchParams.get('date') !== selectedDay) {
        url.searchParams.set('date', selectedDay);
        changed = true;
      }
    } else if (url.searchParams.has('date')) {
      url.searchParams.delete('date');
      changed = true;
    }

    if (searchQuery) {
      if (url.searchParams.get('q') !== searchQuery) {
        url.searchParams.set('q', searchQuery);
        changed = true;
      }
    } else if (url.searchParams.has('q')) {
      url.searchParams.delete('q');
      changed = true;
    }

    if (changed) {
      window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
    }
  }, [viewMode, selectedSubjectFilter, selectedDay, searchQuery]);

  return {
    viewMode,
    setViewMode,
    selectedDay,
    setSelectedDay,
    currentDate,
    setCurrentDate,
    selectedSubjectFilter,
    setSelectedSubjectFilter,
    searchQuery,
    setSearchQuery,
  };
}
