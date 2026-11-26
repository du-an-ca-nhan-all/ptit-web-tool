'use client';

import type React from 'react';
import { useState } from 'react';
import type { LoginUser } from '../../../types/auth.types';

interface UseExternalAccountsEditingParams {
  currentUser: LoginUser;
  setExtForm: React.Dispatch<React.SetStateAction<any>>;
  onSaveExternalAccount: (sys: any) => Promise<void>;
}

export function useExternalAccountsEditing({
  currentUser,
  setExtForm,
  onSaveExternalAccount,
}: UseExternalAccountsEditingParams) {
  // Quản lý trạng thái mở form chỉnh sửa cho từng hệ thống (systemKey)
  const [editingSystems, setEditingSystems] = useState<Record<string, boolean>>({});

  const handleStartEdit = (sys: any) => {
    setEditingSystems((prev) => ({ ...prev, [sys.systemKey]: true }));
    const defaultUser =
      sys.systemKey === 'SLINK_PTIT'
        ? sys.extUsername || ''
        : sys.extUsername || currentUser.username || '';
    setExtForm((prev: any) => ({
      ...prev,
      [sys.systemKey]: {
        username: defaultUser,
        password: '',
        refreshToken: '',
        validatedAccessToken: '',
        showPass: false,
        isSaving: false,
        isTesting: false,
        testStatus: 'IDLE',
        testMessage: '',
        lastTestedUser: '',
        lastTestedPass: '',
        lastTestedRefreshToken: '',
      },
    }));
  };

  const handleCancelEdit = (sysKey: string) => {
    setEditingSystems((prev) => ({ ...prev, [sysKey]: false }));
    setExtForm((prev: any) => ({
      ...prev,
      [sysKey]: {
        ...prev[sysKey],
        password: '',
        refreshToken: '',
        validatedAccessToken: '',
        testStatus: 'IDLE',
        testMessage: '',
        lastTestedUser: '',
        lastTestedPass: '',
        lastTestedRefreshToken: '',
      },
    }));
  };

  const handleSaveAccountWrapper = async (sys: any) => {
    await onSaveExternalAccount(sys);
    setEditingSystems((prev) => ({ ...prev, [sys.systemKey]: false }));
  };

  return {
    editingSystems,
    handleStartEdit,
    handleCancelEdit,
    handleSaveAccountWrapper,
  };
}
