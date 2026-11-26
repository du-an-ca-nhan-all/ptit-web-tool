import React, { useState } from 'react';
import {
  AccountFormData,
  ExternalAccountAdminItem,
  ModalMode,
  ModalTestStatus,
} from './types';
import { createDefaultFormData, createEditFormData } from './utils';

interface UseAccountFormModalParams {
  setSuccessMsg: (msg: string) => void;
  setErrorMsg: (msg: string) => void;
  fetchAccounts: () => Promise<void>;
}

export function useAccountFormModal({
  setSuccessMsg,
  setErrorMsg,
  fetchAccounts,
}: UseAccountFormModalParams) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('ADD');
  const [formData, setFormData] = useState<AccountFormData>(createDefaultFormData);
  const [showModalPass, setShowModalPass] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalTesting, setIsModalTesting] = useState(false);
  const [modalTestStatus, setModalTestStatus] = useState<ModalTestStatus>('IDLE');
  const [modalTestError, setModalTestError] = useState('');
  const [lastTestedModalUser, setLastTestedModalUser] = useState('');
  const [lastTestedModalPass, setLastTestedModalPass] = useState('');
  const [lastTestedModalRefreshToken, setLastTestedModalRefreshToken] = useState('');
  const [validatedModalAccessToken, setValidatedModalAccessToken] = useState('');

  const resetTestState = () => {
    setModalTestStatus('IDLE');
    setModalTestError('');
    setLastTestedModalUser('');
    setLastTestedModalPass('');
    setLastTestedModalRefreshToken('');
    setValidatedModalAccessToken('');
  };

  const openAddModal = () => {
    setModalMode('ADD');
    setFormData(createDefaultFormData());
    resetTestState();
    setIsModalOpen(true);
  };

  const openEditModal = (acc: ExternalAccountAdminItem) => {
    setModalMode('EDIT');
    setFormData(createEditFormData(acc));
    resetTestState();
    setIsModalOpen(true);
  };

  const handleTestModalCredentials = async () => {
    const isSlink = formData.systemKey === 'SLINK_PTIT';
    if (!formData.username.trim()) {
      setErrorMsg('Vui lòng nhập Mã sinh viên trước khi kiểm tra');
      return;
    }
    if (isSlink) {
      if (!formData.refreshToken.trim()) {
        setErrorMsg('Vui lòng nhập Refresh Token OAuth của PTIT S-Link trước khi kiểm tra');
        return;
      }
    } else {
      if (!formData.extUsername.trim()) {
        setErrorMsg(`Vui lòng nhập Tên đăng nhập ${formData.systemName} trước khi kiểm tra`);
        return;
      }
      if (!formData.extPassword.trim()) {
        setErrorMsg(`Vui lòng nhập Mật khẩu ${formData.systemName} trước khi kiểm tra`);
        return;
      }
    }

    const testUser = formData.extUsername.trim();
    const testPass = formData.extPassword.trim();
    const testRefresh = formData.refreshToken.trim();

    setIsModalTesting(true);
    setModalTestStatus('TESTING');
    setModalTestError('');
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/external-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isSlink
            ? {
                action: 'TEST',
                systemKey: formData.systemKey,
                systemName: formData.systemName,
                systemUrl: formData.systemUrl,
                targetUsername: formData.username.trim(),
                extUsername: testUser,
                refreshToken: testRefresh,
              }
            : {
                action: 'TEST',
                systemKey: formData.systemKey,
                systemName: formData.systemName,
                systemUrl: formData.systemUrl,
                targetUsername: formData.username.trim(),
                extUsername: testUser,
                extPassword: testPass,
              }
        ),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const rotatedRefresh = isSlink ? (data.refreshToken || testRefresh) : '';
        const detectedUser = isSlink ? (data.detectedUsername || testUser) : testUser;
        if (isSlink) {
          setFormData((prev) => ({
            ...prev,
            extUsername: detectedUser || prev.extUsername,
            refreshToken: rotatedRefresh || prev.refreshToken,
          }));
          setLastTestedModalRefreshToken(rotatedRefresh);
          setValidatedModalAccessToken(data.token || '');
        }
        setModalTestStatus('SUCCESS');
        setLastTestedModalUser(detectedUser);
        setLastTestedModalPass(testPass);
        setSuccessMsg(data.message || 'Kiểm tra kết nối thành công! Đã mở khóa nút Lưu.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const errMsg = data.error || 'Kiểm tra kết nối thất bại.';
        setModalTestStatus('FAILED');
        setModalTestError(errMsg);
        setLastTestedModalUser('');
        setLastTestedModalPass('');
        setLastTestedModalRefreshToken('');
        setValidatedModalAccessToken('');
        setErrorMsg(errMsg);
      }
    } catch {
      const errMsg = 'Lỗi kết nối máy chủ khi kiểm tra tài khoản.';
      setModalTestStatus('FAILED');
      setModalTestError(errMsg);
      setLastTestedModalUser('');
      setLastTestedModalPass('');
      setLastTestedModalRefreshToken('');
      setValidatedModalAccessToken('');
      setErrorMsg(errMsg);
    } finally {
      setIsModalTesting(false);
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const isSlink = formData.systemKey === 'SLINK_PTIT';
    if (!formData.username.trim()) {
      setErrorMsg('Vui lòng nhập Mã sinh viên');
      return;
    }
    if (isSlink) {
      if (!formData.refreshToken.trim()) {
        setErrorMsg('Vui lòng nhập Refresh Token OAuth');
        return;
      }
      const isTestPassed =
        modalTestStatus === 'SUCCESS' &&
        formData.refreshToken.trim() === lastTestedModalRefreshToken;
      if (!isTestPassed) {
        setErrorMsg('Yêu cầu bấm "Kiểm Tra" thành công trước khi có thể lưu cấu hình.');
        return;
      }
    } else {
      if (!formData.extUsername.trim()) {
        setErrorMsg('Vui lòng nhập Tên đăng nhập');
        return;
      }
      if (!formData.extPassword.trim()) {
        setErrorMsg('Vui lòng nhập Mật khẩu');
        return;
      }

      const isTestPassed =
        modalTestStatus === 'SUCCESS' &&
        formData.extUsername.trim() === lastTestedModalUser &&
        formData.extPassword.trim() === lastTestedModalPass;

      if (!isTestPassed) {
        setErrorMsg('Yêu cầu bấm "Kiểm Tra Kết Nối" thành công trước khi có thể lưu cấu hình.');
        return;
      }
    }

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/external-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isSlink
            ? {
                action: 'SAVE',
                systemKey: formData.systemKey,
                systemName: formData.systemName,
                systemUrl: formData.systemUrl,
                targetUsername: formData.username.trim(),
                extUsername: formData.extUsername.trim(),
                refreshToken: formData.refreshToken.trim(),
                accessToken: validatedModalAccessToken,
              }
            : {
                action: 'SAVE',
                systemKey: formData.systemKey,
                systemName: formData.systemName,
                systemUrl: formData.systemUrl,
                targetUsername: formData.username.trim(),
                extUsername: formData.extUsername.trim(),
                extPassword: formData.extPassword.trim(),
              }
        ),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Lưu cấu hình tài khoản thành công!');
        setIsModalOpen(false);
        fetchAccounts();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Có lỗi xảy ra khi lưu tài khoản');
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isModalOpen,
    setIsModalOpen,
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
    openAddModal,
    openEditModal,
    handleTestModalCredentials,
    handleSaveModal,
  };
}
