import React from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { DatabaseBackupManagerProps } from './database-backup-manager/types';
import { useDatabaseBackupManager } from './database-backup-manager/useDatabaseBackupManager';
import { BackupHeaderBanner } from './database-backup-manager/BackupHeaderBanner';
import { InstantActionBar } from './database-backup-manager/InstantActionBar';
import { RestoreSection } from './database-backup-manager/RestoreSection';
import { RestoreConfirmModal } from './database-backup-manager/RestoreConfirmModal';
import { OverviewStatsCards } from './database-backup-manager/OverviewStatsCards';
import { BackupActionCards } from './database-backup-manager/BackupActionCards';
import { ServerBackupsTable } from './database-backup-manager/ServerBackupsTable';
import { TableBreakdownSection } from './database-backup-manager/TableBreakdownSection';

export default function DatabaseBackupManager({ currentUser }: DatabaseBackupManagerProps) {
  const {
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
  } = useDatabaseBackupManager();

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
      <BackupHeaderBanner
        currentServerTime={currentServerTime}
        isLoading={isLoading}
        onRefresh={fetchBackupData}
      />

      {/* SECTION: 1-CLICK INSTANT ACTION BAR */}
      <InstantActionBar
        isCreatingBackup={isCreatingBackup}
        isSendingTelegram={isSendingTelegram}
        onCreateServerBackup={handleCreateServerBackup}
        onSendBackupToTelegram={handleSendBackupToTelegram}
      />

      {/* SECTION: DATABASE RESTORATION (PHỤC HỒI DỮ LIỆU) */}
      <RestoreSection
        stats={stats}
        fileInputRef={fileInputRef}
        onFileSelect={handleFileSelect}
      />

      {/* RESTORE CONFIRMATION MODAL */}
      {restoreTargetFile && (
        <RestoreConfirmModal
          restoreTargetFile={restoreTargetFile}
          restoreSourceType={restoreSourceType}
          confirmRestoreChecked={confirmRestoreChecked}
          isRestoring={isRestoring}
          onConfirmCheckedChange={setConfirmRestoreChecked}
          onClose={handleCloseRestoreModal}
          onExecuteRestore={handleExecuteRestore}
        />
      )}

      {/* Overview Stats Cards */}
      <OverviewStatsCards stats={stats} localBackupsCount={localBackups.length} />

      {/* Main Actions Panel: Export, Snapshot & Telegram */}
      <BackupActionCards
        stats={stats}
        isCreatingBackup={isCreatingBackup}
        isSendingTelegram={isSendingTelegram}
        onDirectDownload={handleDirectDownload}
        onCreateServerBackup={handleCreateServerBackup}
        onSendBackupToTelegram={handleSendBackupToTelegram}
      />

      {/* Server Backups List Section */}
      <ServerBackupsTable
        localBackups={localBackups}
        confirmDeleteFile={confirmDeleteFile}
        deletingFilename={deletingFilename}
        onOpenServerRestore={handleOpenServerRestore}
        onDownloadSavedFile={handleDownloadSavedFile}
        onRequestDelete={setConfirmDeleteFile}
        onConfirmDelete={handleDeleteBackup}
      />

      {/* Table Breakdown Section */}
      <TableBreakdownSection stats={stats} />
    </div>
  );
}
