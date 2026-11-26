'use client';

import React from 'react';
import { Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { RemindersManagerProps } from './reminders-manager/types';
import { useRemindersData } from './reminders-manager/useRemindersData';
import { useReminderForm } from './reminders-manager/useReminderForm';
import { RemindersHeaderBanner } from './reminders-manager/RemindersHeaderBanner';
import { RemindersStatsAndFilters } from './reminders-manager/RemindersStatsAndFilters';
import { ReminderCard } from './reminders-manager/ReminderCard';
import { ReminderFormModal } from './reminders-manager/ReminderFormModal';
import { ReminderDetailModal } from './reminders-manager/ReminderDetailModal';

export default function RemindersManager({
  currentUser,
  onNavigateToTelegramConfig,
  onNavigateToCalendar,
}: RemindersManagerProps) {
  const {
    isLoading,
    isRefreshing,
    errorMsg,
    setErrorMsg,
    successMsg,
    setSuccessMsg,
    expandedDescriptions,
    toggleExpandDescription,
    viewingReminder,
    setViewingReminder,
    copiedKey,
    handleCopyText,
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    enrolledCourses,
    fetchReminders,
    handleToggleComplete,
    handleDeleteReminder,
    handleDismissReminder,
    filteredReminders,
    stats,
  } = useRemindersData();

  const {
    isModalOpen,
    setIsModalOpen,
    editingReminder,
    isSubmitting,
    formData,
    setFormData,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleToggleOffset,
    handleAddCustomOffset,
    handleRemoveOffset,
    handleSubmitForm,
  } = useReminderForm({
    enrolledCourses,
    setErrorMsg,
    setSuccessMsg,
    fetchReminders,
  });

  return (
    <div className="flex flex-col gap-5 p-3 sm:p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* ── HEADER BANNER ── */}
      <RemindersHeaderBanner onOpenCreateModal={handleOpenCreateModal} />

      {/* ── SUCCESS / ERROR FEEDBACK ── */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── STATS CARDS & FILTER BAR ── */}
      <RemindersStatsAndFilters
        stats={stats}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchReminders(true)}
      />

      {/* ── REMINDER LIST ── */}
      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Đang tải lịch nhắc hẹn...</p>
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Bell className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Chưa có lịch nhắc hẹn nào</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Tạo lời nhắc cho các bài tập lớn, thi giữa kỳ, nộp báo cáo hoặc các sự kiện quan trọng để hệ thống nhắc qua Telegram!
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleOpenCreateModal('PERSONAL')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer"
            >
              + Tạo Nhắc Hẹn Cá Nhân
            </button>
            <button
              onClick={() => handleOpenCreateModal('COURSE')}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-all cursor-pointer"
            >
              + Tạo Nhắc Hẹn Môn Học
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              currentUsername={currentUser.username}
              isExpanded={expandedDescriptions.has(reminder.id)}
              onToggleExpand={toggleExpandDescription}
              onView={setViewingReminder}
              onToggleComplete={handleToggleComplete}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteReminder}
              onDismiss={handleDismissReminder}
            />
          ))}
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ── */}
      {isModalOpen && (
        <ReminderFormModal
          editingReminder={editingReminder}
          formData={formData}
          setFormData={setFormData}
          enrolledCourses={enrolledCourses}
          isSubmitting={isSubmitting}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitForm}
          onToggleOffset={handleToggleOffset}
          onAddCustomOffset={handleAddCustomOffset}
          onRemoveOffset={handleRemoveOffset}
        />
      )}

      {/* ── DETAIL VIEW MODAL (Xem chi tiết nhắc hẹn) ── */}
      {viewingReminder && (
        <ReminderDetailModal
          reminder={viewingReminder}
          currentUsername={currentUser.username}
          copiedKey={copiedKey}
          onCopyText={handleCopyText}
          onToggleComplete={(r) => {
            handleToggleComplete(r);
            setViewingReminder((prev) => (prev ? { ...prev, isCompleted: !prev.isCompleted } : null));
          }}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteReminder}
          onDismiss={handleDismissReminder}
          onClose={() => setViewingReminder(null)}
        />
      )}
    </div>
  );
}
