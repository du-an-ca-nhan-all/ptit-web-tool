'use client';

import React, { useState, useEffect } from 'react';
import { ExternalAccountFormMap } from './types';
import {
  buildInitialExternalFormMap,
  buildSaveExternalAccountPayload,
  buildTestExternalAccountPayload,
  createFallbackExternalFormEntry,
  validateSaveExternalAccount,
  validateTestExternalAccount,
} from './utils';

interface UseExternalAccountsParams {
  currentUsername: string;
  setSuccessMsg: React.Dispatch<React.SetStateAction<string>>;
  setErrorMsg: React.Dispatch<React.SetStateAction<string>>;
}

export function useExternalAccounts({
  currentUsername,
  setSuccessMsg,
  setErrorMsg,
}: UseExternalAccountsParams) {
  const [externalAccounts, setExternalAccounts] = useState<any[]>([]);
  const [isLoadingExternal, setIsLoadingExternal] = useState(false);
  const [extForm, setExtForm] = useState<ExternalAccountFormMap>({});

  // Fetch External Accounts
  const fetchExternalAccounts = async () => {
    setIsLoadingExternal(true);
    try {
      const res = await fetch('/api/external-accounts');
      const data = await res.json();
      if (res.ok && data.accounts) {
        setExternalAccounts(data.accounts);
        setExtForm((prev) => buildInitialExternalFormMap(data.accounts, prev, currentUsername));
      }
    } catch (err) {
      console.error('Fetch external accounts error:', err);
    } finally {
      setIsLoadingExternal(false);
    }
  };

  useEffect(() => {
    fetchExternalAccounts();
  }, []);

  // Save / Connect External Account
  const handleSaveExternalAccount = async (sys: any) => {
    setErrorMsg('');
    setSuccessMsg('');
    const isSlink = sys.systemKey === 'SLINK_PTIT';
    const form = extForm[sys.systemKey] || createFallbackExternalFormEntry(sys, currentUsername);

    const validationError = validateSaveExternalAccount(form, isSlink);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setExtForm((prev) => ({
      ...prev,
      [sys.systemKey]: { ...prev[sys.systemKey], isSaving: true },
    }));

    try {
      const res = await fetch('/api/external-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSaveExternalAccountPayload(sys, form, isSlink)),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Lưu cấu hình tài khoản thành công!');
        fetchExternalAccounts();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Có lỗi xảy ra khi lưu tài khoản');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setExtForm((prev) => ({
        ...prev,
        [sys.systemKey]: { ...prev[sys.systemKey], isSaving: false },
      }));
    }
  };

  // Test Connection
  const handleTestConnection = async (sys: any) => {
    setErrorMsg('');
    setSuccessMsg('');
    const isSlink = sys.systemKey === 'SLINK_PTIT';
    const form = extForm[sys.systemKey] || createFallbackExternalFormEntry(sys, currentUsername);

    const targetUser = form.username ? form.username.trim() : sys.extUsername || '';
    const targetPass = form.password ? form.password.trim() : '';
    const targetRefreshToken = form.refreshToken ? form.refreshToken.trim() : '';

    const validationError = validateTestExternalAccount({
      sys,
      targetUser,
      targetPass,
      targetRefreshToken,
      isSlink,
    });
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setExtForm((prev) => ({
      ...prev,
      [sys.systemKey]: {
        ...prev[sys.systemKey],
        isTesting: true,
        testStatus: 'TESTING',
        testMessage: '',
      },
    }));

    try {
      const res = await fetch('/api/external-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildTestExternalAccountPayload({
            sys,
            targetUser,
            targetPass,
            targetRefreshToken,
            isSlink,
          })
        ),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const nextRefreshToken = isSlink ? (data.refreshToken || targetRefreshToken) : '';
        const nextUsername = isSlink ? (data.detectedUsername || targetUser) : targetUser;
        setExtForm((prev) => ({
          ...prev,
          [sys.systemKey]: {
            ...prev[sys.systemKey],
            username: nextUsername,
            ...(isSlink && nextRefreshToken ? { refreshToken: nextRefreshToken } : {}),
            ...(isSlink && data.token ? { validatedAccessToken: data.token } : {}),
            isTesting: false,
            testStatus: 'SUCCESS',
            testMessage: data.message || 'Kiểm tra kết nối và xác thực tài khoản thành công!',
            lastTestedUser: nextUsername,
            lastTestedPass: targetPass,
            lastTestedRefreshToken: nextRefreshToken,
          },
        }));
        setSuccessMsg(data.message || 'Kiểm tra kết nối thành công! Đã mở khóa nút Lưu.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const errMsg = data.error || 'Kiểm tra kết nối thất bại.';
        setExtForm((prev) => ({
          ...prev,
          [sys.systemKey]: {
            ...prev[sys.systemKey],
            isTesting: false,
            testStatus: 'FAILED',
            testMessage: errMsg,
            lastTestedUser: '',
            lastTestedPass: '',
            lastTestedRefreshToken: '',
            validatedAccessToken: '',
          },
        }));
        setErrorMsg(errMsg);
      }
      if (sys.isConfigured && !targetRefreshToken) {
        fetchExternalAccounts();
      }
    } catch (err) {
      const errMsg = 'Lỗi kết nối máy chủ khi kiểm tra tài khoản.';
      setExtForm((prev) => ({
        ...prev,
        [sys.systemKey]: {
          ...prev[sys.systemKey],
          isTesting: false,
          testStatus: 'FAILED',
          testMessage: errMsg,
          lastTestedUser: '',
          lastTestedPass: '',
        },
      }));
      setErrorMsg(errMsg);
      if (sys.isConfigured) {
        fetchExternalAccounts();
      }
    }
  };

  // Delete External Account
  const handleDeleteExternalAccount = async (sys: any) => {
    if (!confirm(`Bạn có chắc chắn muốn hủy liên kết tài khoản ${sys.systemName}?`)) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/external-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE',
          systemKey: sys.systemKey,
          systemName: sys.systemName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        fetchExternalAccounts();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ');
    }
  };

  const configuredCount = externalAccounts.filter((a) => a.isConfigured).length;

  return {
    externalAccounts,
    isLoadingExternal,
    extForm,
    setExtForm,
    configuredCount,
    fetchExternalAccounts,
    handleSaveExternalAccount,
    handleTestConnection,
    handleDeleteExternalAccount,
  };
}
