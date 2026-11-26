export interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUsername?: string;
  onSuccess?: (username: string, newPassword?: string) => void;
}

export interface StudentLookupInfo {
  maSV: string;
  hoTen: string;
  maLop?: string | null;
}

export interface ForgotPasswordSuccessResult {
  username: string;
  fullName?: string;
  lop?: string | null;
  message: string;
}
