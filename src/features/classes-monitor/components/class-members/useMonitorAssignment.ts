import { useMemo, useState } from 'react';
import { LoginUser } from '../../types/class.types';

interface UseMonitorAssignmentParams {
  selectedClass: string;
  activeStudents: any[];
  classMonitor: LoginUser | null;
  showToast: (text: string, type?: 'success' | 'error') => void;
  onReloadMonitors?: () => void;
}

export function useMonitorAssignment({
  selectedClass,
  activeStudents,
  classMonitor,
  showToast,
  onReloadMonitors,
}: UseMonitorAssignmentParams) {
  const [isAssignMonitorModalOpen, setIsAssignMonitorModalOpen] = useState(false);
  const [selectedCandidateMaSV, setSelectedCandidateMaSV] = useState<string>('');
  const [candidateSearchQuery, setCandidateSearchQuery] = useState<string>('');
  const [assignReason, setAssignReason] = useState<string>('');
  const [isSubmittingMonitor, setIsSubmittingMonitor] = useState<boolean>(false);
  const [monitorModalError, setMonitorModalError] = useState<string>('');

  const candidateList = useMemo(() => {
    if (!candidateSearchQuery.trim()) return activeStudents;
    const q = candidateSearchQuery.trim().toLowerCase();
    return activeStudents.filter(
      (s) =>
        s.MaSV.toLowerCase().includes(q) ||
        `${s.HoLotSV} ${s.TenSV}`.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q))
    );
  }, [activeStudents, candidateSearchQuery]);

  const openAssignMonitorModal = (preselectedMaSV?: string | null) => {
    setSelectedCandidateMaSV(preselectedMaSV || '');
    setCandidateSearchQuery('');
    setAssignReason('');
    setMonitorModalError('');
    setIsAssignMonitorModalOpen(true);
  };

  const handleAssignMonitor = async (action: 'ASSIGN' | 'TRANSFER' | 'REMOVE') => {
    if ((action === 'ASSIGN' || action === 'TRANSFER') && !selectedCandidateMaSV) {
      setMonitorModalError('Vui lòng chọn một sinh viên để chỉ định làm Lớp trưởng.');
      return;
    }

    setIsSubmittingMonitor(true);
    setMonitorModalError('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/class-monitors', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action,
          classCode: selectedClass,
          newMonitorMaSV: selectedCandidateMaSV,
          fromMaSV: classMonitor?.username,
          reason: assignReason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Cập nhật Lớp trưởng thành công!');
        setIsAssignMonitorModalOpen(false);
        if (onReloadMonitors) {
          onReloadMonitors();
        }
      } else {
        setMonitorModalError(data.error || 'Có lỗi xảy ra khi cập nhật Lớp trưởng.');
      }
    } catch (err: any) {
      setMonitorModalError('Lỗi kết nối máy chủ khi cập nhật Lớp trưởng.');
    } finally {
      setIsSubmittingMonitor(false);
    }
  };

  return {
    isAssignMonitorModalOpen,
    setIsAssignMonitorModalOpen,
    selectedCandidateMaSV,
    setSelectedCandidateMaSV,
    candidateSearchQuery,
    setCandidateSearchQuery,
    assignReason,
    setAssignReason,
    isSubmittingMonitor,
    monitorModalError,
    candidateList,
    openAssignMonitorModal,
    handleAssignMonitor,
  };
}
