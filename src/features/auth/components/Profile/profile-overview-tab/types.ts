import React from 'react';
import { LoginUser } from '../../../types/auth.types';

export interface ProfileOverviewTabProps {
  currentUser: LoginUser & { student?: any };
  maSV: string;
  fullName: string;
  gioiTinh: string;
  ngaySinh: string;
  maLop: string;
  phone: string;
  setPhone: (val: string) => void;
  note: string;
  setNote: (val: string) => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  isSaving: boolean;
  isSyncingProfile?: boolean;
  onSyncProfileFromQlht?: () => void;
  onSaveProfile: (e: React.FormEvent) => void;
  onLogout: () => void;
  hasExamSchedule?: boolean;
  onNavigateTab?: (tab: string) => void;
  onSelectSubTab: (subTab: any) => void;
}

export interface ProfileEditFormProps {
  maSV: string;
  maLop: string;
  phone: string;
  setPhone: (val: string) => void;
  note: string;
  setNote: (val: string) => void;
  isSaving: boolean;
  onSaveProfile: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export interface ProfileInfoGridProps {
  maSV: string;
  fullName: string;
  gioiTinh: string;
  ngaySinh: string;
  maLop: string;
  phone: string;
  note: string;
  student: any;
}

export interface ProfileQuickActionsCardProps {
  hasExamSchedule: boolean;
  onNavigateTab?: (tab: string) => void;
  onSelectSubTab: (subTab: any) => void;
  onLogout: () => void;
}
