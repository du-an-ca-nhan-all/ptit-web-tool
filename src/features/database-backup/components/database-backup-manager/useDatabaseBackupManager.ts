import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BackupToast,
  DatabaseStats,
  LocalBackupFile,
  RestoreSourceType,
} from './types';
import { isValidBackupFilename, triggerFileDownload } from './utils';

export function useDatabaseBackupManager() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [localBackups, setLocalBackups] = useState<LocalBackupFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Snapshot & Telegram Creation
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [deletingFilename, setDeletingFilename] = useState<string | null>(null);
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<string | null>(null);
  const [toast, setToast] = useState<BackupToast | null>(null);

  // Restoration State
  const [restoreTargetFile, setRestoreTargetFile] = useState<string | null>(null);
  const [restoreSourceType, setRestoreSourceType] = useState<RestoreSourceType>('server');
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

  // Handle direct download SQL dump from live DB
  const handleDirectDownload = () => {
    showToast('Đang chuẩn bị tải về file SQL Dump...', 'info');
    triggerFileDownload('/api/backup?download=true&format=sql', '');
    setTimeout(() => {
      showToast('Đã bắt đầu tải file sao lưu SQL Dump', 'success');
      fetchBackupData();
    }, 1000);
  };

  // Handle downloading an existing saved file on server
  const handleDownloadSavedFile = (filename: string) => {
    showToast(`Đang tải file ${filename}...`, 'info');
    const url = `/api/backup?download=true&file=${encodeURIComponent(filename)}`;
    triggerFileDownload(url, filename);
  };

  // Handle creating snapshot on server (Chủ động tạo bản sao lưu SQL)
  const handleCreateServerBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_SNAPSHOT' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Đã tạo bản sao lưu SQL máy chủ thành công!', 'success');
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

  // Handle creating SQL backup and sending directly to Telegram
  const handleSendBackupToTelegram = async () => {
    setIsSendingTelegram(true);
    showToast('Đang tạo bản sao lưu SQL và gửi về Telegram...', 'info');
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SEND_TELEGRAM', format: 'sql' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Đã gửi file sao lưu SQL lên Telegram thành công!', 'success');
        fetchBackupData();
      } else {
        showToast(data.error || 'Gửi file sao lưu lên Telegram thất bại', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi kết nối máy chủ khi gửi sao lưu lên Telegram', 'error');
    } finally {
      setIsSendingTelegram(false);
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

  const handleCloseRestoreModal = () => {
    setRestoreTargetFile(null);
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle File Input Selection for Upload & Restore
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (!isValidBackupFilename(file.name)) {
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

  return {
    stats,
    localBackups,
    isLoading,
    isCreatingBackup,
    isSendingTelegram,
    deletingFilename,
    confirmDeleteFile,
    setConfirmDeleteFile,
    toast,
    restoreTargetFile,
    restoreSourceType,
    isRestoring,
    confirmRestoreChecked,
    setConfirmRestoreChecked,
    fileInputRef,
    currentServerTime,
    fetchBackupData,
    handleDirectDownload,
    handleDownloadSavedFile,
    handleCreateServerBackup,
    handleSendBackupToTelegram,
    handleDeleteBackup,
    handleOpenServerRestore,
    handleCloseRestoreModal,
    handleFileSelect,
    handleExecuteRestore,
  };
}
