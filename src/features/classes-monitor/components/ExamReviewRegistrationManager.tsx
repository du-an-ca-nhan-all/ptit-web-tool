'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpenCheck,
  Users,
  CheckCircle2,
  XCircle,
  Search,
  Download,
  Copy,
  Check,
  RefreshCw,
  Crown,
  Layers,
  ClipboardList,
  Calendar,
  Phone,
  X,
  AlertCircle,
  Sparkles,
  CheckSquare,
  Square,
} from 'lucide-react';
import { ExamBatchItem, LoginUser } from '../../../types';

interface ExamSubjectItem {
  code: string;
  name: string;
}

interface ReviewStudentItem {
  maSV: string;
  hoLot: string;
  ten: string;
  hoTen: string;
  gioiTinh: string;
  soDienThoai: string;
  maLop: string;
  isRegistered: boolean;
  note: string;
  updatedBy: string | null;
  updatedAt: string | null;
  examCount: number;
  examSubjects: ExamSubjectItem[];
}

interface ExamReviewRegistrationManagerProps {
  currentUser: LoginUser;
  availableClasses: string[];
  initialClassCode?: string;
  examBatches: ExamBatchItem[];
  activeBatch: ExamBatchItem | null;
}

type FilterMode = 'ALL' | 'REGISTERED' | 'UNREGISTERED' | 'HAS_EXAMS';

