'use client';

import React from 'react';
import { Eye, EyeOff, Key, User as UserIcon } from 'lucide-react';
import type { ExternalAccountFormState } from './types';

interface AccountFormInputsProps {
  sys: any;
  isSlink: boolean;
  isEditing: boolean;
  form: ExternalAccountFormState;
  setExtForm: React.Dispatch<React.SetStateAction<any>>;
}

export function AccountFormInputs({
  sys,
  isSlink,
  isEditing,
  form,
  setExtForm,
}: AccountFormInputsProps) {
  if (isSlink) {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
            <Key className="w-3.5 h-3.5 text-purple-500" /> Refresh Token (OAuth PTIT S-Link) *
          </label>
          <textarea
            rows={3}
            value={form.refreshToken || ''}
            onChange={(e) =>
              setExtForm((prev: any) => ({
                ...prev,
                [sys.systemKey]: {
                  ...prev[sys.systemKey],
                  refreshToken: e.target.value,
                  validatedAccessToken: '',
                  testStatus: 'IDLE',
                  testMessage: '',
                },
              }))
            }
            placeholder="Dán chuỗi refresh_token (eyJhbGci...) lấy sau khi đăng nhập OAuth trên slink.ptit.edu.vn"
            className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all break-all"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Hệ thống sẽ dùng <code className="font-mono text-purple-700">refresh_token</code> này để định kỳ tạo mới cả Access Token và Refresh Token mới (mỗi 20 phút).
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
            <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Email sinh viên PTIT (Tùy chọn - tự nhận diện khi Kiểm Tra)
          </label>
          <input
            type="text"
            value={form.username}
            onChange={(e) =>
              setExtForm((prev: any) => ({
                ...prev,
                [sys.systemKey]: {
                  ...prev[sys.systemKey],
                  username: e.target.value,
                },
              }))
            }
            placeholder="Để trống để tự động lấy từ Refresh Token"
            className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
          <UserIcon className="w-3.5 h-3.5 text-slate-400" />{' '}
          Tên đăng nhập ({sys.systemName})
        </label>
        <input
          type="text"
          value={form.username}
          onChange={(e) =>
            setExtForm((prev: any) => ({
              ...prev,
              [sys.systemKey]: {
                ...prev[sys.systemKey],
                username: e.target.value,
                testStatus: 'IDLE',
                testMessage: '',
              },
            }))
          }
          placeholder={sys.placeholderUser || 'Nhập mã sinh viên / tên đăng nhập'}
          className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
          <Key className="w-3.5 h-3.5 text-slate-400" /> Mật khẩu {sys.hasPassword && isEditing && '(Để trống nếu giữ nguyên)'}
        </label>
        <div className="relative">
          <input
            type={form.showPass ? 'text' : 'password'}
            value={form.password}
            onChange={(e) =>
              setExtForm((prev: any) => ({
                ...prev,
                [sys.systemKey]: {
                  ...prev[sys.systemKey],
                  password: e.target.value,
                  testStatus: 'IDLE',
                  testMessage: '',
                },
              }))
            }
            placeholder={
              isEditing && sys.hasPassword
                ? '•••••••• (Nhập mật khẩu mới để đổi)'
                : `Nhập mật khẩu ${sys.systemName}`
            }
            className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 pr-10 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
          <button
            type="button"
            onClick={() =>
              setExtForm((prev: any) => ({
                ...prev,
                [sys.systemKey]: { ...prev[sys.systemKey], showPass: !prev[sys.systemKey]?.showPass },
              }))
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            title={form.showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {form.showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
