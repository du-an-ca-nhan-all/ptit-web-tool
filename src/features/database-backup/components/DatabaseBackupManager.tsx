import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Database,
  Download,
  HardDrive,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Server,
  Calendar,
  Clock,
  Layers,
  Users,
  Shield,
  ArrowDownToLine,
  Check,
  ChevronRight,
  ShieldAlert,
  Archive,
  RotateCcw,
  UploadCloud,
  FileUp,
  X,
  AlertTriangle,
} from 'lucide-react';
import { LoginUser } from '../../../types';

interface TableStat {
  name: string;
  label: string;
  count: number;
  description: string;
}

interface DatabaseStats {
  tables: {
    users: number;
    students: number;
    examBatches: number;
    examRecords: number;
    courseRegistrations: number;
    systemMeta: number;
    externalAccounts: number;
    activityLogs: number;
    telegramConfigs: number;
    globalConfigs: number;
    examReminderLogs: number;
    qldtAnnouncementLogs: number;
    classScheduleReminderLogs: number;
    registrationRequests: number;
  };
  tableBreakdown: TableStat[];
  totalRecords: number;
  dbFileSize: number;
  dbFileSizeFormatted: string;
  dbLastModified: string | null;
}

interface LocalBackupFile {
  name: string;
  format: 'sql' | 'json' | 'sqlite';
  size: number;
  sizeFormatted: string;
  createdAt: string;
}

interface DatabaseBackupManagerProps {
  currentUser: LoginUser;
}

