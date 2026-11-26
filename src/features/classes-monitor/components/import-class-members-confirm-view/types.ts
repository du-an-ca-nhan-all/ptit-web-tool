import type { ClassMemberImportPreview } from '../../server/classMemberImportService';

export interface ImportClassMembersConfirmViewProps {
  preview: ClassMemberImportPreview;
  isExecuting: boolean;
  error: string | null;
  onBack: () => void;
  onConfirm: () => void;
}

export type DetailTab = 'DROPPED' | 'TRANSFERRED' | 'NEW' | 'RESTORED' | 'UNCHANGED';

export interface DetailTabConfig {
  key: DetailTab;
  label: string;
  count: number;
  activeClass: string;
  badgeClass: string;
}
