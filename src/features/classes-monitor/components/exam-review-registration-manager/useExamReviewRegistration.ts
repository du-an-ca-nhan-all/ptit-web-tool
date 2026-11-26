'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ExamReviewRegistrationManagerProps,
  FilterMode,
  QuickImportMode,
  ReviewStudentItem,
  ToastMessage,
} from './types';
import {
  buildRegisteredClipboardText,
  buildReviewCsvContent,
  computeReviewSummary,
  filterReviewStudents,
  parseQuickImportTokens,
  triggerCsvDownload,
} from './utils';
import {
  fetchReviewRegistrations,
  postBulkReviewRegistrations,
  postToggleStudentReview,
} from './api';

export function useExamReviewRegistration({
  currentUser,
  availableClasses,
  initialClassCode,
  examBatches,
  activeBatch,
}: ExamReviewRegistrationManagerProps) {
  const [selectedBatchCode, setSelectedBatchCode] = useState<string>(
    activeBatch?.code || examBatches[0]?.code || ''
  );
  const selectedClass = currentUser.lop || initialClassCode || availableClasses[0] || '';

  const [students, setStudents] = useState<ReviewStudentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBulkSaving, setIsBulkSaving] = useState<boolean>(false);
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const [filterMode, setFilterMode] = useState<FilterMode>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedList, setCopiedList] = useState<boolean>(false);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const [isQuickImportOpen, setIsQuickImportOpen] = useState<boolean>(false);
  const [quickImportText, setQuickImportText] = useState<string>('');
  const [quickImportMode, setQuickImportMode] = useState<QuickImportMode>('MERGE');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (activeBatch?.code) {
      setSelectedBatchCode(activeBatch.code);
    } else if (!selectedBatchCode && examBatches.length > 0) {
      setSelectedBatchCode(examBatches[0].code);
    }
  }, [activeBatch?.code, examBatches, selectedBatchCode]);

  const selectedBatchInfo = useMemo(() => {
    return (
      examBatches.find((b) => b.code === selectedBatchCode) ||
      (activeBatch?.code === selectedBatchCode ? activeBatch : null)
    );
  }, [examBatches, selectedBatchCode, activeBatch]);

  const fetchReviewList = useCallback(async () => {
    if (!selectedBatchCode || !selectedClass) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await fetchReviewRegistrations(selectedBatchCode, selectedClass);
      if (data.ok && data.success) {
        const list = data.students || [];
        setStudents(list);
        const drafts: Record<string, string> = {};
        for (const s of list) {
          drafts[s.maSV] = s.note || '';
        }
        setNoteDrafts(drafts);
      } else {
        setErrorMsg(data.error || 'Không thể tải danh sách đăng ký ôn tập');
      }
    } catch {
      setErrorMsg('Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedBatchCode, selectedClass]);

  useEffect(() => {
    fetchReviewList();
  }, [fetchReviewList]);

  const summary = useMemo(() => computeReviewSummary(students), [students]);

  const filteredStudents = useMemo(
    () => filterReviewStudents(students, filterMode, searchQuery),
    [students, filterMode, searchQuery]
  );

  const handleToggleStudent = async (student: ReviewStudentItem) => {
    const nextStatus = !student.isRegistered;
    setSavingStudentId(student.maSV);
    setStudents((prev) =>
      prev.map((s) => (s.maSV === student.maSV ? { ...s, isRegistered: nextStatus } : s))
    );

    try {
      const data = await postToggleStudentReview({
        batchCode: selectedBatchCode,
        classCode: selectedClass,
        maSV: student.maSV,
        isRegistered: nextStatus,
      });
      if (!data.ok || !data.success) {
        setStudents((prev) =>
          prev.map((s) =>
            s.maSV === student.maSV ? { ...s, isRegistered: student.isRegistered } : s
          )
        );
        showToast(data.error || 'Không thể cập nhật trạng thái', 'error');
      }
    } catch {
      setStudents((prev) =>
        prev.map((s) =>
          s.maSV === student.maSV ? { ...s, isRegistered: student.isRegistered } : s
        )
      );
      showToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setSavingStudentId(null);
    }
  };

  const handleSaveNote = async (student: ReviewStudentItem) => {
    const nextNote = (noteDrafts[student.maSV] ?? '').trim();
    if (nextNote === (student.note || '').trim()) return;

    setSavingStudentId(student.maSV);
    try {
      const data = await postToggleStudentReview({
        batchCode: selectedBatchCode,
        classCode: selectedClass,
        maSV: student.maSV,
        isRegistered: student.isRegistered,
        note: nextNote,
      });
      if (data.ok && data.success) {
        setStudents((prev) =>
          prev.map((s) => (s.maSV === student.maSV ? { ...s, note: nextNote } : s))
        );
        showToast(`Đã lưu ghi chú cho ${student.hoTen}`);
      } else {
        showToast(data.error || 'Không thể lưu ghi chú', 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setSavingStudentId(null);
    }
  };

  const runBulkUpdate = async (
    items: Array<{ maSV: string; isRegistered: boolean }>,
    successMsg: string
  ) => {
    if (items.length === 0) return;
    setIsBulkSaving(true);
    try {
      const data = await postBulkReviewRegistrations({
        batchCode: selectedBatchCode,
        classCode: selectedClass,
        items,
      });
      if (data.ok && data.success) {
        const statusMap = new Map(items.map((i) => [i.maSV, i.isRegistered]));
        setStudents((prev) =>
          prev.map((s) =>
            statusMap.has(s.maSV) ? { ...s, isRegistered: statusMap.get(s.maSV)! } : s
          )
        );
        showToast(successMsg);
      } else {
        showToast(data.error || 'Không thể cập nhật hàng loạt', 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setIsBulkSaving(false);
    }
  };

  const handleQuickImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tokens = parseQuickImportTokens(quickImportText);
    if (tokens.length === 0) {
      showToast('Vui lòng nhập ít nhất 1 mã sinh viên hợp lệ', 'error');
      return;
    }

    const tokenSet = new Set(tokens);
    const matchedIds = students.filter((s) => tokenSet.has(s.maSV)).map((s) => s.maSV);
    if (matchedIds.length === 0) {
      showToast(`Không tìm thấy mã sinh viên nào thuộc lớp ${selectedClass}`, 'error');
      return;
    }

    const items =
      quickImportMode === 'REPLACE'
        ? students.map((s) => ({ maSV: s.maSV, isRegistered: tokenSet.has(s.maSV) }))
        : matchedIds.map((maSV) => ({ maSV, isRegistered: true }));

    await runBulkUpdate(
      items,
      quickImportMode === 'REPLACE'
        ? `Đã cập nhật danh sách ôn tập (${matchedIds.length} SV được chọn)`
        : `Đã bổ sung ${matchedIds.length} sinh viên vào danh sách ôn tập`
    );
    setIsQuickImportOpen(false);
    setQuickImportText('');
  };

  const handleExportCSV = () => {
    const registeredList = students.filter((s) => s.isRegistered);
    if (registeredList.length === 0) {
      showToast('Chưa có sinh viên nào đăng ký ôn tập để xuất file', 'error');
      return;
    }

    const csvContent = buildReviewCsvContent(
      registeredList,
      selectedBatchInfo?.name || selectedBatchCode
    );
    triggerCsvDownload(csvContent, `Danh_Sach_On_Tap_${selectedClass}_${selectedBatchCode}.csv`);
    showToast(`Đã tải danh sách ${registeredList.length} sinh viên đăng ký ôn tập`);
  };

  const handleCopyRegisteredList = async () => {
    const registeredList = students.filter((s) => s.isRegistered);
    if (registeredList.length === 0) {
      showToast('Chưa có sinh viên nào đăng ký ôn tập để sao chép', 'error');
      return;
    }

    const text = buildRegisteredClipboardText(
      registeredList,
      selectedClass,
      selectedBatchInfo?.name || selectedBatchCode
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopiedList(true);
      showToast(`Đã sao chép danh sách ${registeredList.length} SV vào bộ nhớ tạm`);
      setTimeout(() => setCopiedList(false), 2500);
    } catch {
      showToast('Trình duyệt không hỗ trợ sao chép tự động', 'error');
    }
  };

  return {
    selectedBatchCode, setSelectedBatchCode, selectedClass, students,
    isLoading, isBulkSaving, savingStudentId, errorMsg, toast,
    filterMode, setFilterMode, searchQuery, setSearchQuery,
    copiedList, noteDrafts, setNoteDrafts,
    isQuickImportOpen, setIsQuickImportOpen,
    quickImportText, setQuickImportText, quickImportMode, setQuickImportMode,
    summary, filteredStudents, fetchReviewList,
    handleToggleStudent, handleSaveNote, runBulkUpdate,
    handleQuickImportSubmit, handleExportCSV, handleCopyRegisteredList,
  };
}
