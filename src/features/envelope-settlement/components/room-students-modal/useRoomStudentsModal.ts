import { useEffect, useMemo, useState } from 'react';
import { ExamRecord, ExamSession } from '../../../../types';
import {
  computeClassBreakdown,
  extractRoomRecords,
  filterAndSortStudents,
} from './utils';

interface UseRoomStudentsModalParams {
  isOpen: boolean;
  session: ExamSession | null;
  records: ExamRecord[];
  initialClassFilter: string;
}

export function useRoomStudentsModal({
  isOpen,
  session,
  records,
  initialClassFilter,
}: UseRoomStudentsModalParams) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>(initialClassFilter);
  const [copiedMssv, setCopiedMssv] = useState(false);

  // Sync initialClassFilter when modal opens or session changes
  useEffect(() => {
    if (isOpen) {
      setSelectedClass(initialClassFilter || 'ALL');
      setSearchQuery('');
      setCopiedMssv(false);
    }
  }, [isOpen, session, initialClassFilter]);

  // Extract all students for this room/session
  const roomRecords = useMemo(
    () => extractRoomRecords(session, records),
    [session, records]
  );

  // Class breakdown counts
  const classBreakdown = useMemo(
    () => computeClassBreakdown(roomRecords),
    [roomRecords]
  );

  // Filtered & sorted student list
  const filteredStudents = useMemo(
    () => filterAndSortStudents(roomRecords, selectedClass, searchQuery),
    [roomRecords, selectedClass, searchQuery]
  );

  const handleCopyAllMssv = () => {
    if (filteredStudents.length === 0) return;
    const mssvList = filteredStudents.map((s) => s.MaSV).filter(Boolean).join('\n');
    navigator.clipboard.writeText(mssvList).then(() => {
      setCopiedMssv(true);
      setTimeout(() => setCopiedMssv(false), 2000);
    });
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedClass,
    setSelectedClass,
    copiedMssv,
    roomRecords,
    classBreakdown,
    filteredStudents,
    handleCopyAllMssv,
  };
}
