'use client';

import React from 'react';
import { User as UserIcon, Edit3, RefreshCw } from 'lucide-react';
import { ProfileOverviewTabProps } from './profile-overview-tab/types';
import { ProfileEditForm } from './profile-overview-tab/ProfileEditForm';
import { ProfileInfoGrid } from './profile-overview-tab/ProfileInfoGrid';
import { ProfileInstitutionCard } from './profile-overview-tab/ProfileInstitutionCard';
import { ProfileQuickActionsCard } from './profile-overview-tab/ProfileQuickActionsCard';

export function ProfileOverviewTab({
  currentUser,
  maSV,
  fullName,
  gioiTinh,
  ngaySinh,
  maLop,
  phone,
  setPhone,
  note,
  setNote,
  isEditing,
  setIsEditing,
  isSaving,
  isSyncingProfile = false,
  onSyncProfileFromQlht,
  onSaveProfile,
  onLogout,
  hasExamSchedule = false,
  onNavigateTab,
  onSelectSubTab,
}: ProfileOverviewTabProps) {
  const student = currentUser?.student || {};

  const handleCancelEdit = () => {
    setIsEditing(false);
    setPhone(student?.soDienThoai || currentUser?.phoneNumber || '');
    setNote(student?.ghiChu || '');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Main Personal Info Card */}
      <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5 sm:pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl shrink-0">
              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-800">Hồ Sơ & Lý Lịch Học Tập</h3>
              <p className="text-[11px] sm:text-xs text-slate-500">Thông tin cá nhân trích xuất từ cơ sở dữ liệu sinh viên</p>
            </div>
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              {onSyncProfileFromQlht && (
                <button
                  type="button"
                  onClick={onSyncProfileFromQlht}
                  disabled={isSyncingProfile}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-60 text-emerald-700 text-xs font-bold rounded-xl sm:rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0 border border-emerald-200/70"
                  title="Đồng bộ ngày sinh, giới tính, SĐT, CMND, email, nơi sinh, quốc tịch từ cổng QLHT"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingProfile ? 'animate-spin' : ''}`} />
                  <span>{isSyncingProfile ? 'Đang đồng bộ...' : 'Đồng Bộ QLHT'}</span>
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl sm:rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh Sửa SĐT / Ghi Chú</span>
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <ProfileEditForm
            maSV={maSV}
            maLop={maLop}
            phone={phone}
            setPhone={setPhone}
            note={note}
            setNote={setNote}
            isSaving={isSaving}
            onSaveProfile={onSaveProfile}
            onCancel={handleCancelEdit}
          />
        ) : (
          <ProfileInfoGrid
            maSV={maSV}
            fullName={fullName}
            gioiTinh={gioiTinh}
            ngaySinh={ngaySinh}
            maLop={maLop}
            phone={phone}
            note={note}
            student={student}
          />
        )}
      </div>

      {/* Side Info Cards */}
      <div className="flex flex-col gap-4 sm:gap-6">
        <ProfileInstitutionCard />
        <ProfileQuickActionsCard
          hasExamSchedule={hasExamSchedule}
          onNavigateTab={onNavigateTab}
          onSelectSubTab={onSelectSubTab}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
}
