import type { LoginUser } from '../../../types/auth.types';
import type { ExternalAccountFormState } from './types';

export function createDefaultFormState(
  sys: any,
  currentUser: LoginUser
): ExternalAccountFormState {
  return {
    username: sys.extUsername || currentUser.username || '',
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

export function isAccountSyncError(sys: any): boolean {
  return (
    sys.status === 'ERROR' ||
    Boolean(
      sys.syncMessage &&
        (sys.syncMessage.toLowerCase().includes('lỗi') ||
          sys.syncMessage.toLowerCase().includes('thất bại') ||
          sys.syncMessage.toLowerCase().includes('không chính xác') ||
          sys.syncMessage.toLowerCase().includes('hết hạn'))
    )
  );
}

export function isConnectionTestSuccess(
  isSlink: boolean,
  form: ExternalAccountFormState
): boolean {
  return isSlink
    ? Boolean(
        form.testStatus === 'SUCCESS' &&
          form.refreshToken?.trim() &&
          form.refreshToken?.trim() === form.lastTestedRefreshToken
      )
    : Boolean(
        form.testStatus === 'SUCCESS' &&
          form.username?.trim() === form.lastTestedUser &&
          form.password?.trim() === form.lastTestedPass
      );
}
