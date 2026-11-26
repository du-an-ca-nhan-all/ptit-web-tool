import React from 'react';
import { Globe, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { SlinkConnectionGuide } from './SlinkConnectionGuide';
import { AdminExternalAccountsProps } from './admin-external-accounts/types';
import { useAdminExternalAccounts } from './admin-external-accounts/useAdminExternalAccounts';
import { AdminAccountsHeader } from './admin-external-accounts/AdminAccountsHeader';
import { AccountMetricsGrid } from './admin-external-accounts/AccountMetricsGrid';
import { AccountsFilterBar } from './admin-external-accounts/AccountsFilterBar';
import { MobileAccountCards } from './admin-external-accounts/MobileAccountCards';
import { DesktopAccountsTable } from './admin-external-accounts/DesktopAccountsTable';
import { TokenDetailModal } from './admin-external-accounts/TokenDetailModal';
import { AccountFormModal } from './admin-external-accounts/AccountFormModal';
import { DeleteAccountModal } from './admin-external-accounts/DeleteAccountModal';

export default function AdminExternalAccounts({ currentUser }: AdminExternalAccountsProps) {
  void currentUser;
  const {
    accounts,
    totalStudents,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedClass,
    setSelectedClass,
    selectedSystem,
    setSelectedSystem,
    statusFilter,
    setStatusFilter,
    visiblePasswords,
    successMsg,
    setSuccessMsg,
    errorMsg,
    setErrorMsg,
    isBatchTesting,
    testingId,
    copiedTokenId,
    viewingTokenAccount,
    setViewingTokenAccount,
    deletingAccount,
    setDeletingAccount,
    classList,
    filteredAccounts,
    metrics,
    fetchAccounts,
    toggleShowPassword,
    handleCopyToken,
    handleGetTokenSingle,
    handleBatchGetTokens,
    handleDeleteConfirm,
    handleExportCSV,
    formModal,
  } = useAdminExternalAccounts();

  return (
    <div className="p-3 sm:p-5 md:p-8 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Toast notifications */}
      {successMsg && (
        <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between shadow-xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
            <span className="leading-snug">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs sm:text-sm font-bold flex items-center justify-between shadow-xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Screen Header */}
      <AdminAccountsHeader
        isLoading={isLoading}
        isBatchTesting={isBatchTesting}
        accountsCount={accounts.length}
        onRefresh={fetchAccounts}
        onBatchGetTokens={handleBatchGetTokens}
        onExportCSV={handleExportCSV}
        onOpenAddModal={formModal.openAddModal}
      />

      {/* Metrics Cards */}
      <AccountMetricsGrid
        accountsCount={accounts.length}
        totalStudents={totalStudents}
        metrics={metrics}
      />

      {/* Filter and Table Container */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <AccountsFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedSystem={selectedSystem}
          onSystemChange={setSelectedSystem}
          selectedClass={selectedClass}
          onClassChange={setSelectedClass}
          classList={classList}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          totalCount={accounts.length}
          hasTokenCount={metrics.hasTokenCount}
          connectedCount={metrics.connectedCount}
        />

        {/* SLINK Guide Banner when filtered by SLINK_PTIT */}
        {selectedSystem === 'SLINK_PTIT' && (
          <div className="p-3 sm:p-4 pb-0">
            <SlinkConnectionGuide variant="banner" />
          </div>
        )}

        {/* Loading / Empty / Data Views */}
        {isLoading ? (
          <div className="py-16 sm:py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-bold">Đang tải danh sách tài khoản liên kết...</p>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="py-16 sm:py-20 text-center flex flex-col items-center justify-center gap-3 p-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Globe className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Không tìm thấy tài khoản liên kết nào</p>
            <p className="text-xs text-slate-400 max-w-sm">
              {searchQuery || selectedClass !== 'ALL' || selectedSystem !== 'ALL' || statusFilter !== 'ALL'
                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'
                : 'Chưa có sinh viên nào cấu hình tài khoản cổng liên kết.'}
            </p>
          </div>
        ) : (
          <>
            <MobileAccountCards
              accounts={filteredAccounts}
              visiblePasswords={visiblePasswords}
              testingId={testingId}
              copiedTokenId={copiedTokenId}
              onToggleShowPassword={toggleShowPassword}
              onViewToken={setViewingTokenAccount}
              onCopyToken={handleCopyToken}
              onGetTokenSingle={handleGetTokenSingle}
              onEdit={formModal.openEditModal}
              onDelete={setDeletingAccount}
            />

            <DesktopAccountsTable
              accounts={filteredAccounts}
              visiblePasswords={visiblePasswords}
              testingId={testingId}
              copiedTokenId={copiedTokenId}
              onToggleShowPassword={toggleShowPassword}
              onViewToken={setViewingTokenAccount}
              onCopyToken={handleCopyToken}
              onGetTokenSingle={handleGetTokenSingle}
              onEdit={formModal.openEditModal}
              onDelete={setDeletingAccount}
            />
          </>
        )}
      </div>

      {/* Modal View Full Token */}
      {viewingTokenAccount && (
        <TokenDetailModal
          account={viewingTokenAccount}
          onClose={() => setViewingTokenAccount(null)}
          onRefreshToken={handleGetTokenSingle}
        />
      )}

      {/* Modal Add / Edit Account */}
      {formModal.isModalOpen && (
        <AccountFormModal
          modalMode={formModal.modalMode}
          formData={formModal.formData}
          setFormData={formModal.setFormData}
          showModalPass={formModal.showModalPass}
          setShowModalPass={formModal.setShowModalPass}
          isSaving={formModal.isSaving}
          isModalTesting={formModal.isModalTesting}
          modalTestStatus={formModal.modalTestStatus}
          setModalTestStatus={formModal.setModalTestStatus}
          modalTestError={formModal.modalTestError}
          setModalTestError={formModal.setModalTestError}
          lastTestedModalUser={formModal.lastTestedModalUser}
          setLastTestedModalUser={formModal.setLastTestedModalUser}
          lastTestedModalPass={formModal.lastTestedModalPass}
          setLastTestedModalPass={formModal.setLastTestedModalPass}
          lastTestedModalRefreshToken={formModal.lastTestedModalRefreshToken}
          setValidatedModalAccessToken={formModal.setValidatedModalAccessToken}
          onClose={() => formModal.setIsModalOpen(false)}
          onTestCredentials={formModal.handleTestModalCredentials}
          onSubmit={formModal.handleSaveModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingAccount && (
        <DeleteAccountModal
          account={deletingAccount}
          onCancel={() => setDeletingAccount(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
