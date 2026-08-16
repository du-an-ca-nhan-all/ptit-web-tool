import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Download,
  HardDrive,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FileSpreadsheet,
  Server,
  Calendar,
  Clock,
  Layers,
  Users,
  Shield,
  ArrowDownToLine,
  Sparkles,
  Check,
  ChevronRight,
  Info,
  FileText,
  Copy,
  ExternalLink,
  ShieldAlert,
  Archive,
} from 'lucide-react';
import { LoginUser } from '../types';

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
  format: 'sqlite' | 'json';
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
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [deletingFilename, setDeletingFilename] = useState<string | null>(null);
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'all' | 'sqlite' | 'json'>('all');

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
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
  const handleDirectDownload = (format: 'sqlite' | 'json') => {
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

  // Handle creating snapshot on server
  const handleCreateServerBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: selectedFormat }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Đã tạo bản sao lưu thành công!', 'success');
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
                  Sao Lưu & Xuất Dữ Liệu Cơ Sở Dữ Liệu
                </h1>
                <p className="text-slate-400 text-sm">
                  Quản lý sao lưu an toàn toàn bộ dữ liệu hệ thống (SQLite binary & JSON export)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchBackupData}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>
      </div>

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
                : 'dev.db SQLite'}
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
        {/* Card 1: Direct Instant Download (SQLite Live) */}
        <div className="bg-gradient-to-b from-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">File SQLite Gốc (.sqlite)</h3>
                <span className="text-xs text-indigo-400 font-medium">Sao lưu nhị phân đầy đủ 100%</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Tải trực tiếp bản sao lưu file SQLite live (<code className="text-indigo-300 font-mono">dev.db</code>). Phù hợp để phục hồi tức thì, mở bằng DB Browser hoặc Prisma Studio.
            </p>
          </div>
          <button
            onClick={() => handleDirectDownload('sqlite')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-900/30 transition cursor-pointer active:scale-98"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Tải File SQLite (.sqlite)
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
                <span className="text-xs text-emerald-400 font-medium">Dễ đọc, chuyển đổi & di chuyển</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Xuất toàn bộ 14 bảng dữ liệu cùng metadata thành định dạng JSON chuẩn. Thích hợp cho việc phân tích, di chuyển sang cơ sở dữ liệu khác (Postgres, MySQL).
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
        <div className="bg-gradient-to-b from-sky-950/40 to-slate-900 border border-sky-500/20 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Lưu Trữ Trên Máy Chủ</h3>
                <span className="text-xs text-sky-400 font-medium">Tạo snapshot trong thư mục backups/</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              Tạo bản lưu trữ đóng dấu thời gian trực tiếp trên máy chủ. Bạn có thể tải lại hoặc quản lý bất kỳ lúc nào.
            </p>
            {/* Format choice */}
            <div className="flex items-center gap-2 mb-4">
              {(['all', 'sqlite', 'json'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg border transition cursor-pointer ${
                    selectedFormat === fmt
                      ? 'bg-sky-600 text-white border-sky-400 shadow-sm'
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
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-900/30 transition cursor-pointer disabled:opacity-50 active:scale-98"
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
                Thư mục <code className="text-indigo-400 font-mono">backups/</code> trên máy chủ ({localBackups.length} file)
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700">
            Dòng lệnh CLI: <code className="text-amber-300 font-mono">npm run db:backup</code>
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
                      {file.format === 'sqlite' ? (
                        <Database className="w-4 h-4 text-indigo-400 shrink-0" />
                      ) : (
                        <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <span className="font-semibold">{file.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          file.format === 'sqlite'
                            ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {file.format.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{file.sizeFormatted}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(file.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
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
                Thống kê số lượng bản ghi thực tế được bao gồm trong mỗi lần xuất/sao lưu
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
