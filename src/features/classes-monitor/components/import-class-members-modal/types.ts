export interface ExistingActiveStudent {
  MaSV: string;
  HoLotSV?: string;
  TenSV?: string;
  PHAI?: string;
  NgaySinhC?: string;
  phone?: string;
  note?: string;
}

export interface ImportClassMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: string;
  existingActiveStudents: ExistingActiveStudent[];
  onImportSuccess: (message: string) => void;
}

export type InputTab = 'FILE' | 'TEXT';
export type ImportStep = 'INPUT' | 'CONFIRM';
