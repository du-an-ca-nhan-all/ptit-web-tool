import { useState, useEffect, useCallback } from 'react';
import {
  saveSessionPriceOverride,
  removeSessionPriceOverride,
  fetchPricingFromBackend,
} from '../../../../config/pricingConfig';
import {
  getStoredEnvelopeAssignments,
  fetchEnvelopeAssignments,
  saveEnvelopeAssignment,
  removeEnvelopeAssignment,
  ENVELOPE_ASSIGNMENTS_CHANGED_EVENT,
  EnvelopeAssignmentsMap,
  SaveEnvelopeOptions,
} from '../../../../config/envelopeAssignmentConfig';

export function useEnvelopeActions() {
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingVersion, setPricingVersion] = useState(0);
  const [envelopeAssignments, setEnvelopeAssignments] = useState<EnvelopeAssignmentsMap>(getStoredEnvelopeAssignments);
  const [loadingClaimId, setLoadingClaimId] = useState<string | null>(null);
  const [assigningSession, setAssigningSession] = useState<any | null>(null);
  const [assigningInitialClass, setAssigningInitialClass] = useState<string>('');
  const [quickEditSession, setQuickEditSession] = useState<any | null>(null);
  const [viewingStudentsSession, setViewingStudentsSession] = useState<any | null>(null);
  const [viewingStudentsClassFilter, setViewingStudentsClassFilter] = useState<string>('ALL');

  const handleOpenRoomStudents = useCallback((session: any, classFilter = 'ALL') => {
    setViewingStudentsSession(session);
    setViewingStudentsClassFilter(classFilter);
  }, []);

  // Load and listen for envelope assignments & pricing updates
  useEffect(() => {
    fetchEnvelopeAssignments().then((res) => {
      if (res) setEnvelopeAssignments(res);
    });
    fetchPricingFromBackend().catch((err) => console.warn("[useEnvelopeActions] Non-fatal async error:", err));

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

  useEffect(() => {
    const handler = () => setPricingVersion((v) => v + 1);
    window.addEventListener('pricing_config_changed', handler);
    return () => window.removeEventListener('pricing_config_changed', handler);
  }, []);

  const handleOpenAssignModal = useCallback((session: any, initialClass?: string) => {
    setAssigningSession(session);
    setAssigningInitialClass(initialClass || session.responsibleClasses[0] || '');
  }, []);

  const handleConfirmAssign = useCallback(
    async (sessionId: string, targetClass: string, options: SaveEnvelopeOptions) => {
      setLoadingClaimId(sessionId);
      try {
        const res = await saveEnvelopeAssignment(sessionId, targetClass, options);
        if (res.success && res.assignments) {
          setEnvelopeAssignments(res.assignments);
        }
        setPricingVersion((v) => v + 1);
      } catch (e) {
        console.error('Error confirming envelope assignment:', e);
      } finally {
        setLoadingClaimId(null);
      }
    },
    []
  );

  const handleSaveQuickPrice = useCallback(
    async (sessionId: string, newPrice: number | null) => {
      setLoadingClaimId(sessionId);
      try {
        const existingAssign = envelopeAssignments[sessionId];
        if (existingAssign) {
          const res = await saveEnvelopeAssignment(sessionId, existingAssign.assignedClass, {
            assistantStudentId: existingAssign.assistantStudentId,
            assistantStudentName: existingAssign.assistantStudentName,
            customPrice: newPrice,
            note: existingAssign.note,
            room: existingAssign.room,
            date: existingAssign.date,
            time: existingAssign.time,
            subjectCode: existingAssign.subjectCode,
            subject: existingAssign.subject,
          });
          if (res.success && res.assignments) {
            setEnvelopeAssignments(res.assignments);
          }
        } else {
          if (newPrice !== null && newPrice > 0) {
            saveSessionPriceOverride(sessionId, newPrice);
          } else {
            removeSessionPriceOverride(sessionId);
          }
        }
        setPricingVersion((v) => v + 1);
        fetchEnvelopeAssignments().then((res) => res && setEnvelopeAssignments(res));
      } catch (e) {
        console.error('Error saving quick price:', e);
      } finally {
        setLoadingClaimId(null);
      }
    },
    [envelopeAssignments]
  );

  const handleCancelClaim = useCallback(async (sessionId: string) => {
    setLoadingClaimId(sessionId);
    try {
      const res = await removeEnvelopeAssignment(sessionId);
      if (res.success && res.assignments) {
        setEnvelopeAssignments(res.assignments);
      }
      setPricingVersion((v) => v + 1);
    } catch (e) {
      console.error('Error cancelling envelope claim:', e);
    } finally {
      setLoadingClaimId(null);
    }
  }, []);

  return {
    isPricingModalOpen,
    setIsPricingModalOpen,
    pricingVersion,
    envelopeAssignments,
    loadingClaimId,
    assigningSession,
    setAssigningSession,
    assigningInitialClass,
    quickEditSession,
    setQuickEditSession,
    viewingStudentsSession,
    setViewingStudentsSession,
    viewingStudentsClassFilter,
    handleOpenRoomStudents,
    handleOpenAssignModal,
    handleConfirmAssign,
    handleSaveQuickPrice,
    handleCancelClaim,
  };
}
