import { useMemo, useState, useEffect, useCallback } from 'react';
import { ExamRecord, LoginUser, ExamSession, isUserMonitor } from '../../../../types';
import { fetchPricingFromBackend } from '../../../../config/pricingConfig';
import {
  getStoredEnvelopeAssignments,
  fetchEnvelopeAssignments,
  getEffectiveResponsibleClass,
  ENVELOPE_ASSIGNMENTS_CHANGED_EVENT,
  EnvelopeAssignmentsMap,
} from '../../../../config/envelopeAssignmentConfig';
import { SettlementScope } from './types';
import { computeAvailableClasses, getExclusionKey } from './utils';
import { computeSettlementData } from './settlementCalc';
import { useDetailModalState } from './useDetailModalState';

interface UseSettlementStateParams {
  records: ExamRecord[];
  sessions: ExamSession[];
  loginUsers: LoginUser[];
  onTogglePostpone?: (record: ExamRecord, newStatus: boolean) => Promise<void> | void;
  isAdmin?: boolean;
}

export function useSettlementState({
  records,
  sessions,
  loginUsers,
  onTogglePostpone,
  isAdmin,
}: UseSettlementStateParams) {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [expandedPairs, setExpandedPairs] = useState<Set<string>>(new Set());
  const [excludedOverrides, setExcludedOverrides] = useState<Map<string, boolean>>(new Map());
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingVersion, setPricingVersion] = useState(0);
  const [envelopeAssignments, setEnvelopeAssignments] = useState<EnvelopeAssignmentsMap>(getStoredEnvelopeAssignments);
  const [settlementScope, setSettlementScope] = useState<SettlementScope>('CLAIMED_ONLY');

  // Load and listen for envelope assignments
  useEffect(() => {
    fetchEnvelopeAssignments().then((res) => {
      if (res) setEnvelopeAssignments(res);
    });

    const handler = (e: any) => {
      if (e.detail) {
        setEnvelopeAssignments(e.detail);
      } else {
        setEnvelopeAssignments(getStoredEnvelopeAssignments());
      }
    };

    window.addEventListener(ENVELOPE_ASSIGNMENTS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(ENVELOPE_ASSIGNMENTS_CHANGED_EVENT, handler);
  }, []);

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

  useEffect(() => {
    fetchPricingFromBackend().catch((err) => console.warn("[useSettlementState] Non-fatal async error:", err));
    const handler = () => setPricingVersion((v) => v + 1);
    window.addEventListener('pricing_config_changed', handler);
    return () => window.removeEventListener('pricing_config_changed', handler);
  }, []);

  const getMonitorUser = useCallback((cls: string): LoginUser | null => {
    if (!cls) return null;
    const cleanCls = cls.trim().toUpperCase();
    return (
      loginUsers.find(
        (u) =>
          isUserMonitor(u) &&
          u.lop &&
          u.lop.trim().toUpperCase() === cleanCls
      ) || null
    );
  }, [loginUsers]);

  const getMonitorName = useCallback((cls: string): string => {
    const mon = getMonitorUser(cls);
    if (mon) {
      return mon.fullName || mon.username;
    }
    return 'Chưa cập nhật';
  }, [getMonitorUser]);

  const monitorClasses = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    loginUsers.forEach((u) => {
      if (isUserMonitor(u) && u.lop && u.lop.trim()) {
        set.add(u.lop.trim());
      }
    });
    return set;
  }, [loginUsers]);

  const availableClasses = useMemo(
    () => computeAvailableClasses(monitorClasses, records),
    [monitorClasses, records]
  );

  // Helpers for exclusion
  const isStudentExcluded = useCallback((sessionId: string, r: ExamRecord) => {
    const key = getExclusionKey(sessionId, r.MaSV || '');
    if (excludedOverrides.has(key)) {
      return Boolean(excludedOverrides.get(key));
    }
    return Boolean(r.isPostponed);
  }, [excludedOverrides]);

  const toggleStudentExclusion = async (session: any, r: ExamRecord) => {
    const isExcluded = isStudentExcluded(session.id, r);
    const newExcluded = !isExcluded;
    const key = getExclusionKey(session.id, r.MaSV || '');

    setExcludedOverrides(prev => {
      const next = new Map(prev);
      next.set(key, newExcluded);
      return next;
    });

    if (onTogglePostpone) {
      await onTogglePostpone(r, newExcluded);
    }
  };

  const clearSessionExclusions = (session: any) => {
    setExcludedOverrides(prev => {
      const next = new Map(prev);
      for (const key of Array.from(next.keys())) {
        if (key.startsWith(`${session.id}||`)) next.delete(key);
      }
      return next;
    });
    if (onTogglePostpone && session.records) {
      session.records.forEach((r: ExamRecord) => {
        if (r.isPostponed) {
          onTogglePostpone(r, false);
        }
      });
    }
  };

  useEffect(() => {
    if (selectedClass) return;

    try {
      const saved = localStorage.getItem('currentUser');
      const user = saved ? JSON.parse(saved) : null;
      const userLop = user?.lop?.trim();
      if (userLop && availableClasses.allClasses.includes(userLop)) {
        setSelectedClass(userLop);
        return;
      }
    } catch (e) {
      console.warn(`[useSettlementState] Non-fatal error:`, e);
    }

    if (availableClasses.monClasses.length > 0) {
      setSelectedClass(availableClasses.monClasses[0]);
    } else if (availableClasses.otherClasses.length > 0) {
      setSelectedClass(availableClasses.otherClasses[0]);
    }
  }, [availableClasses, selectedClass]);

  const totalClaimedRoomsAll = useMemo(() => {
    return sessions.filter((s) => {
      const monitoredClassesInRoom = s.classCounts.filter((c) => monitorClasses.has(c.className));
      const { isClaimedManual } = getEffectiveResponsibleClass(s, monitoredClassesInRoom, envelopeAssignments);
      return isClaimedManual;
    }).length;
  }, [sessions, monitorClasses, envelopeAssignments]);

  const data = useMemo(
    () =>
      computeSettlementData({
        sessions,
        selectedClass,
        monitorClasses,
        availableClasses,
        getMonitorName,
        isStudentExcluded,
        envelopeAssignments,
        settlementScope,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      sessions,
      selectedClass,
      monitorClasses,
      availableClasses,
      getMonitorName,
      isStudentExcluded,
      pricingVersion,
      envelopeAssignments,
      settlementScope,
    ]
  );

  const toggleExpand = (partnerClass: string) => {
    setExpandedPairs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(partnerClass)) {
        newSet.delete(partnerClass);
      } else {
        newSet.add(partnerClass);
      }
      return newSet;
    });
  };

  const detailModalState = useDetailModalState({
    records,
    isStudentExcluded,
    pricingVersion,
    envelopeAssignments,
  });

  return {
    selectedClass,
    setSelectedClass,
    expandedPairs,
    isPricingModalOpen,
    setIsPricingModalOpen,
    settlementScope,
    setSettlementScope,
    effectiveIsAdmin,
    getMonitorName,
    monitorClasses,
    availableClasses,
    isStudentExcluded,
    toggleStudentExclusion,
    clearSessionExclusions,
    totalClaimedRoomsAll,
    data,
    toggleExpand,
    ...detailModalState,
  };
}