export default function DatabaseBackupManager({ currentUser }: DatabaseBackupManagerProps) {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [localBackups, setLocalBackups] = useState<LocalBackupFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Snapshot Creation
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [deletingFilename, setDeletingFilename] = useState<string | null>(null);
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'all' | 'sql' | 'json'>('all');

  // Restoration State
  const [restoreTargetFile, setRestoreTargetFile] = useState<string | null>(null);
  const [restoreSourceType, setRestoreSourceType] = useState<'server' | 'upload'>('server');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [confirmRestoreChecked, setConfirmRestoreChecked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Server Time & Realtime Clock State
  const [currentServerTime, setCurrentServerTime] = useState<Date>(new Date());

  // Update ticking clock every second based on server time offset
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentServerTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatServerTime = (d: Date) => {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatServerDate = (d: Date) => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[d.getDay()];
    const date = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${dayName}, ${date}/${month}/${year}`;
  };

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchBackupData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/backup');
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
        setLocalBackups(data.localBackups || []);
      } else {
        showToast(data.error || 'Không thể tải thông tin cơ sở dữ liệu', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackupData();
  }, [fetchBackupData]);

  // Handle direct download from live DB
  const handleDirectDownload = (format: 'sql' | 'json') => {
    showToast(`Đang chuẩn bị tải về file ${format.toUpperCase()}...`, 'info');
    const url = `/api/backup?download=true&format=${format}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      showToast(`Đã bắt đầu tải file sao lưu ${format.toUpperCase()}`, 'success');
      fetchBackupData();
    }, 1000);
  };

  // Handle downloading an existing saved file on server
  const handleDownloadSavedFile = (filename: string) => {
    showToast(`Đang tải file ${filename}...`, 'info');
    const url = `/api/backup?download=true&file=${encodeURIComponent(filename)}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle creating snapshot on server (Chủ động tạo bản sao lưu)
  const handleCreateServerBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_SNAPSHOT', format: selectedFormat }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Đã tạo bản sao lưu máy chủ thành công!', 'success');
        if (data.stats) setStats(data.stats);
        if (data.localBackups) setLocalBackups(data.localBackups);
      } else {
        showToast(data.error || 'Không thể tạo bản sao lưu', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi kết nối máy chủ khi sao lưu', 'error');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Handle deleting a backup file
  const handleDeleteBackup = async (filename: string) => {
    setDeletingFilename(filename);
    try {
      const res = await fetch('/api/backup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `Đã xoá ${filename}`, 'success');
        setLocalBackups((prev) => prev.filter((f) => f.name !== filename));
      } else {
        showToast(data.error || 'Không thể xoá bản sao lưu', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi khi gửi yêu cầu xoá bản sao lưu', 'error');
    } finally {
      setDeletingFilename(null);
      setConfirmDeleteFile(null);
    }
  };

  // Open Restore Confirmation Modal for Server Snapshot
  const handleOpenServerRestore = (filename: string) => {
    setRestoreTargetFile(filename);
    setRestoreSourceType('server');
    setUploadedFile(null);
    setConfirmRestoreChecked(false);
  };

  // Handle File Input Selection for Upload & Restore
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const name = file.name.toLowerCase();
      if (!name.endsWith('.sql') && !name.endsWith('.json') && !name.endsWith('.sqlite') && !name.endsWith('.db')) {
        showToast('Vui lòng chọn file sao lưu có định dạng .sql, .json hoặc .sqlite / .db', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setUploadedFile(file);
      setRestoreTargetFile(file.name);
      setRestoreSourceType('upload');
      setConfirmRestoreChecked(false);
    }
  };

  // Execute Database Restoration
  const handleExecuteRestore = async () => {
    if (!confirmRestoreChecked) {
      showToast('Vui lòng tích chọn xác nhận trước khi phục hồi', 'error');
      return;
    }

    setIsRestoring(true);
    try {
      let res: Response;

      if (restoreSourceType === 'upload') {
        if (!uploadedFile) {
          showToast('Chưa chọn file sao lưu tải lên', 'error');
          setIsRestoring(false);
          return;
        }

        const formData = new FormData();
        formData.append('action', 'RESTORE_UPLOADED_FILE');
        formData.append('file', uploadedFile);

        res = await fetch('/api/backup', {
          method: 'POST',
          body: formData,
        });
      } else {
        if (!restoreTargetFile) {
          showToast('Chưa chọn file sao lưu để phục hồi', 'error');
          setIsRestoring(false);
          return;
        }

        res = await fetch('/api/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'RESTORE_SAVED_BACKUP',
            filename: restoreTargetFile,
          }),
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          data.message || 'Phục hồi cơ sở dữ liệu thành công! Bản sao lưu an toàn trước phục hồi đã được tạo.',
          'success'
        );
        if (data.stats) setStats(data.stats);
        if (data.localBackups) setLocalBackups(data.localBackups);
        setRestoreTargetFile(null);
        setUploadedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        showToast(data.error || 'Phục hồi cơ sở dữ liệu thất bại', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi kết nối máy chủ khi phục hồi', 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <div className="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-300">Đang tải trạng thái cơ sở dữ liệu và sao lưu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />}
          <span className="text-sm font-medium">{toast.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl shadow-inner">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Sao Lưu & Phục Hồi Cơ Sở Dữ Liệu
                </h1>
                <p className="text-slate-400 text-sm">
                  Quản lý sao lưu an toàn, tự động lúc <b>10:00 sáng VN</b> & <b>phục hồi dữ liệu tức thì</b> (từ Snapshot máy chủ hoặc tải lên từ máy tính)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Live Server Clock Widget */}
            <div
              className="flex items-center gap-3 px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-2xl shadow-inner backdrop-blur-md"
              title="Thời gian máy chủ (Server Time) được đồng bộ thời gian thực"
            >
              <div className="relative flex items-center justify-center pl-1">
                <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  <span>Ngày giờ máy chủ</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-sm font-black text-emerald-300 tracking-wider">
                    {formatServerTime(currentServerTime)}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-300">
                    {formatServerDate(currentServerTime)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={fetchBackupData}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* SECTION: 1-CLICK INSTANT ACTION BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Nút Chủ Động Sao Lưu Tức Thì
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">
                  Thao tác nhanh
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Nhấn để thực hiện sao lưu ngay lập tức:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Nút Chủ Động: Tạo Snapshot Máy Chủ */}
            <button
              onClick={handleCreateServerBackup}
              disabled={isCreatingBackup}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-950/60 transition cursor-pointer disabled:opacity-50 active:scale-98"
            >
              {isCreatingBackup ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang tạo snapshot...
                </>
              ) : (
                <>
                  <Server className="w-4 h-4 text-white" />
                  Tạo Snapshot Máy Chủ
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION: DATABASE RESTORATION (PHỤC HỒI DỮ LIỆU) */}
      <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-rose-950/30 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl shadow-inner">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Phục Hồi Cơ Sở Dữ Liệu (Database Restore)</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <ShieldAlert className="w-3 h-3 mr-1" />
                  Tự động sao lưu an toàn trước khi phục hồi
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Khôi phục toàn bộ 14 bảng dữ liệu hệ thống PostgreSQL từ file sao lưu <b>.sql</b>, <b>.json</b> hoặc file cũ <b>.sqlite / .db</b>
              </p>
            </div>
          </div>
        </div>

        {/* Upload File to Restore Card */}
        <div className="mt-5 bg-slate-950/60 border border-slate-800 rounded-xl p-4.5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-800 text-sky-400 rounded-xl">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Tải Lên File Sao Lưu Từ Máy Tính Để Phục Hồi</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Chấp nhận file <code className="text-sky-400 font-mono">.sql</code> (PostgreSQL), <code className="text-emerald-400 font-mono">.json</code> hoặc <code className="text-amber-400 font-mono">.sqlite / .db</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".sql,.json,.sqlite,.db"
              className="hidden"
              id="upload-backup-restore-input"
            />
            <label
              htmlFor="upload-backup-restore-input"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer shadow-sm active:scale-98"
            >
              <FileUp className="w-4 h-4 text-sky-400" />
              Chọn File Từ Máy Tính
            </label>
          </div>
        </div>
      </div>

      {/* RESTORE CONFIRMATION MODAL */}
      {restoreTargetFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Xác Nhận Phục Hồi Cơ Sở Dữ Liệu</h3>
                  <span className="text-xs text-amber-400 font-medium">Thao tác này sẽ thay thế dữ liệu hiện tại trong PostgreSQL</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setRestoreTargetFile(null);
                  setUploadedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 mb-6">
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="text-[11px] text-slate-500 mb-1">Nguồn phục hồi:</div>
                <div className="font-mono font-bold text-white flex items-center gap-2">
                  {restoreTargetFile.endsWith('.sql') ? (
                    <Database className="w-4 h-4 text-sky-400" />
                  ) : restoreTargetFile.endsWith('.json') ? (
                    <FileCode className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <HardDrive className="w-4 h-4 text-amber-400" />
                  )}
                  <span className="truncate">{restoreTargetFile}</span>
                  {restoreSourceType === 'upload' && (
                    <span className="px-1.5 py-0.5 bg-sky-500/20 text-sky-300 text-[10px] rounded">File Tải Lên</span>
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-200/90 leading-relaxed">
                <p className="font-bold mb-1 flex items-center gap-1.5 text-amber-300">
                  <Shield className="w-4 h-4" /> Bảo Vệ Dữ Liệu Tự Động:
                </p>
                Hệ thống sẽ <b>tự động tạo 1 bản sao lưu an toàn (Pre-Restore Snapshot)</b> của cơ sở dữ liệu hiện tại ngay trước khi phục hồi. Bạn có thể khôi phục lại bất kỳ lúc nào nếu cần.
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer p-3 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={confirmRestoreChecked}
                  onChange={(e) => setConfirmRestoreChecked(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500 bg-slate-900 border-slate-700 cursor-pointer shrink-0"
                />
                <span className="text-xs text-slate-200">
                  Tôi đã hiểu và xác nhận muốn phục hồi cơ sở dữ liệu từ bản sao lưu này.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRestoreTargetFile(null);
                  setUploadedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={isRestoring}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Huỷ bỏ
              </button>

              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={!confirmRestoreChecked || isRestoring}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-950/50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang phục hồi dữ liệu...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Bắt Đầu Phục Hồi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* DB File Size */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-medium">
            <span>Dung Lượng Database</span>
            <HardDrive className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {stats ? stats.dbFileSizeFormatted : '...'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 truncate">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span>
              {stats?.dbLastModified
                ? new Date(stats.dbLastModified).toLocaleString('vi-VN')
                : 'PostgreSQL Database'}
            </span>
          </div>
        </div>

        {/* Total Records */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-medium">
            <span>Tổng Bản Ghi</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            {stats ? stats.totalRecords.toLocaleString('vi-VN') : '...'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">14 bảng dữ liệu hệ thống</div>
        </div>

        {/* Students & Users */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-medium">
            <span>Sinh Viên & Tài Khoản</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400 tracking-tight">
            {stats ? stats.tables.students.toLocaleString('vi-VN') : '...'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats ? `${stats.tables.users.toLocaleString('vi-VN')} tài khoản đăng nhập` : '...'}
          </div>
        </div>

        {/* Exam Records */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-medium">
            <span>Lịch Thi & Ca Thi</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 tracking-tight">
            {stats ? stats.tables.examRecords.toLocaleString('vi-VN') : '...'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats ? `${stats.tables.examBatches} đợt thi đã tạo` : '...'}
          </div>
        </div>
      </div>

      {/* Main Actions Panel: Export & Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Direct Instant Download (PostgreSQL SQL Dump Live) */}
        <div className="bg-gradient-to-b from-sky-950/40 to-slate-900 border border-sky-500/20 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">File SQL Dump (.sql)</h3>
                <span className="text-xs text-sky-400 font-medium">Bản sao lưu chuẩn PostgreSQL</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Xuất trực tiếp toàn bộ 14 bảng thành file SQL PostgreSQL đầy đủ. Dễ dàng nạp bằng <code className="text-sky-300 font-mono">psql</code> hoặc phục hồi tức thì trên giao diện Web.
            </p>
          </div>
          <button
            onClick={() => handleDirectDownload('sql')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-900/30 transition cursor-pointer active:scale-98"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Tải File SQL Dump (.sql)
          </button>
        </div>

        {/* Card 2: Direct Instant Download (JSON Dump) */}
        <div className="bg-gradient-to-b from-emerald-950/40 to-slate-900 border border-emerald-500/20 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Dữ Liệu JSON Toàn Bộ (.json)</h3>
                <span className="text-xs text-emerald-400 font-medium">Dễ đọc, di động & phục hồi đa nền tảng</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Xuất toàn bộ 14 bảng dữ liệu cùng metadata thành định dạng JSON chuẩn. Thích hợp cho việc lưu trữ đám mây, phân tích hoặc di chuyển hệ thống.
            </p>
          </div>
          <button
            onClick={() => handleDirectDownload('json')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition cursor-pointer active:scale-98"
          >
            <Download className="w-4 h-4" />
            Tải Bản JSON Đầy Đủ (.json)
          </button>
        </div>

        {/* Card 3: Server Snapshot Creation */}
        <div className="bg-gradient-to-b from-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Lưu Trữ Trên Máy Chủ</h3>
                <span className="text-xs text-indigo-400 font-medium">Tạo snapshot trong thư mục backups/</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              Tạo bản lưu trữ đóng dấu thời gian trực tiếp trên máy chủ. Bạn có thể tải lại hoặc phục hồi bất kỳ lúc nào.
            </p>
            {/* Format choice */}
            <div className="flex items-center gap-2 mb-4">
              {(['all', 'sql', 'json'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg border transition cursor-pointer ${
                    selectedFormat === fmt
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {fmt === 'all' ? 'Cả 2 File' : fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleCreateServerBackup}
            disabled={isCreatingBackup}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-900/30 transition cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {isCreatingBackup ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Đang sao lưu...
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                Tạo Snapshot Máy Chủ
              </>
            )}
          </button>
        </div>
      </div>

      {/* Server Backups List Section */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <Archive className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="font-bold text-white text-base">Danh Sách Bản Sao Lưu Trên Máy Chủ</h2>
              <p className="text-xs text-slate-400">
                Thư mục <code className="text-indigo-400 font-mono">backups/</code> trên máy chủ ({localBackups.length} file) - Hỗ trợ tải về & <b>phục hồi trực tiếp</b>
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700">
            Dòng lệnh CLI: <code className="text-amber-300 font-mono">npm run db:backup -- --telegram</code>
          </div>
        </div>

        {localBackups.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Archive className="w-12 h-12 mx-auto mb-3 text-slate-600 opacity-60" />
            <p className="text-sm font-medium text-slate-300">Chưa có file sao lưu nào được lưu trên máy chủ</p>
            <p className="text-xs text-slate-500 mt-1">
              Bấm &quot;Tạo Snapshot Máy Chủ&quot; ở trên hoặc chạy <code className="text-slate-400 font-mono">npm run db:backup</code> từ terminal
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Tên File</th>
                  <th className="py-3 px-4 font-semibold">Định Dạng</th>
                  <th className="py-3 px-4 font-semibold">Dung Lượng</th>
                  <th className="py-3 px-4 font-semibold">Thời Gian Tạo</th>
                  <th className="py-3 px-4 font-semibold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {localBackups.map((file) => (
                  <tr key={file.name} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-slate-200 flex items-center gap-2">
                      {file.format === 'sql' ? (
                        <Database className="w-4 h-4 text-sky-400 shrink-0" />
                      ) : file.format === 'json' ? (
                        <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <HardDrive className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className="font-semibold">{file.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          file.format === 'sql'
                            ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                            : file.format === 'json'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {file.format === 'sql' ? 'SQL (POSTGRES)' : file.format === 'json' ? 'JSON' : 'SQLITE (CŨ)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{file.sizeFormatted}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(file.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Nút Phục Hồi từ file này */}
                        <button
                          onClick={() => handleOpenServerRestore(file.name)}
                          title="Phục hồi dữ liệu từ bản sao lưu này"
                          className="flex items-center gap-1 px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 rounded-lg border border-amber-500/30 transition cursor-pointer font-bold text-[11px]"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Phục hồi
                        </button>

                        <button
                          onClick={() => handleDownloadSavedFile(file.name)}
                          title="Tải về máy tính"
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-lg border border-indigo-500/30 transition cursor-pointer font-medium text-[11px]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Tải về
                        </button>

                        {confirmDeleteFile === file.name ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteBackup(file.name)}
                              disabled={deletingFilename === file.name}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold cursor-pointer transition disabled:opacity-50"
                            >
                              {deletingFilename === file.name ? '...' : 'Xác nhận xoá'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteFile(null)}
                              className="px-2 py-1 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-[11px] cursor-pointer"
                            >
                              Huỷ
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteFile(file.name)}
                            title="Xoá file sao lưu"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-900/50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Table Breakdown Section */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="font-bold text-white text-base">Chi Tiết 14 Bảng Dữ Liệu Trong Database</h2>
              <p className="text-xs text-slate-400">
                Thống kê số lượng bản ghi thực tế được bao gồm trong mỗi lần xuất/sao lưu & phục hồi
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Tên Model / Bảng</th>
                <th className="py-3 px-4 font-semibold">Mô Tả & Ý Nghĩa Dữ Liệu</th>
                <th className="py-3 px-4 font-semibold text-right">Số Lượng Bản Ghi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {stats?.tableBreakdown?.map((tbl) => (
                <tr key={tbl.name} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                    {tbl.name}
                    <div className="text-[11px] font-sans font-normal text-slate-400 mt-0.5">{tbl.label}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 leading-relaxed">{tbl.description}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                      {tbl.count.toLocaleString('vi-VN')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
