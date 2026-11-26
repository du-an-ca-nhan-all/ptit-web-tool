import { useMemo, useState, useEffect } from 'react';
import { LoginUser, ExamSession, isUserMonitor } from '../../../../types';
import { calculateRoomPrice } from '../../../../config/pricingConfig';
import { getEffectiveResponsibleClass } from '../../../../config/envelopeAssignmentConfig';
import { EnhancedExamSession, EnvelopeFilterStatus } from './types';
import { computeEnvelopeCounts, filterEnvelopeSessions, parseDate } from './utils';
import { useEnvelopeActions } from './useEnvelopeActions';

interface UseAllMonitorsEnvelopesParams {
  sessions: ExamSession[];
  loginUsers: LoginUser[];
  isAdmin?: boolean;
}

export function useAllMonitorsEnvelopes({
  sessions,
  loginUsers,
  isAdmin,
}: UseAllMonitorsEnvelopesParams) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<EnvelopeFilterStatus>('ALL');
  const [filterDate, setFilterDate] = useState<string>('ALL');
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const actions = useEnvelopeActions();
  const { envelopeAssignments, pricingVersion } = actions;

  const currentUser = useMemo(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const userClass = useMemo(() => {
    return currentUser?.lop?.trim() || '';
  }, [currentUser]);

  const effectiveIsAdmin = useMemo(() => {
    if (typeof isAdmin === 'boolean') return isAdmin;
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
      if (!saved) return false;
      const u = JSON.parse(saved);
      return Boolean(u?.isAdmin || u?.role === 'admin' || u?.activeRole === 'admin');
    } catch {
      return false;
    }
  }, [isAdmin]);

  const monitorClasses = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    loginUsers.forEach((u) => {
      if (isUserMonitor(u) && u.lop && u.lop.trim()) {
        set.add(u.lop.trim());
      }
    });
    return set;
  }, [loginUsers]);

  // Compute responsible classes for each session
  const enhancedSessions = useMemo<EnhancedExamSession[]>(() => {
    return sessions.map((session) => {
      const monitoredClassesInRoom = session.classCounts.filter((c) => monitorClasses.has(c.className));
      const { responsibleClass, isClaimedManual, assignmentInfo } = getEffectiveResponsibleClass(
        session,
        monitoredClassesInRoom,
        envelopeAssignments
      );
      const responsibleClasses = responsibleClass ? [responsibleClass] : [];
      return { ...session, responsibleClasses, isClaimedManual, assignmentInfo };
    });
  }, [sessions, monitorClasses, envelopeAssignments]);

  const availableDates = useMemo(() => {
    const datesSet = new Set<string>();
    enhancedSessions.forEach((s) => {
      if (s.date && s.date.trim()) datesSet.add(s.date.trim());
    });
    return Array.from(datesSet).sort((a, b) => parseDate(a) - parseDate(b));
  }, [enhancedSessions]);

  const availableClasses = useMemo(() => {
    const classesSet = new Set<string>();
    enhancedSessions.forEach((s) => {
      s.classCounts?.forEach((c) => {
        if (c.className && c.className.trim()) classesSet.add(c.className.trim());
      });
      s.responsibleClasses?.forEach((rc) => {
        if (rc && rc.trim()) classesSet.add(rc.trim());
      });
    });
    monitorClasses.forEach((c) => classesSet.add(c));
    return Array.from(classesSet).sort((a, b) => a.localeCompare(b));
  }, [enhancedSessions, monitorClasses]);

  const counts = useMemo(
    () => computeEnvelopeCounts(enhancedSessions, userClass),
    [enhancedSessions, userClass]
  );

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus, filterDate, filterClass]);

  const displayedSessions = useMemo(
    () =>
      filterEnvelopeSessions(enhancedSessions, {
        filterStatus,
        filterDate,
        filterClass,
        searchTerm,
        userClass,
      }),
    [enhancedSessions, filterStatus, filterDate, filterClass, searchTerm, userClass]
  );

  const totalPages = Math.max(1, Math.ceil(displayedSessions.length / pageSize));

  const paginatedSessions = useMemo(() => {
    if (pageSize >= 9999) return displayedSessions;
    const start = (page - 1) * pageSize;
    return displayedSessions.slice(start, start + pageSize);
  }, [displayedSessions, page, pageSize]);

  const isFilterActive =
    filterStatus !== 'ALL' || filterDate !== 'ALL' || filterClass !== 'ALL' || searchTerm.trim() !== '';

  const handleResetFilters = () => {
    setFilterStatus('ALL');
    setFilterDate('ALL');
    setFilterClass('ALL');
    setSearchTerm('');
    setPage(1);
  };

  const totalExpectedMoney = useMemo(() => {
    return displayedSessions.reduce(
      (sum, s) =>
        sum +
        calculateRoomPrice({
          subject: s.subject,
          subjectCode: s.subjectCode,
          room: s.room,
          examFormat: s.examFormat,
          sessionKey: s.id,
        }),
      0
    );
  }, [displayedSessions, pricingVersion]);

  const claimedCountInDisplayed = useMemo(() => {
    return displayedSessions.filter((s) => s.isClaimedManual).length;
  }, [displayedSessions]);

  return {
    ...actions,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterDate,
    setFilterDate,
    filterClass,
    setFilterClass,
    page,
    setPage,
    pageSize,
    setPageSize,
    userClass,
    effectiveIsAdmin,
    monitorClasses,
    enhancedSessions,
    availableDates,
    availableClasses,
    counts,
    displayedSessions,
    totalPages,
    paginatedSessions,
    isFilterActive,
    totalExpectedMoney,
    claimedCountInDisplayed,
    handleResetFilters,
  };
}
