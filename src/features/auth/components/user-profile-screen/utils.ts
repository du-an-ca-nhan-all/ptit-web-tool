import { ExternalAccountFormEntry, ExternalAccountFormMap } from './types';

export function createFallbackExternalFormEntry(
  sys: any,
  fallbackUsername?: string
): ExternalAccountFormEntry {
  return {
    username: sys.extUsername || fallbackUsername || '',
    password: '',
    refreshToken: '',
    validatedAccessToken: '',
    showPass: false,
    isSaving: false,
    isTesting: false,
    testStatus: 'IDLE' as const,
    testMessage: '',
    lastTestedUser: '',
    lastTestedPass: '',
    lastTestedRefreshToken: '',
  };
}

export function buildInitialExternalFormMap(
  accounts: any[],
  prev: ExternalAccountFormMap,
  currentUsername: string
): ExternalAccountFormMap {
  const formState: ExternalAccountFormMap = { ...prev };
  accounts.forEach((acc: any) => {
    const defaultUser =
      acc.systemKey === 'SLINK_PTIT'
        ? acc.extUsername || ''
        : acc.extUsername || currentUsername;
    formState[acc.systemKey] = {
      username: prev[acc.systemKey]?.username || defaultUser,
      password: prev[acc.systemKey]?.password || '',
      refreshToken: prev[acc.systemKey]?.refreshToken || '',
      validatedAccessToken: prev[acc.systemKey]?.validatedAccessToken || '',
      showPass: prev[acc.systemKey]?.showPass || false,
      isSaving: false,
      isTesting: false,
      testStatus: prev[acc.systemKey]?.testStatus || 'IDLE',
      testMessage: prev[acc.systemKey]?.testMessage || '',
      lastTestedUser: prev[acc.systemKey]?.lastTestedUser || '',
      lastTestedPass: prev[acc.systemKey]?.lastTestedPass || '',
      lastTestedRefreshToken: prev[acc.systemKey]?.lastTestedRefreshToken || '',
    };
  });
  return formState;
}

export function validateSaveExternalAccount(
  form: ExternalAccountFormEntry,
  isSlink: boolean
): string | null {
  if (isSlink) {
    if (!form.refreshToken || !form.refreshToken.trim()) {
      return 'Vui lòng nhập Refresh Token OAuth của PTIT S-Link';
    }
    const isTestPassed =
      form.testStatus === 'SUCCESS' &&
      form.refreshToken.trim() === form.lastTestedRefreshToken;

    if (!isTestPassed) {
      return 'Yêu cầu bấm "Kiểm Tra Kết Nối" thành công trước khi có thể lưu cấu hình.';
    }
    return null;
  }

  if (!form.username || !form.username.trim()) {
    return 'Vui lòng nhập tên đăng nhập hệ thống';
  }
  if (!form.password || !form.password.trim()) {
    return 'Vui lòng nhập mật khẩu tài khoản hệ thống ngoài';
  }

  const isTestPassed =
    form.testStatus === 'SUCCESS' &&
    form.username.trim() === form.lastTestedUser &&
    form.password.trim() === form.lastTestedPass;

  if (!isTestPassed) {
    return 'Yêu cầu bấm "Kiểm Tra Kết Nối" thành công trước khi có thể lưu cấu hình.';
  }

  return null;
}

export function buildSaveExternalAccountPayload(
  sys: any,
  form: ExternalAccountFormEntry,
  isSlink: boolean
) {
  if (isSlink) {
    return {
      action: 'SAVE',
      systemKey: sys.systemKey,
      systemName: sys.systemName,
      systemUrl: sys.systemUrl,
      extUsername: form.username?.trim() || '',
      refreshToken: form.refreshToken?.trim() || '',
      accessToken: form.validatedAccessToken || '',
    };
  }

  return {
    action: 'SAVE',
    systemKey: sys.systemKey,
    systemName: sys.systemName,
    systemUrl: sys.systemUrl,
    extUsername: form.username.trim(),
    extPassword: form.password.trim(),
  };
}

export function validateTestExternalAccount(
  sys: any,
  targetUser: string,
  targetPass: string,
  targetRefreshToken: string,
  isSlink: boolean
): string | null {
  if (isSlink) {
    if (!targetRefreshToken && !sys.hasRefreshToken) {
      return 'Vui lòng nhập Refresh Token OAuth của PTIT S-Link trước khi kiểm tra';
    }
    return null;
  }

  if (!targetUser) {
    return 'Vui lòng nhập tên đăng nhập / mã sinh viên trước khi kiểm tra';
  }
  if (!targetPass && !sys.hasPassword) {
    return 'Vui lòng nhập mật khẩu tài khoản trước khi kiểm tra';
  }

  return null;
}

export function buildTestExternalAccountPayload(
  sys: any,
  targetUser: string,
  targetPass: string,
  targetRefreshToken: string,
  isSlink: boolean
) {
  if (isSlink) {
    return {
      action: 'TEST',
      systemKey: sys.systemKey,
      systemName: sys.systemName,
      systemUrl: sys.systemUrl,
      extUsername: targetUser,
      refreshToken: targetRefreshToken || undefined,
    };
  }

  return {
    action: 'TEST',
    systemKey: sys.systemKey,
    systemName: sys.systemName,
    systemUrl: sys.systemUrl,
    extUsername: targetUser,
    extPassword: targetPass,
  };
}
