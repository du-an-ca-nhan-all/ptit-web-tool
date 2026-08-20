import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Layers,
  Plus,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Trash2,
  Edit3,
  Clock,
  Users,
  Check,
  X,
  Sparkles,
  Shield,
  Search,
  ChevronRight,
  Database,
  Star,
  RefreshCw,
  Info,
  Power,
} from 'lucide-react';
import { ExamBatchItem, LoginUser } from '../types';

interface ExamBatchManagementProps {
  currentUser: LoginUser;
  initialBatches?: ExamBatchItem[];
  initialActiveBatch?: ExamBatchItem | null;
  onBatchChanged?: (activeBatch: ExamBatchItem) => void;
}

export default function ExamBatchManagement({
  currentUser,
  initialBatches,
  initialActiveBatch,
  onBatchChanged,
}: ExamBatchManagementProps) {
  const [batches, setBatches] = useState<ExamBatchItem[]>(initialBatches || []);
  const [isLoading, setIsLoading] = useState(!initialBatches || initialBatches.length === 0);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<ExamBatchItem | null>(null);
  const [importingBatch, setImportingBatch] = useState<ExamBatchItem | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<ExamBatchItem | null>(null);
  const [deleteRecordsOption, setDeleteRecordsOption] = useState(false);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    semester: 'HK2',
    academicYear: '2025-2026',
    startDate: '',
    endDate: '',
    description: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Import CSV
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
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
      const res = await fetch('/api/exam-batches');
      const data = await res.json();
      if (res.ok && data.batches) {
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
      const res = await fetch('/api/exam-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SET_ACTIVE',
          code: batch.code,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
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

  // Handle Toggle Active (Bật / Tắt đợt thi)
  const handleToggleBatch = async (batch: ExamBatchItem) => {
    try {
      const res = await fetch('/api/exam-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE',
          code: batch.code,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
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
    if (!formData.code.trim() || !formData.name.trim()) {
      showToast('Vui lòng nhập đầy đủ Mã đợt thi và Tên đợt thi', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = !!editingBatch;
      const res = await fetch('/api/exam-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isEdit ? 'UPDATE' : 'CREATE',
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          semester: formData.semester.trim(),
          academicYear: formData.academicYear.trim(),
          startDate: formData.startDate.trim() || null,
          endDate: formData.endDate.trim() || null,
          description: formData.description.trim() || null,
          isActive: formData.isActive,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
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
      const res = await fetch('/api/exam-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE',
          code: deletingBatch.code,
          deleteRecords: deleteRecordsOption,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
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
      const formDataUpload = new FormData();
      formDataUpload.append('file', selectedFile);
      formDataUpload.append('batchCode', importingBatch.code);
      formDataUpload.append('mode', importMode);

      const res = await fetch('/api/exam-batches/import', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await res.json();
      if (res.ok && data.success) {
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

  return (
    <div className="flex-1 flex flex-col gap-6 w-full relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-sm font-bold animate-in slide-in-from-bottom-4 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-200/50'
              : 'bg-rose-600 text-white border-rose-500 shadow-rose-200/50'
          }`}
        >
          {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shrink-0">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Layers className="w-7 h-7 text-indigo-600" />
              Quản Lý Đợt Thi
            </h2>
            <span className="bg-rose-100 text-rose-700 text-xs font-black px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Dành Cho Admin
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Tạo các đợt thi theo kỳ, nhập dữ liệu lịch thi qua tệp CSV và chuyển đổi đợt thi mặc định của toàn hệ thống
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={fetchBatches}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap cursor-pointer"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>

          <button
            onClick={() => {
              setEditingBatch(null);
              setFormData({
                code: '',
                name: '',
                semester: 'HK2',
                academicYear: '2025-2026',
                startDate: '',
                endDate: '',
                description: '',
                isActive: true,
              });
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-200 whitespace-nowrap cursor-pointer hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> Tạo Đợt Thi Mới
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Số Đợt Thi</p>
            <p className="text-2xl font-black text-slate-800">{batches.length} đợt</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đợt Thi Mặc Định</p>
            <p className="text-sm font-black text-slate-800 truncate" title={activeBatch?.name || 'Chưa có'}>
              {activeBatch?.name || 'Chưa thiết lập'}
            </p>
            <p className="text-[11px] font-mono font-bold text-emerald-600">{activeBatch?.code || '—'}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lượt Thi Đang Chạy</p>
            <p className="text-2xl font-black text-slate-800">
              {activeBatch?.totalRecords ? activeBatch.totalRecords.toLocaleString('vi-VN') : 0}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sinh Viên Đang Thi</p>
            <p className="text-2xl font-black text-slate-800">
              {activeBatch?.totalStudents ? activeBatch.totalStudents.toLocaleString('vi-VN') : 0} SV
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden min-h-[400px]">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên đợt thi, mã đợt, năm học..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Hiển thị <b>{filteredBatches.length}</b> / {batches.length} đợt thi
          </span>
        </div>

        {/* Batches Grid / Cards */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-xs font-semibold">Đang tải danh sách đợt thi từ Database...</p>
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-700">Chưa tìm thấy đợt thi nào</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Hãy bấm "Tạo Đợt Thi Mới" để thiết lập đợt thi đầu tiên và tải lên danh sách lịch thi từ tệp CSV.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredBatches.map((batch) => (
                <div
                  key={batch.code}
                  className={`relative rounded-2xl border transition-all p-6 flex flex-col justify-between gap-5 ${
                    batch.isActive
                      ? 'bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 border-indigo-200 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  {/* Top Bar: Name & Status Badge with Toggle Switch */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-lg font-black text-slate-800 tracking-tight">{batch.name}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-700">
                            {batch.code}
                          </span>
                          <span>•</span>
                          <span>{batch.semester || 'HK2'}</span>
                          <span>•</span>
                          <span>{batch.academicYear || '2025-2026'}</span>
                        </div>
                      </div>

                      {/* Interactive BẬT / TẮT Toggle Switch */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleBatch(batch)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            batch.isActive ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 'bg-slate-300'
                          }`}
                          title={batch.isActive ? 'Bấm để TẮT đợt thi này' : 'Bấm để BẬT đợt thi này'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              batch.isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-[11px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            batch.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          {batch.isActive ? 'ĐANG BẬT' : 'ĐÃ TẮT'}
                        </span>
                      </div>
                    </div>

                    {batch.description && (
                      <p className="text-xs text-slate-600 italic mt-2 line-clamp-2 bg-white/70 p-2.5 rounded-xl border border-slate-100">
                        "{batch.description}"
                      </p>
                    )}
                  </div>

                  {/* Metrics Box */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50/80 rounded-xl p-3.5 border border-slate-100">
                    <div className="text-center">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Lượt Thi</p>
                      <p className="text-base font-black text-indigo-600">
                        {batch.totalRecords ? batch.totalRecords.toLocaleString('vi-VN') : 0}
                      </p>
                    </div>
                    <div className="text-center border-x border-slate-200">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Sinh Viên</p>
                      <p className="text-base font-black text-slate-700">
                        {batch.totalStudents ? batch.totalStudents.toLocaleString('vi-VN') : 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Phòng Thi</p>
                      <p className="text-base font-black text-slate-700">
                        {batch.totalRooms ? batch.totalRooms.toLocaleString('vi-VN') : 0}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleToggleBatch(batch)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer border shadow-xs ${
                          batch.isActive
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                        title={batch.isActive ? 'Tạm khóa / Tắt đợt thi này' : 'Kích hoạt / Bật đợt thi này'}
                      >
                        <Power className="w-3.5 h-3.5" />
                        {batch.isActive ? 'Tắt Đợt Thi' : 'Bật Đợt Thi'}
                      </button>

                      <button
                        onClick={() => handleSetActive(batch)}
                        disabled={batch.isActive}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors border shadow-xs ${
                          batch.isActive
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 cursor-pointer'
                        }`}
                        title="Đặt làm đợt thi mặc định cho toàn hệ thống"
                      >
                        <Star className="w-3.5 h-3.5" />
                        {batch.isActive ? 'Đang Mặc Định' : 'Đặt Mặc Định'}
                      </button>

                      <button
                        onClick={() => {
                          setImportingBatch(batch);
                          setSelectedFile(null);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-blue-200 shadow-sm"
                        title="Nạp thêm / ghi đè lịch thi từ file CSV cho đợt này"
                      >
                        <Upload className="w-3.5 h-3.5" /> Import CSV
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingBatch(batch);
                          setFormData({
                            code: batch.code,
                            name: batch.name,
                            semester: batch.semester || 'HK2',
                            academicYear: batch.academicYear || '2025-2026',
                            startDate: batch.startDate || '',
                            endDate: batch.endDate || '',
                            description: batch.description || '',
                            isActive: batch.isActive,
                          });
                          setIsCreateModalOpen(true);
                        }}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                        title="Chỉnh sửa thông tin đợt thi"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setDeletingBatch(batch);
                          setDeleteRecordsOption(false);
                        }}
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Xóa đợt thi & lịch thi liên quan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: CREATE / EDIT BATCH */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight">
                  {editingBatch ? 'Chỉnh Sửa Đợt Thi' : 'Tạo Đợt Thi Mới'}
                </h3>
                <p className="text-indigo-100 text-xs mt-0.5">
                  Cấu hình thông tin niên khóa và đợt thi của trường
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveBatch} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mã đợt thi (Code) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingBatch}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Ví dụ: 20252_TX, DOT1_HK2_2526"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Mã duy nhất dùng để liên kết các bản ghi thi từ tệp CSV
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên đợt thi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: ĐHTX HK2 2025-2026, Đợt Thi Chính Thức Kỳ 2"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Học kỳ
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="HK1">Học kỳ 1 (HK1)</option>
                    <option value="HK2">Học kỳ 2 (HK2)</option>
                    <option value="HK3">Học kỳ hè / phụ (HK3)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Năm học
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    placeholder="2025-2026"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mô tả / Ghi chú
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ghi chú thêm về đợt thi này..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveBatch"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
                <label htmlFor="isActiveBatch" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Đặt làm đợt thi mặc định đang diễn ra
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shadow-md shadow-indigo-200 disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang lưu...' : editingBatch ? 'Lưu Thay Đổi' : 'Tạo Đợt Thi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: IMPORT CSV SPECIFIC TO BATCH */}
      {importingBatch && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setImportingBatch(null);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <Upload className="w-5 h-5" /> Import Dữ Liệu CSV
                </h3>
                <p className="text-blue-100 text-xs mt-0.5">
                  Nạp lịch thi cho đợt: <b className="text-white">{importingBatch.name}</b> ({importingBatch.code})
                </p>
              </div>
              <button
                onClick={() => setImportingBatch(null)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Import Form */}
            <form onSubmit={handleImportCSV} className="p-6 flex flex-col gap-4">
              {/* File Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Chọn tệp CSV dữ liệu thi <span className="text-rose-500">*</span>
                </label>
                <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                  <FileSpreadsheet className="w-10 h-10 text-indigo-500 mb-2" />
                  <span className="text-sm font-bold text-slate-700">
                    {selectedFile ? selectedFile.name : 'Nhấp hoặc kéo thả tệp CSV vào đây'}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                      : 'Định dạng chuẩn PTIT với các cột MaSV, MAPTHI, MaMH, TenMH, NgayThi...'}
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Import Mode Radio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Chế độ nạp dữ liệu
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3.5 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                      importMode === 'replace'
                        ? 'bg-blue-50/80 border-blue-400 text-blue-900 ring-2 ring-blue-400/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="importMode"
                        value="replace"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-blue-600"
                      />
                      <span className="text-xs font-black">Ghi Đè (Replace)</span>
                    </div>
                    <span className="text-[11px] text-slate-500 pl-5">
                      Xóa toàn bộ lịch thi cũ của đợt này trước khi nạp
                    </span>
                  </label>

                  <label
                    className={`p-3.5 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                      importMode === 'append'
                        ? 'bg-blue-50/80 border-blue-400 text-blue-900 ring-2 ring-blue-400/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="importMode"
                        value="append"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                        className="text-blue-600"
                      />
                      <span className="text-xs font-black">Bổ Sung (Append)</span>
                    </div>
                    <span className="text-[11px] text-slate-500 pl-5">
                      Giữ nguyên dữ liệu hiện có và thêm các bản ghi mới
                    </span>
                  </label>
                </div>
              </div>

              {/* Progress Text */}
              {isImporting && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-3 text-xs font-bold text-indigo-800 animate-pulse">
                  <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin shrink-0" />
                  <span>{importProgressText || 'Đang xử lý dữ liệu...'}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => setImportingBatch(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || isImporting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-md shadow-blue-200 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  {isImporting ? 'Đang Import...' : 'Bắt Đầu Import CSV'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE BATCH CONFIRMATION */}
      {deletingBatch && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingBatch(null);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 p-6 flex flex-col gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-800">Xác Nhận Xóa Đợt Thi?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bạn sắp xóa đợt thi <b className="text-slate-800">{deletingBatch.name}</b> ({deletingBatch.code}). Toàn bộ <b>{deletingBatch.totalRecords || 0}</b> bản ghi lịch thi thuộc đợt này sẽ bị xóa khỏi cơ sở dữ liệu.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-left">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteRecordsOption}
                  onChange={(e) => setDeleteRecordsOption(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    Xóa kèm toàn bộ {deletingBatch.totalRecords || 0} lượt thi thuộc đợt này
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Nếu không tích chọn, dữ liệu lịch thi vẫn được bảo lưu an toàn trong hệ thống.
                  </p>
                </div>
              </label>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs text-left font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Hành động xóa này không thể hoàn tác.</span>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setDeletingBatch(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer w-full"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteBatch}
                className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-md shadow-rose-200 w-full disabled:opacity-50"
              >
                {isSubmitting ? 'Đang xóa...' : 'Xác Nhận Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
