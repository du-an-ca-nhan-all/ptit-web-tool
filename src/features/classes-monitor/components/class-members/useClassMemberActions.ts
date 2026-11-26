import React, { useState, useEffect } from 'react';
import { ExcludeType, ResetPasswordStudent, StudentContactFormData } from './types';

interface UseClassMemberActionsParams {
  selectedClass: string;
  classes: string[];
  fetchClassMembers: () => Promise<void>;
  showToast: (text: string, type?: 'success' | 'error') => void;
}

export function useClassMemberActions({
  selectedClass,
  classes,
  fetchClassMembers,
  showToast,
}: UseClassMemberActionsParams) {
  // Selected student for detail/schedule viewing
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);

  // Edit modal state
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [formData, setFormData] = useState<StudentContactFormData>({
    phone: '',
    note: '',
  });

  // Receive Transfer Student Modal
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchGlobalQuery, setSearchGlobalQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [receiveReason, setReceiveReason] = useState('');
  const [selectedStudentToReceive, setSelectedStudentToReceive] = useState<any | null>(null);

  // Exclude / Transfer Status Modal
  const [studentToExclude, setStudentToExclude] = useState<any | null>(null);
  const [excludeType, setExcludeType] = useState<ExcludeType>('BAO_LUU');
  const [excludeTargetClass, setExcludeTargetClass] = useState('');
  const [excludeReason, setExcludeReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Admin Reset Password Modal state
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordStudent, setResetPasswordStudent] = useState<ResetPasswordStudent>({
    username: '',
    fullName: '',
    lop: '',
  });

  // Search Global Student database
  useEffect(() => {
    if (!searchGlobalQuery.trim() || searchGlobalQuery.trim().length < 2) {
      setGlobalSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingGlobal(true);
      try {
        const res = await fetch(`/api/students/search?q=${encodeURIComponent(searchGlobalQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setGlobalSearchResults(data.students || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchGlobalQuery]);

  const openReceiveModal = () => {
    setIsReceiveModalOpen(true);
    setSearchGlobalQuery('');
    setGlobalSearchResults([]);
    setSelectedStudentToReceive(null);
  };

  const openEditStudentModal = (student: any) => {
    setFormData({
      phone: student.phone || '',
      note: student.note || '',
    });
    setEditingStudent(student);
  };

  const openExcludeModal = (student: any) => {
    setStudentToExclude(student);
    setExcludeType('BAO_LUU');
    setExcludeReason('');
    setExcludeTargetClass(classes.find((c) => c !== selectedClass) || '');
  };

  const openResetPasswordModal = (student: any) => {
    setResetPasswordStudent({
      username: student.MaSV,
      fullName: `${student.HoLotSV || ''} ${student.TenSV || ''}`.trim(),
      lop: selectedClass,
    });
    setIsResetPasswordModalOpen(true);
  };

  // Handle Receive Student
  const handleConfirmReceiveStudent = async (student: any) => {
    setIsProcessingAction(true);
    try {
      const res = await fetch('/api/class-members/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECEIVE',
          maSV: student.maSV || student.MaSV,
          targetClass: selectedClass,
          currentClass: student.maLop || student.MaLop,
          reason: receiveReason,
          studentInfo: student,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Đã tiếp nhận sinh viên thành công!');
        setIsReceiveModalOpen(false);
        setSearchGlobalQuery('');
        setReceiveReason('');
        setSelectedStudentToReceive(null);
        fetchClassMembers();
      } else {
        showToast(data.error || 'Lỗi khi tiếp nhận sinh viên', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Exclude / Status Change
  const handleConfirmExclude = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToExclude) return;

    setIsProcessingAction(true);
    try {
      const res = await fetch('/api/class-members/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EXCLUDE',
          maSV: studentToExclude.MaSV,
          currentClass: selectedClass,
          type: excludeType,
          targetClass: excludeType === 'CHUYEN_LOP' ? excludeTargetClass : undefined,
          reason: excludeReason,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Đã cập nhật trạng thái sinh viên thành công!');
        setStudentToExclude(null);
        setExcludeReason('');
        fetchClassMembers();
      } else {
        showToast(data.error || 'Lỗi khi xử lý', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Restore Student
  const handleRestoreStudent = async (student: any) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn khôi phục sinh viên ${student.MaSV} (${student.HoTen}) quay lại danh sách lớp ${selectedClass}?`
      )
    )
      return;

    setIsProcessingAction(true);
    try {
      const res = await fetch('/api/class-members/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESTORE',
          maSV: student.MaSV,
          targetClass: selectedClass,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Đã khôi phục sinh viên thành công!');
        fetchClassMembers();
      } else {
        showToast(data.error || 'Lỗi khi khôi phục', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Save Note / Phone Edit
  const handleSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      const res = await fetch('/api/class-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          MaSV: editingStudent.MaSV,
          MaLop: selectedClass,
          phone: formData.phone,
          note: formData.note,
        }),
      });

      if (res.ok) {
        showToast('Đã lưu thông tin liên hệ thành công!');
        setEditingStudent(null);
        fetchClassMembers();
      }
    } catch (err) {
      showToast('Không thể lưu thông tin', 'error');
    }
  };

  return {
    selectedStudentDetail,
    setSelectedStudentDetail,
    editingStudent,
    setEditingStudent,
    formData,
    setFormData,
    isReceiveModalOpen,
    setIsReceiveModalOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    searchGlobalQuery,
    setSearchGlobalQuery,
    globalSearchResults,
    isSearchingGlobal,
    receiveReason,
    setReceiveReason,
    selectedStudentToReceive,
    setSelectedStudentToReceive,
    studentToExclude,
    setStudentToExclude,
    excludeType,
    setExcludeType,
    excludeTargetClass,
    setExcludeTargetClass,
    excludeReason,
    setExcludeReason,
    isProcessingAction,
    isResetPasswordModalOpen,
    setIsResetPasswordModalOpen,
    resetPasswordStudent,
    openReceiveModal,
    openEditStudentModal,
    openExcludeModal,
    openResetPasswordModal,
    handleConfirmReceiveStudent,
    handleConfirmExclude,
    handleRestoreStudent,
    handleSaveStudentEdit,
  };
}
