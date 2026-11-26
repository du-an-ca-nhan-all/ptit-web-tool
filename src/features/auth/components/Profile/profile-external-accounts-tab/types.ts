import type React from 'react';
import type { LoginUser } from '../../../types/auth.types';

export interface ExternalAccountFormState {
  username: string;
  password: string;
  refreshToken?: string;
  validatedAccessToken?: string;
  showPass: boolean;
  isSaving: boolean;
  isTesting: boolean;
  testStatus?: 'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILED';
  testMessage?: string;
  lastTestedUser?: string;
  lastTestedPass?: string;
  lastTestedRefreshToken?: string;
}

export interface ProfileExternalAccountsTabProps {
  currentUser: LoginUser;
  externalAccounts: any[];
  isLoadingExternal: boolean;
  extForm: {
    [key: string]: ExternalAccountFormState;
  };
  setExtForm: React.Dispatch<React.SetStateAction<any>>;
  onFetchExternalAccounts: () => Promise<void>;
  onTestConnection: (sys: any) => Promise<void>;
  onSaveExternalAccount: (sys: any) => Promise<void>;
  onDeleteExternalAccount: (sys: any) => Promise<void>;
}
