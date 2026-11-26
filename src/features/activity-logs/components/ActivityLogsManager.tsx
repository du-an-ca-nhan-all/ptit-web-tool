import React from 'react';
import { ActivityLogsManagerProps } from './activity-logs-manager/types';
import { useActivityLogs } from './activity-logs-manager/useActivityLogs';
import { ActivityLogsHeader } from './activity-logs-manager/ActivityLogsHeader';
import { ActivityLogsFilters } from './activity-logs-manager/ActivityLogsFilters';
import { ActivityLogsList } from './activity-logs-manager/ActivityLogsList';
import { ActivityLogMetadataModal } from './activity-logs-manager/ActivityLogMetadataModal';
import { DeleteActivityLogsModal } from './activity-logs-manager/DeleteActivityLogsModal';

export default function ActivityLogsManager({ currentUser }: ActivityLogsManagerProps) {
  const {
    logs,
    isLoading,
    searchQuery,
    setSearchQuery,
    actionFilter,
    setActionFilter,
    selectedCategory,
    setSelectedCategory,
    pagination,
    selectedLogMetadata,
    setSelectedLogMetadata,
    copiedJson,
    metadataViewTab,
    setMetadataViewTab,
    filteredAvailableActions,
    displayedLogs,
    isAdmin,
    showDeleteModal,
    setShowDeleteModal,
    deleteMode,
    setDeleteMode,
    deleteCount,
    setDeleteCount,
    customCountInput,
    setCustomCountInput,
    deleteDays,
    setDeleteDays,
    cleanReminderLogs,
    setCleanReminderLogs,
    isDeleting,
    deleteSuccessMsg,
    deleteErrorMsg,
    setDeleteErrorMsg,
    confirmAllText,
    setConfirmAllText,
    fetchLogs,
    handleCopyJson,
    handleDeleteLogs,
    openLogMetadata,
    openDeleteModal,
  } = useActivityLogs(currentUser);

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-5 md:p-8 max-w-7xl mx-auto w-full gap-4 sm:gap-6 animate-in fade-in duration-300">
      <ActivityLogsHeader
        pagination={pagination}
        isAdmin={isAdmin}
        isLoading={isLoading}
        onOpenDeleteModal={openDeleteModal}
        onRefresh={() => fetchLogs(pagination.page)}
      />

      <ActivityLogsFilters
        selectedCategory={selectedCategory}
        onSelectCategory={(category) => {
          setSelectedCategory(category);
          setActionFilter('');
        }}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        actionFilter={actionFilter}
        onActionFilterChange={setActionFilter}
        filteredAvailableActions={filteredAvailableActions}
        pagination={pagination}
        isLoading={isLoading}
        onFetchPage={fetchLogs}
      />

      <ActivityLogsList
        logs={logs}
        displayedLogs={displayedLogs}
        isLoading={isLoading}
        pagination={pagination}
        onSelectLog={openLogMetadata}
        onFetchPage={fetchLogs}
      />

      {selectedLogMetadata && (
        <ActivityLogMetadataModal
          selectedLogMetadata={selectedLogMetadata}
          metadataViewTab={metadataViewTab}
          onChangeTab={setMetadataViewTab}
          copiedJson={copiedJson}
          onCopyJson={handleCopyJson}
          onClose={() => setSelectedLogMetadata(null)}
        />
      )}

      {showDeleteModal && (
        <DeleteActivityLogsModal
          totalLogs={pagination.total}
          deleteMode={deleteMode}
          onChangeDeleteMode={setDeleteMode}
          deleteCount={deleteCount}
          onChangeDeleteCount={setDeleteCount}
          customCountInput={customCountInput}
          onChangeCustomCountInput={setCustomCountInput}
          deleteDays={deleteDays}
          onChangeDeleteDays={setDeleteDays}
          cleanReminderLogs={cleanReminderLogs}
          onChangeCleanReminderLogs={setCleanReminderLogs}
          isDeleting={isDeleting}
          deleteSuccessMsg={deleteSuccessMsg}
          deleteErrorMsg={deleteErrorMsg}
          onClearErrorMsg={() => setDeleteErrorMsg('')}
          confirmAllText={confirmAllText}
          onChangeConfirmAllText={setConfirmAllText}
          onClose={() => setShowDeleteModal(false)}
          onConfirmDelete={handleDeleteLogs}
        />
      )}
    </div>
  );
}
