import React, { useState, useMemo } from 'react';
import { ClassMonitorToolsProps, ClassMonitorStats } from './types';
import { buildAnnouncementText, buildRoomDetails, exportClassRecordsToCSV } from './utils';

export function useClassMonitorTools({
  records,
  selectedClass,
  onClassChange,
}: ClassMonitorToolsProps) {
  const [copied, setCopied] = useState(false);

  const classes = useMemo(() => {
    const cls = new Set(records.map((r) => r.MaLop).filter(Boolean));
    return Array.from(cls).sort();
  }, [records]);

  // Set default class if available and selectedClass is empty
  React.useEffect(() => {
    if (!selectedClass && classes.length > 0) {
      onClassChange(classes[0]);
    }
  }, [classes, selectedClass, onClassChange]);

  const classRecords = useMemo(() => {
    return records.filter(r => r.MaLop === selectedClass);
  }, [records, selectedClass]);

  const stats: ClassMonitorStats = useMemo(() => {
    const uniqueStudents = new Set(classRecords.map(r => r.MaSV));
    const uniqueSubjects = new Set(classRecords.map(r => r.MaMH));
    return {
      students: uniqueStudents.size,
      subjects: uniqueSubjects.size,
      totalExams: classRecords.length
    };
  }, [classRecords]);

  const uniqueRooms = useMemo(() => {
    const rooms = new Set(classRecords.map(r => r.MAPTHI).filter(Boolean));
    return Array.from(rooms).sort();
  }, [classRecords]);

  const roomDetails = useMemo(() => {
    return buildRoomDetails(classRecords);
  }, [classRecords]);

  const announcementText = useMemo(() => {
    return buildAnnouncementText(classRecords, selectedClass);
  }, [classRecords, selectedClass]);

  const handleCopy = () => {
    navigator.clipboard.writeText(announcementText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportClassCSV = () => {
    exportClassRecordsToCSV(classRecords, selectedClass);
  };

  return {
    copied,
    classes,
    stats,
    uniqueRooms,
    roomDetails,
    announcementText,
    handleCopy,
    handleExportClassCSV,
  };
}
