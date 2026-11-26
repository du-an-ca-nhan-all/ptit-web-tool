import React, { useState, useMemo, useEffect } from 'react';
import { isUserMonitor } from '../../../../types';
import { isActiveClassMember } from '../../../../utils/dataModel';
import { SaveEnvelopeOptions } from '../../../../config/envelopeAssignmentConfig';
import { getDefaultRoomPrice } from '../../../../config/pricingConfig';
import { AssignEnvelopeModalProps, AssigneeType, ClassStudentOption } from './types';

type UseAssignEnvelopeFormParams = Pick<
  AssignEnvelopeModalProps,
  'isOpen' | 'onClose' | 'session' | 'initialClass' | 'records' | 'loginUsers' | 'currentAssignment' | 'onConfirm'
>;

export function useAssignEnvelopeForm({
  isOpen,
  onClose,
  session,
  initialClass,
  records = [],
  loginUsers = [],
  currentAssignment,
  onConfirm,
}: UseAssignEnvelopeFormParams) {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [assigneeType, setAssigneeType] = useState<AssigneeType>('MONITOR');
  const [assistantStudentId, setAssistantStudentId] = useState<string>('');
  const [assistantStudentName, setAssistantStudentName] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isCustomPrice, setIsCustomPrice] = useState<boolean>(false);
  const [priceInput, setPriceInput] = useState<string>('600000');

  const defaultPrice = useMemo(() => {
    if (!session) return 600000;
    return getDefaultRoomPrice(
      session.subject || '',
      session.subjectCode || '',
      session.room || '',
      session.examFormat || ''
    );
  }, [session]);

  // Find candidate classes in this room
  const roomClasses = useMemo(() => {
    if (!session) return [];
    return session.classCounts || [];
  }, [session]);

  // Set initial state when modal opens
  useEffect(() => {
    if (!isOpen || !session) return;

    const defaultClass = initialClass || currentAssignment?.assignedClass || roomClasses[0]?.className || '';
    setSelectedClass(defaultClass);

    if (currentAssignment?.assistantStudentId) {
      setAssigneeType('ASSISTANT');
      setAssistantStudentId(currentAssignment.assistantStudentId);
      setAssistantStudentName(currentAssignment.assistantStudentName || '');
    } else {
      setAssigneeType('MONITOR');
      setAssistantStudentId('');
      setAssistantStudentName('');
    }

    // Price initialization
    const currentPrice = currentAssignment?.customPrice ?? defaultPrice;
    const hasCustom =
      currentAssignment?.customPrice !== undefined &&
      currentAssignment?.customPrice !== null &&
      currentAssignment?.customPrice !== defaultPrice;
    setIsCustomPrice(hasCustom);
    setPriceInput(String(currentPrice || defaultPrice));

    setNote(currentAssignment?.note || '');
    setStudentSearch('');
  }, [isOpen, session, initialClass, currentAssignment, roomClasses, defaultPrice]);

  // Get monitor for selected class
  const classMonitor = useMemo(() => {
    if (!selectedClass) return null;
    const cleanCls = selectedClass.trim().toUpperCase();
    return (
      loginUsers.find(
        (u) => isUserMonitor(u) && u.lop && u.lop.trim().toUpperCase() === cleanCls
      ) || null
    );
  }, [selectedClass, loginUsers]);

  // Get all students of selected class (from room records first, then batch records)
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    const cleanCls = selectedClass.trim().toUpperCase();

    // Map of maSV -> full name & room status
    const studentMap = new Map<string, ClassStudentOption>();

    // 1. Students in this current exam room (chỉ lấy SV đang học thuộc quản lý của lớp)
    if (session?.records) {
      session.records.forEach((r) => {
        if (!isActiveClassMember(r)) return;
        if (r.MaLop && r.MaLop.trim().toUpperCase() === cleanCls && r.MaSV) {
          const name = r.HoDem ? `${r.HoDem} ${r.Ten || ''}`.trim() : (r.Ten || r.MaSV);
          studentMap.set(r.MaSV, { maSV: r.MaSV, name, inRoom: true });
        }
      });
    }

    // 2. Other students of this class in the batch (chỉ lấy SV đang học thuộc quản lý của lớp)
    records.forEach((r) => {
      if (!isActiveClassMember(r)) return;
      if (r.MaLop && r.MaLop.trim().toUpperCase() === cleanCls && r.MaSV && !studentMap.has(r.MaSV)) {
        const name = r.HoDem ? `${r.HoDem} ${r.Ten || ''}`.trim() : (r.Ten || r.MaSV);
        studentMap.set(r.MaSV, { maSV: r.MaSV, name, inRoom: false });
      }
    });

    return Array.from(studentMap.values()).sort((a, b) => {
      if (a.inRoom !== b.inRoom) return a.inRoom ? -1 : 1;
      return a.name.localeCompare(b.name, 'vi');
    });
  }, [selectedClass, session, records]);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return classStudents;
    const q = studentSearch.toLowerCase().trim();
    return classStudents.filter(
      (s) => s.name.toLowerCase().includes(q) || s.maSV.toLowerCase().includes(q)
    );
  }, [classStudents, studentSearch]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setPriceInput(raw);
    const num = parseInt(raw, 10);
    setIsCustomPrice(!isNaN(num) && num !== defaultPrice);
  };

  const handleSelectPresetPrice = (amount: number) => {
    setPriceInput(String(amount));
    setIsCustomPrice(amount !== defaultPrice);
  };

  const handleResetDefaultPrice = () => {
    setPriceInput(String(defaultPrice));
    setIsCustomPrice(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selectedClass) return;

    const options: SaveEnvelopeOptions = {
      room: session.room,
      date: session.date,
      time: session.time,
      subjectCode: session.subjectCode,
      subject: session.subject,
      note: note.trim() || undefined,
    };

    if (assigneeType === 'ASSISTANT' && assistantStudentId) {
      options.assistantStudentId = assistantStudentId.trim();
      options.assistantStudentName = assistantStudentName.trim() || undefined;
    } else {
      options.assistantStudentId = undefined;
      options.assistantStudentName = undefined;
    }

    const priceNum = parseInt(priceInput.replace(/\D/g, ''), 10);
    if (isCustomPrice && !isNaN(priceNum) && priceNum !== defaultPrice) {
      options.customPrice = priceNum;
    } else {
      options.customPrice = null;
    }

    await onConfirm(session.id, selectedClass, options);
    onClose();
  };

  const currentPriceVal = parseInt(priceInput.replace(/\D/g, ''), 10) || 0;

  return {
    selectedClass,
    setSelectedClass,
    assigneeType,
    setAssigneeType,
    assistantStudentId,
    setAssistantStudentId,
    assistantStudentName,
    setAssistantStudentName,
    studentSearch,
    setStudentSearch,
    note,
    setNote,
    isCustomPrice,
    defaultPrice,
    roomClasses,
    classMonitor,
    filteredStudents,
    currentPriceVal,
    handlePriceChange,
    handleSelectPresetPrice,
    handleResetDefaultPrice,
    handleSubmit,
  };
}