export default function ExamReviewRegistrationManager({
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
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filters & search
  const [filterMode, setFilterMode] = useState<FilterMode>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedList, setCopiedList] = useState<boolean>(false);

  // Inline note drafts
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  // Quick paste modal
  const [isQuickImportOpen, setIsQuickImportOpen] = useState<boolean>(false);
  const [quickImportText, setQuickImportText] = useState<string>('');
  const [quickImportMode, setQuickImportMode] = useState<'MERGE' | 'REPLACE'>('MERGE');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Keep synced with global activeBatch when user switches batch from Header
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
      const params = new URLSearchParams({
        batchCode: selectedBatchCode,
        classCode: selectedClass,
      });
      const res = await fetch(`/api/class-monitors/review-registrations?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        const list: ReviewStudentItem[] = data.students || [];
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

  const summary = useMemo(() => {
    const total = students.length;
    const registered = students.filter((s) => s.isRegistered).length;
    const withExams = students.filter((s) => s.examCount > 0).length;
    return {
      total,
      registered,
      unregistered: total - registered,
      withExams,
    };
  }, [students]);

  const filteredStudents = useMemo(() => {
    let list = students;
    if (filterMode === 'REGISTERED') {
      list = list.filter((s) => s.isRegistered);
    } else if (filterMode === 'UNREGISTERED') {
      list = list.filter((s) => !s.isRegistered);
    } else if (filterMode === 'HAS_EXAMS') {
      list = list.filter((s) => s.examCount > 0);
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    return list.filter(
      (s) =>
        s.maSV.toLowerCase().includes(q) ||
        s.hoTen.toLowerCase().includes(q) ||
        (s.soDienThoai && s.soDienThoai.toLowerCase().includes(q)) ||
        (s.note && s.note.toLowerCase().includes(q))
    );
  }, [students, filterMode, searchQuery]);

  // Toggle single student registration
  const handleToggleStudent = async (student: ReviewStudentItem) => {
    const nextStatus = !student.isRegistered;
    setSavingStudentId(student.maSV);

    // Optimistic update
    setStudents((prev) =>
      prev.map((s) => (s.maSV === student.maSV ? { ...s, isRegistered: nextStatus } : s))
    );

    try {
      const res = await fetch('/api/class-monitors/review-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_ONE',
          batchCode: selectedBatchCode,
          classCode: selectedClass,
          maSV: student.maSV,
          isRegistered: nextStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Rollback on failure
        setStudents((prev) =>
          prev.map((s) => (s.maSV === student.maSV ? { ...s, isRegistered: student.isRegistered } : s))
        );
        showToast(data.error || 'Không thể cập nhật trạng thái', 'error');
      }
    } catch {
      setStudents((prev) =>
        prev.map((s) => (s.maSV === student.maSV ? { ...s, isRegistered: student.isRegistered } : s))
      );
      showToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setSavingStudentId(null);
    }
  };

  // Save inline note for a single student
  const handleSaveNote = async (student: ReviewStudentItem) => {
    const nextNote = (noteDrafts[student.maSV] ?? '').trim();
    if (nextNote === (student.note || '').trim()) return;

    setSavingStudentId(student.maSV);
    try {
      const res = await fetch('/api/class-monitors/review-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_ONE',
          batchCode: selectedBatchCode,
          classCode: selectedClass,
          maSV: student.maSV,
          isRegistered: student.isRegistered,
          note: nextNote,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
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

  // Bulk update helper
  const runBulkUpdate = async (
    items: Array<{ maSV: string; isRegistered: boolean }>,
    successMsg: string
  ) => {
    if (items.length === 0) return;
    setIsBulkSaving(true);
    try {
      const res = await fetch('/api/class-monitors/review-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_BULK',
          batchCode: selectedBatchCode,
          classCode: selectedClass,
          items,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
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

  // Quick paste MaSV list
  const handleQuickImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tokens = quickImportText
      .split(/[\s,;\t\n\r]+/)
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t.length >= 4);

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

  // Export registered students CSV
  const handleExportCSV = () => {
    const registeredList = students.filter((s) => s.isRegistered);
    if (registeredList.length === 0) {
      showToast('Chưa có sinh viên nào đăng ký ôn tập để xuất file', 'error');
      return;
    }

    const headers = ['STT', 'Mã SV', 'Họ và Tên', 'Lớp', 'SĐT', 'Số môn thi đợt này', 'Đợt thi', 'Ghi chú'];
    const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;

    const rows = registeredList.map((s, idx) => [
      idx + 1,
      s.maSV,
      s.hoTen,
      s.maLop,
      s.soDienThoai || '',
      s.examCount,
      selectedBatchInfo?.name || selectedBatchCode,
      s.note || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Danh_Sach_On_Tap_${selectedClass}_${selectedBatchCode}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    showToast(`Đã tải danh sách ${registeredList.length} sinh viên đăng ký ôn tập`);
  };

  // Copy formatted list for Zalo/Telegram
  const handleCopyRegisteredList = async () => {
    const registeredList = students.filter((s) => s.isRegistered);
    if (registeredList.length === 0) {
      showToast('Chưa có sinh viên nào đăng ký ôn tập để sao chép', 'error');
      return;
    }

    const header = `DANH SÁCH ĐĂNG KÝ ÔN TẬP - LỚP ${selectedClass}\nĐợt thi: ${
      selectedBatchInfo?.name || selectedBatchCode
    } (${registeredList.length} SV)\n`;
    const body = registeredList
      .map(
        (s, idx) =>
          `${idx + 1}. ${s.maSV} - ${s.hoTen}${s.note ? ` (${s.note})` : ''}`
      )
      .join('\n');

    try {
      await navigator.clipboard.writeText(`${header}\n${body}`);
      setCopiedList(true);
      showToast(`Đã sao chép danh sách ${registeredList.length} SV vào bộ nhớ tạm`);
      setTimeout(() => setCopiedList(false), 2500);
    } catch {
      showToast('Trình duyệt không hỗ trợ sao chép tự động', 'error');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <BookOpenCheck className="w-7 h-7 text-amber-600" />
              Đăng Ký Ôn Tập Đợt Thi
            </h2>
            <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" /> Lớp Trưởng
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Cấu hình và chốt danh sách sinh viên đăng ký ôn tập của lớp theo đợt thi đang chọn
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopyRegisteredList}
            disabled={summary.registered === 0}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 border border-indigo-200 px-3.5 py-2.5 rounded-xl transition-colors shadow-xs whitespace-nowrap cursor-pointer"
            title="Sao chép danh sách sinh viên đã đăng ký ôn tập (dán Zalo/Telegram)"
          >
            {copiedList ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copiedList ? 'Đã sao chép' : 'Copy DS Ôn Tập'}
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={summary.registered === 0}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl transition-colors shadow-xs whitespace-nowrap cursor-pointer"
            title="Xuất file CSV danh sách sinh viên đã đăng ký ôn tập"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Xuất CSV ({summary.registered})
          </button>

          <button
            type="button"
            onClick={fetchReviewList}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2.5 rounded-xl transition-colors shadow-xs whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Context Selectors: Batch & Class */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
          {/* Batch selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
              <Layers className="w-3.5 h-3.5 text-indigo-600" /> Đợt thi:
            </span>
            {examBatches.length > 0 ? (
              <select
                value={selectedBatchCode}
                onChange={(e) => setSelectedBatchCode(e.target.value)}
                className="bg-indigo-50/70 border border-indigo-200 text-indigo-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {examBatches.map((batch) => (
                  <option key={batch.code} value={batch.code}>
                    {batch.name} ({batch.code}){batch.isActive ? ' ★' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                Chưa có đợt thi nào
              </span>
            )}
          </div>
        </div>

        {/* Bulk Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={isBulkSaving || students.length === 0}
            onClick={() => setIsQuickImportOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Nhập nhanh DS Mã SV
          </button>

          <button
            type="button"
            disabled={isBulkSaving || summary.withExams === 0}
            onClick={() =>
              runBulkUpdate(
                students.map((s) => ({ maSV: s.maSV, isRegistered: s.examCount > 0 })),
                `Đã chọn ${summary.withExams} SV có lịch thi đợt này`
              )
            }
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Chọn tất cả sinh viên có lịch thi trong đợt thi đang chọn"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Chọn SV có lịch thi ({summary.withExams})
          </button>

          <button
            type="button"
            disabled={isBulkSaving || students.length === 0}
            onClick={() =>
              runBulkUpdate(
                students.map((s) => ({ maSV: s.maSV, isRegistered: true })),
                `Đã chọn toàn bộ ${students.length} sinh viên trong lớp`
              )
            }
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Chọn cả lớp
          </button>

          <button
            type="button"
            disabled={isBulkSaving || summary.registered === 0}
            onClick={() =>
              runBulkUpdate(
                students.map((s) => ({ maSV: s.maSV, isRegistered: false })),
                'Đã bỏ chọn toàn bộ danh sách ôn tập'
              )
            }
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <Square className="w-3.5 h-3.5" />
            Bỏ chọn hết
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sĩ Số Lớp</p>
            <p className="text-2xl font-black text-slate-800">{summary.total} SV</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center gap-4 ring-1 ring-emerald-500/10">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Đăng Ký Ôn Tập</p>
            <p className="text-2xl font-black text-emerald-700">{summary.registered} SV</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chưa Đăng Ký</p>
            <p className="text-2xl font-black text-slate-700">{summary.unregistered} SV</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Có Lịch Thi Đợt Này</p>
            <p className="text-2xl font-black text-indigo-700">{summary.withExams} SV</p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter Tabs & Search */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                { id: 'ALL', label: `Tất cả (${summary.total})` },
                { id: 'REGISTERED', label: `Đã đăng ký (${summary.registered})` },
                { id: 'UNREGISTERED', label: `Chưa đăng ký (${summary.unregistered})` },
                { id: 'HAS_EXAMS', label: `Có lịch thi (${summary.withExams})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterMode === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm Mã SV, Họ tên, SĐT, ghi chú..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div className="m-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Loading / Empty / Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-xs font-semibold">Đang tải danh sách sinh viên lớp {selectedClass}...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-16 px-4 flex flex-col items-center justify-center gap-2">
            <BookOpenCheck className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">Không có sinh viên nào phù hợp</p>
            <p className="text-xs text-slate-400">
              Thử đổi bộ lọc hoặc chọn đợt thi / lớp khác để xem danh sách.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center w-12">STT</th>
                  <th className="py-3.5 px-4 text-center w-36">Đăng ký ôn tập</th>
                  <th className="py-3.5 px-4">Mã SV</th>
                  <th className="py-3.5 px-4">Họ và Tên</th>
                  <th className="py-3.5 px-4">SĐT</th>
                  <th className="py-3.5 px-4">Lịch thi đợt này</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStudents.map((st, idx) => {
                  const isSavingThis = savingStudentId === st.maSV;
                  const draftNote = noteDrafts[st.maSV] ?? '';
                  const noteChanged = draftNote.trim() !== (st.note || '').trim();

                  return (
                    <tr
                      key={st.maSV}
                      className={`transition-colors ${
                        st.isRegistered
                          ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                          : idx % 2 === 1
                          ? 'bg-slate-50/30 hover:bg-slate-50'
                          : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-mono text-slate-400 font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          disabled={isSavingThis || isBulkSaving}
                          onClick={() => handleToggleStudent(st)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-60 ${
                            st.isRegistered
                              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
                          }`}
                        >
                          {st.isRegistered ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Đã đăng ký
                            </>
                          ) : (
                            <>
                              <Square className="w-3.5 h-3.5" />
                              Chưa đăng ký
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">{st.maSV}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{st.hoTen}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {st.soDienThoai ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {st.soDienThoai}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {st.examCount > 0 ? (
                          <span
                            title={st.examSubjects.map((m) => `${m.code} - ${m.name}`).join('\n')}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                          >
                            {st.examCount} môn thi
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Không có lịch</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={draftNote}
                            onChange={(e) =>
                              setNoteDrafts((prev) => ({ ...prev, [st.maSV]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveNote(st);
                              }
                            }}
                            onBlur={() => handleSaveNote(st)}
                            placeholder="Thêm ghi chú..."
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          {noteChanged && (
                            <button
                              type="button"
                              onClick={() => handleSaveNote(st)}
                              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer shrink-0"
                              title="Lưu ghi chú"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Import MaSV Modal */}
      {isQuickImportOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsQuickImportOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" /> Nhập Nhanh DS Mã Sinh Viên
                </h3>
                <p className="text-indigo-100 text-xs mt-0.5">
                  Dán danh sách Mã SV từ Zalo / Excel để đánh dấu đăng ký ôn tập hàng loạt
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickImportOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickImportSubmit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Danh sách Mã SV (mỗi dòng hoặc cách nhau bằng dấu phẩy / khoảng trắng)
                </label>
                <textarea
                  rows={6}
                  value={quickImportText}
                  onChange={(e) => setQuickImportText(e.target.value)}
                  placeholder={'Ví dụ:\nB22DCCN001\nB22DCCN002\nB22DCCN003'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    quickImportMode === 'MERGE'
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="quickImportMode"
                      checked={quickImportMode === 'MERGE'}
                      onChange={() => setQuickImportMode('MERGE')}
                    />
                    <span className="text-xs font-bold">Bổ sung thêm</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5 mt-0.5">
                    Giữ nguyên người đã chọn và đánh dấu thêm
                  </p>
                </label>

                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    quickImportMode === 'REPLACE'
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="quickImportMode"
                      checked={quickImportMode === 'REPLACE'}
                      onChange={() => setQuickImportMode('REPLACE')}
                    />
                    <span className="text-xs font-bold">Ghi đè danh sách</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5 mt-0.5">
                    Chỉ chọn đúng các mã SV vừa dán vào
                  </p>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickImportOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isBulkSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isBulkSaving ? 'Đang lưu...' : 'Áp Dụng Danh Sách'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
