'use client';

import React, { useState } from 'react';
import { LoginUser } from '../../types/auth.types';

interface UseProfileEditorParams {
  currentUser: LoginUser & { student?: any };
  student: any;
  onProfileUpdated?: (updatedUser: any) => void;
  setSuccessMsg: React.Dispatch<React.SetStateAction<string>>;
  setErrorMsg: React.Dispatch<React.SetStateAction<string>>;
}

export function useProfileEditor({
  currentUser,
  student,
  onProfileUpdated,
  setSuccessMsg,
  setErrorMsg,
}: UseProfileEditorParams) {
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(student?.soDienThoai || currentUser?.phoneNumber || '');
  const [note, setNote] = useState(student?.ghiChu || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);

  // Save profile info (phone & note)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soDienThoai: phone.trim(),
          ghiChu: note.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Đã lưu thông tin cá nhân thành công!');
        setIsEditing(false);
        if (onProfileUpdated) {
          onProfileUpdated({
            ...currentUser,
            phoneNumber: phone.trim(),
            student: {
              ...student,
              soDienThoai: phone.trim(),
              ghiChu: note.trim(),
            },
          });
        }
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Có lỗi xảy ra khi lưu.');
      }
    } catch (err: any) {
      setErrorMsg('Không thể kết nối đến máy chủ.');
    } finally {
      setIsSaving(false);
    }
  };

  // Sync student info from QLHT (w-locsinhvieninfo)
  const handleSyncProfileFromQlht = async () => {
    setIsSyncingProfile(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (res.ok && data.success && data.student) {
        setSuccessMsg(data.message || 'Đã đồng bộ thông tin cá nhân từ Cổng QLHT thành công!');
        if (data.student.soDienThoai) {
          setPhone(data.student.soDienThoai);
        }
        if (onProfileUpdated) {
          onProfileUpdated({
            ...currentUser,
            phoneNumber: data.student.soDienThoai || currentUser.phoneNumber,
            student: {
              ...student,
              ngaySinh: data.student.ngaySinh ?? student.ngaySinh ?? null,
              gioiTinh: data.student.gioiTinh ?? student.gioiTinh ?? null,
              soDienThoai: data.student.soDienThoai ?? student.soDienThoai ?? null,
              soCMND: data.student.soCMND ?? student.soCMND ?? null,
              email1: data.student.email1 ?? student.email1 ?? null,
              email2: data.student.email2 ?? student.email2 ?? null,
              noiSinh: data.student.noiSinh ?? student.noiSinh ?? null,
              quocTich: data.student.quocTich ?? student.quocTich ?? null,
            },
          });
        }
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Không thể đồng bộ thông tin từ QLHT.');
      }
    } catch {
      setErrorMsg('Không thể kết nối đến máy chủ để đồng bộ thông tin.');
    } finally {
      setIsSyncingProfile(false);
    }
  };

  return {
    isEditing,
    setIsEditing,
    phone,
    setPhone,
    note,
    setNote,
    isSaving,
    isSyncingProfile,
    handleSaveProfile,
    handleSyncProfileFromQlht,
  };
}
