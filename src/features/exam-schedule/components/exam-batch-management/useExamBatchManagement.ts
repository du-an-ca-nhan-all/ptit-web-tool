import React, { useState, useEffect, useMemo } from 'react';
import { ExamBatchItem } from '../../types/exam.types';
import { downloadExamBatchSampleCsv } from '../../utils/examSampleCsv';
import { fetchExamBatchesApi, importExamBatchCsvApi, postExamBatchActionApi } from './batchApi';
import { BatchFormData, BatchToast, EMPTY_BATCH_FORM_DATA, ImportMode } from './types';

interface UseExamBatchManagementParams {
  initialBatches?: ExamBatchItem[];
  onBatchChanged?: (activeBatch: ExamBatchItem) => void;
}

export function useExamBatchManagement({ initialBatches, onBatchChanged }: UseExamBatchManagementParams) {
  const [batches, setBatches] = useState<ExamBatchItem[]>(initialBatches || []);
  const [isLoading, setIsLoading] = useState(!initialBatches || initialBatches.length === 0);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState<BatchToast | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<ExamBatchItem | null>(null);
  const [importingBatch, setImportingBatch] = useState<ExamBatchItem | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<ExamBatchItem | null>(null);
  const [deleteRecordsOption, setDeleteRecordsOption] = useState(false);

  // Form states for Create/Edit
  const [formData, setFormData] = useState<BatchFormData>(EMPTY_BATCH_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Import CSV
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('replace');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgressText, setImportProgressText] = useState('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch batches
  const fetchBatches = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await fetchExamBatchesApi();
      if (data.ok && data.batches) {
        setBatches(data.batches);
      } else {
        setErrorMsg(data.error || 'Không thể tải danh sách đợt thi');
      }
    } catch (err: any) {
      setErrorMsg('Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialBatches && initialBatches.length > 0) {
      setBatches(initialBatches);
      setIsLoading(false);
    } else {
      fetchBatches();
    }
  }, [initialBatches]);

  // Filtered batches
  const filteredBatches = useMemo(() => {
    if (!searchQuery.trim()) return batches;
    const q = searchQuery.toLowerCase().trim();
    return batches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        (b.academicYear && b.academicYear.toLowerCase().includes(q)) ||
        (b.semester && b.semester.toLowerCase().includes(q))
    );
  }, [batches, searchQuery]);

  const activeBatch = useMemo(() => {
    return batches.find((b) => b.isActive) || batches[0] || null;
  }, [batches]);

  // Handle Set Active
  const handleSetActive = async (batch: ExamBatchItem) => {
    try {
      const data = await postExamBatchActionApi({
        action: 'SET_ACTIVE',
        code: batch.code,
      });
      if (data.ok && data.success) {
        showToast(`Đã đặt "${batch.name}" làm đợt thi mặc định.`);
        fetchBatches();
        if (onBatchChanged && data.batch) {
          onBatchChanged(data.batch);
        }
      } else {
        showToast(data.error || 'Có lỗi xảy ra', 'error');
      }
    } catch (err) {
      showToast('Lỗi kết nối máy chủ', 'error');
    }
  };

  // Handle Toggle Active
  const handleToggleBatch = async (batch: ExamBatchItem) => {
    try {
      const data = await postExamBatchActionApi({
        action: 'TOGGLE',
        code: batch.code,
      });
      if (data.ok && data.success) {
        showToast(data.message || 'Đã thay đổi trạng thái đợt thi');
        fetchBatches();
        if (onBatchChanged && data.batch) {
          onBatchChanged(data.batch);
        }
      } else {
        showToast(data.error || 'Có lỗi xảy ra', 'error');
      }
    } catch (err) {
      showToast('Lỗi kết nối máy chủ', 'error');
    }
  };

  // Handle Save / Create Batch
  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập Tên đợt thi', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = Boolean(editingBatch);
      const data = await postExamBatchActionApi({
        action: isEdit ? 'UPDATE' : 'CREATE',
        ...(isEdit && editingBatch ? { code: editingBatch.code } : {}),
        name: formData.name.trim(),
        startDate: formData.startDate.trim() || null,
        endDate: formData.endDate.trim() || null,
        description: formData.description.trim() || null,
        isActive: formData.isActive,
      });

      if (data.ok && data.success) {
        showToast(data.message || (isEdit ? 'Đã cập nhật đợt thi' : 'Đã tạo đợt thi mới'));
        setIsCreateModalOpen(false);
        setEditingBatch(null);
        fetchBatches();
      } else {
        showToast(data.error || 'Không thể lưu đợt thi', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Batch
  const handleDeleteBatch = async () => {
    if (!deletingBatch) return;
    setIsSubmitting(true);
    try {
      const data = await postExamBatchActionApi({
        action: 'DELETE',
        code: deletingBatch.code,
        deleteRecords: deleteRecordsOption,
      });

      if (data.ok && data.success) {
        showToast(data.message || 'Đã xóa đợt thi thành công');
        setDeletingBatch(null);
        setDeleteRecordsOption(false);
        fetchBatches();
      } else {
        showToast(data.error || 'Không thể xóa đợt thi', 'error');
      }
    } catch (err) {
      showToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Download Sample CSV
  const handleDownloadSampleCSV = (batch?: ExamBatchItem | null) => {
    const fileName = downloadExamBatchSampleCsv(batch);
    showToast(`Đã tải xuống tệp mẫu "${fileName}"`);
  };

  // Handle CSV Import
  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importingBatch || !selectedFile) {
      showToast('Vui lòng chọn tệp CSV hợp lệ', 'error');
      return;
    }

    setIsImporting(true);
    setImportProgressText('Đang tải tệp lên và phân tích lịch thi...');

    try {
      const data = await importExamBatchCsvApi(selectedFile, importingBatch.code, importMode);
      if (data.ok && data.success) {
        showToast(data.message || `Đã nạp ${data.totalRecords} bản ghi thi vào đợt ${importingBatch.name}`);
        setImportingBatch(null);
        setSelectedFile(null);
        fetchBatches();
      } else {
        showToast(data.error || 'Có lỗi xảy ra khi nạp tệp CSV', 'error');
      }
    } catch (err) {
      showToast('Lỗi khi tải tệp CSV lên máy chủ', 'error');
    } finally {
      setIsImporting(false);
      setImportProgressText('');
    }
  };

  const openCreateModal = () => {
    setEditingBatch(null);
    setFormData(EMPTY_BATCH_FORM_DATA);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (batch: ExamBatchItem) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      startDate: batch.startDate || '',
      endDate: batch.endDate || '',
      description: batch.description || '',
      isActive: batch.isActive,
    });
    setIsCreateModalOpen(true);
  };

  const openImportModal = (batch: ExamBatchItem) => {
    setImportingBatch(batch);
    setSelectedFile(null);
  };

  const openDeleteModal = (batch: ExamBatchItem) => {
    setDeletingBatch(batch);
    setDeleteRecordsOption(false);
  };

  return {
    batches,
    isLoading,
    errorMsg,
    toast,
    searchQuery,
    setSearchQuery,
    filteredBatches,
    activeBatch,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingBatch,
    formData,
    setFormData,
    isSubmitting,
    importingBatch,
    setImportingBatch,
    selectedFile,
    setSelectedFile,
    importMode,
    setImportMode,
    isImporting,
    importProgressText,
    deletingBatch,
    setDeletingBatch,
    deleteRecordsOption,
    setDeleteRecordsOption,
    fetchBatches,
    handleSetActive,
    handleToggleBatch,
    handleSaveBatch,
    handleDeleteBatch,
    handleDownloadSampleCSV,
    handleImportCSV,
    openCreateModal,
    openEditModal,
    openImportModal,
    openDeleteModal,
  };
}
