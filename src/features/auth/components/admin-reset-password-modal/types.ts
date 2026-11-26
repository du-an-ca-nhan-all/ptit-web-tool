export type ResetPasswordMode = 'GENERATE' | 'CUSTOM' | 'CLEAR';

export interface AdminResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUsername?: string;
  initialFullName?: string;
  initialClass?: string;
  onSuccess?: () => void;
}

export interface ResetPasswordResult {
  username: string;
  fullName?: string;
  lop?: string;
  mode: string;
  newPassword?: string | null;
  message: string;
}
