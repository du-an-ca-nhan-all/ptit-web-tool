import React from 'react';
import { AdminAnnouncementsManagerProps } from './admin-announcements-manager/types';
import { useAdminAnnouncements } from './admin-announcements-manager/useAdminAnnouncements';
import { OverviewHeader } from './admin-announcements-manager/OverviewHeader';
import { FilterAndBulkBar } from './admin-announcements-manager/FilterAndBulkBar';
import { AnnouncementsTable } from './admin-announcements-manager/AnnouncementsTable';
import { AnnouncementFormModal } from './admin-announcements-manager/AnnouncementFormModal';
import { AnnouncementModals } from './admin-announcements-manager/AnnouncementModals';

export default function AdminAnnouncementsManager({
  currentUser,
}: AdminAnnouncementsManagerProps) {
  void currentUser;

  const {
    announcements,
    stats,
    pagination,
    setPagination,
    isLoading,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    displayModeFilter,
    setDisplayModeFilter,
    statusFilter,
    setStatusFilter,
    selectedIds,
    setSelectedIds,
    isFormModalOpen,
    setIsFormModalOpen,
    editingItem,
    previewItem,
    setPreviewItem,
    deletingId,
    setDeletingId,
    formData,
    setFormData,
    previewTab,
    setPreviewTab,
    isSaving,
    successMsg,
    errorMsg,
    fetchAnnouncements,
    handleOpenCreate,
    handleOpenEdit,
    handleSave,
    handleToggleStatus,
    handleDelete,
    handleBulkDelete,
  } = useAdminAnnouncements();

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-5 md:p-6 max-w-7xl mx-auto w-full gap-4 sm:gap-6 animate-in fade-in duration-200">
      <OverviewHeader
        stats={stats}
        isLoading={isLoading}
        successMsg={successMsg}
        errorMsg={errorMsg}
        onRefresh={fetchAnnouncements}
        onOpenCreate={handleOpenCreate}
      />

      <FilterAndBulkBar
        searchQuery={searchQuery}
        typeFilter={typeFilter}
        displayModeFilter={displayModeFilter}
        statusFilter={statusFilter}
        selectedCount={selectedIds.length}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
        onTypeFilterChange={(value) => {
          setTypeFilter(value);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
        onDisplayModeFilterChange={(value) => {
          setDisplayModeFilter(value);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
        onBulkDelete={handleBulkDelete}
      />

      <AnnouncementsTable
        announcements={announcements}
        isLoading={isLoading}
        selectedIds={selectedIds}
        pagination={pagination}
        onSelectAll={(checked) => {
          if (checked) {
            setSelectedIds(announcements.map((a) => a.id));
          } else {
            setSelectedIds([]);
          }
        }}
        onToggleSelect={(id, checked) => {
          if (checked) {
            setSelectedIds((prev) => [...prev, id]);
          } else {
            setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
          }
        }}
        onToggleStatus={handleToggleStatus}
        onPreview={setPreviewItem}
        onEdit={handleOpenEdit}
        onDelete={setDeletingId}
        onPageChange={(nextPage) => setPagination((p) => ({ ...p, page: nextPage }))}
      />

      {isFormModalOpen && (
        <AnnouncementFormModal
          editingItem={editingItem}
          formData={formData}
          previewTab={previewTab}
          isSaving={isSaving}
          onChangeFormData={setFormData}
          onChangePreviewTab={setPreviewTab}
          onSave={handleSave}
          onClose={() => setIsFormModalOpen(false)}
        />
      )}

      <AnnouncementModals
        previewItem={previewItem}
        deletingId={deletingId}
        onClosePreview={() => setPreviewItem(null)}
        onCancelDelete={() => setDeletingId(null)}
        onConfirmDelete={handleDelete}
      />
    </div>
  );
}
