'use client';

import React from 'react';
import { UserCheck, RefreshCw, ShieldAlert } from 'lucide-react';
import AdminResetPasswordModal from './AdminResetPasswordModal';
import { AdminRegistrationManagerProps, RegistrationItem } from './admin-registration-manager/types';
import { useAdminRegistrations } from './admin-registration-manager/useAdminRegistrations';
import { RegistrationHeaderAndMetrics } from './admin-registration-manager/RegistrationHeaderAndMetrics';
import { RegistrationMobileList } from './admin-registration-manager/RegistrationMobileList';
import { RegistrationDesktopTable } from './admin-registration-manager/RegistrationDesktopTable';
import { RejectRegistrationModal } from './admin-registration-manager/RejectRegistrationModal';

export default function AdminRegistrationManager({ currentUser }: AdminRegistrationManagerProps) {
  const {
    requests,
    counts,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedIds,
    isProcessing,
    successMsg,
    errorMsg,
    rejectingItem,
    setRejectingItem,
    rejectReason,
    setRejectReason,
    isResetModalOpen,
    setIsResetModalOpen,
    resetModalUser,
    setResetModalUser,
    isAdmin,
    fetchRequests,
    handleApprove,
    handleConfirmReject,
    handleDeleteRequest,
    handleToggleSelect,
    handleSelectAll,
  } = useAdminRegistrations(currentUser);

  const handleOpenRejectModal = (item: RegistrationItem) => {
    setRejectingItem(item);
    setRejectReason('');
  };

  const handleOpenUserResetModal = (item: RegistrationItem) => {
    setResetModalUser({
      username: item.username,
      fullName: item.fullName || item.username,
      lop: item.lop || '',
    });
    setIsResetModalOpen(true);
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto my-8">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-3xl mb-4 shadow-sm">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-black text-slate-800 mb-2">Quyền Truy Cập Bị Giới Hạn</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Màn hình Duyệt Đăng Ký Tài Khoản chỉ hiển thị và cho phép truy cập với Quản trị viên (Admin).
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full gap-6 animate-in fade-in duration-300">
      <RegistrationHeaderAndMetrics
        counts={counts}
        isLoading={isLoading}
        isProcessing={isProcessing}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        selectedIds={selectedIds}
        successMsg={successMsg}
        errorMsg={errorMsg}
        onSearchChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
        onRefresh={() => fetchRequests()}
        onOpenResetModal={() => {
          setResetModalUser({ username: '', fullName: '', lop: '' });
          setIsResetModalOpen(true);
        }}
        onBulkApprove={() => handleApprove(selectedIds)}
      />

      {/* Main Request List / Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[300px]">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-xs font-medium">Đang tải danh sách yêu cầu đăng ký...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[300px] text-center">
            <UserCheck className="w-12 h-12 text-slate-300" />
            <span className="text-sm font-bold text-slate-700">Không có yêu cầu đăng ký nào phù hợp</span>
            <span className="text-xs text-slate-400 max-w-sm">
              Tất cả các tài khoản sinh viên đã được xử lý hoặc chưa có sinh viên gửi yêu cầu trong bộ lọc này.
            </span>
          </div>
        ) : (
          <>
            <RegistrationMobileList
              requests={requests}
              selectedIds={selectedIds}
              isProcessing={isProcessing}
              onToggleSelect={handleToggleSelect}
              onApprove={handleApprove}
              onOpenReject={handleOpenRejectModal}
              onOpenResetPassword={handleOpenUserResetModal}
              onDelete={handleDeleteRequest}
            />
            <RegistrationDesktopTable
              requests={requests}
              selectedIds={selectedIds}
              isProcessing={isProcessing}
              onSelectAll={handleSelectAll}
              onToggleSelect={handleToggleSelect}
              onApprove={handleApprove}
              onOpenReject={handleOpenRejectModal}
              onOpenResetPassword={handleOpenUserResetModal}
              onDelete={handleDeleteRequest}
            />
          </>
        )}
      </div>

      <RejectRegistrationModal
        rejectingItem={rejectingItem}
        rejectReason={rejectReason}
        isProcessing={isProcessing}
        onReasonChange={setRejectReason}
        onClose={() => setRejectingItem(null)}
        onConfirm={handleConfirmReject}
      />

      {/* Admin Reset Password Modal */}
      <AdminResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        initialUsername={resetModalUser.username}
        initialFullName={resetModalUser.fullName}
        initialClass={resetModalUser.lop}
        onSuccess={() => {
          fetchRequests();
        }}
      />
    </div>
  );
}
