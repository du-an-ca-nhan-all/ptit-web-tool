import React from 'react';
import {
  BookOpen,
  Smartphone,
  Globe,
  X,
  RefreshCw,
  CheckCircle2,
  Lock,
  Check,
} from 'lucide-react';
import { AccountFormData, ModalMode, ModalTestStatus } from './types';
import { isModalTestPassed } from './utils';
import { AccountFormFields } from './AccountFormFields';
import { AccountFormTestBanner } from './AccountFormTestBanner';

interface AccountFormModalProps {
  modalMode: ModalMode;
  formData: AccountFormData;
  setFormData: React.Dispatch<React.SetStateAction<AccountFormData>>;
  showModalPass: boolean;
  setShowModalPass: React.Dispatch<React.SetStateAction<boolean>>;
  isSaving: boolean;
  isModalTesting: boolean;
  modalTestStatus: ModalTestStatus;
  setModalTestStatus: (status: ModalTestStatus) => void;
  modalTestError: string;
  setModalTestError: (err: string) => void;
  lastTestedModalUser: string;
  setLastTestedModalUser: (val: string) => void;
  lastTestedModalPass: string;
  setLastTestedModalPass: (val: string) => void;
  lastTestedModalRefreshToken: string;
  setValidatedModalAccessToken: (val: string) => void;
  onClose: () => void;
  onTestCredentials: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AccountFormModal({
  modalMode,
  formData,
  setFormData,
  showModalPass,
  setShowModalPass,
  isSaving,
  isModalTesting,
  modalTestStatus,
  setModalTestStatus,
  modalTestError,
  setModalTestError,
  lastTestedModalUser,
  setLastTestedModalUser,
  lastTestedModalPass,
  setLastTestedModalPass,
  lastTestedModalRefreshToken,
  setValidatedModalAccessToken,
  onClose,
  onTestCredentials,
  onSubmit,
}: AccountFormModalProps) {
  const isSlink = formData.systemKey === 'SLINK_PTIT';
  const isTestPassed = isModalTestPassed({
    formData,
    modalTestStatus,
    lastTestedModalUser,
    lastTestedModalPass,
    lastTestedModalRefreshToken,
  });

  const systemShortLabel =
    formData.systemKey === 'LMS_PTTC1'
      ? 'LMS'
      : formData.systemKey === 'SLINK_PTIT'
      ? 'PTIT S-Link'
      : 'QLDTTX';

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              {formData.systemKey === 'LMS_PTTC1' ? (
                <BookOpen className="w-5 h-5 text-white" />
              ) : formData.systemKey === 'SLINK_PTIT' ? (
                <Smartphone className="w-5 h-5 text-white" />
              ) : (
                <Globe className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {modalMode === 'ADD'
                  ? `Thêm Cấu Hình Tài Khoản ${systemShortLabel}`
                  : `Chỉnh Sửa Tài Khoản ${systemShortLabel}`}
              </h3>
              <p className="text-xs text-indigo-100 mt-0.5 font-mono truncate max-w-[220px] sm:max-w-xs">
                {formData.systemUrl}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 sm:p-6 flex flex-col gap-3.5 sm:gap-4 overflow-y-auto">
          <AccountFormFields
            modalMode={modalMode}
            formData={formData}
            setFormData={setFormData}
            showModalPass={showModalPass}
            setShowModalPass={setShowModalPass}
            setModalTestStatus={setModalTestStatus}
            setModalTestError={setModalTestError}
            setLastTestedModalUser={setLastTestedModalUser}
            setLastTestedModalPass={setLastTestedModalPass}
            setValidatedModalAccessToken={setValidatedModalAccessToken}
          />

          <AccountFormTestBanner
            isTestPassed={isTestPassed}
            modalTestStatus={modalTestStatus}
            modalTestError={modalTestError}
          />

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-3 sm:pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-center"
            >
              Hủy
            </button>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onTestCredentials}
                disabled={
                  isModalTesting ||
                  (isSlink
                    ? !formData.refreshToken.trim()
                    : !formData.extUsername.trim() || !formData.extPassword.trim())
                }
                className={`px-3 sm:px-4 py-2.5 sm:py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isTestPassed
                    ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                    : 'bg-sky-600 hover:bg-sky-700 text-white'
                }`}
              >
                {isModalTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : isTestPassed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>{isModalTesting ? 'Đang Test...' : isTestPassed ? 'Đã Test' : 'Kiểm Tra'}</span>
              </button>

              <button
                type="submit"
                disabled={isSaving || !isTestPassed}
                className={`px-4 sm:px-5 py-2.5 sm:py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  !isTestPassed
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 cursor-pointer active:scale-95'
                }`}
              >
                {isSaving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : !isTestPassed ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{modalMode === 'ADD' ? 'Lưu' : 'Cập Nhật'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
