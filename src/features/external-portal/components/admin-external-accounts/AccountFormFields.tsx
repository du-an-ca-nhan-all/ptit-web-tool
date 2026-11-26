import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { AVAILABLE_EXTERNAL_SYSTEMS } from '../../../../types';
import { SlinkConnectionGuide } from '../SlinkConnectionGuide';
import { AccountFormData, ModalMode, ModalTestStatus } from './types';

interface AccountFormFieldsProps {
  modalMode: ModalMode;
  formData: AccountFormData;
  setFormData: React.Dispatch<React.SetStateAction<AccountFormData>>;
  showModalPass: boolean;
  setShowModalPass: React.Dispatch<React.SetStateAction<boolean>>;
  setModalTestStatus: (status: ModalTestStatus) => void;
  setModalTestError: (err: string) => void;
  setLastTestedModalUser: (val: string) => void;
  setLastTestedModalPass: (val: string) => void;
  setValidatedModalAccessToken: (val: string) => void;
}

export function AccountFormFields({
  modalMode,
  formData,
  setFormData,
  showModalPass,
  setShowModalPass,
  setModalTestStatus,
  setModalTestError,
  setLastTestedModalUser,
  setLastTestedModalPass,
  setValidatedModalAccessToken,
}: AccountFormFieldsProps) {
  const isSlink = formData.systemKey === 'SLINK_PTIT';

  return (
    <>
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Hệ thống kết nối</label>
        <select
          value={formData.systemKey}
          onChange={(e) => {
            const sel = AVAILABLE_EXTERNAL_SYSTEMS.find((s) => s.key === e.target.value);
            if (sel) {
              setFormData({
                ...formData,
                systemKey: sel.key,
                systemName: sel.name,
                systemUrl: sel.url,
              });
              setModalTestStatus('IDLE');
              setModalTestError('');
              setLastTestedModalUser('');
              setLastTestedModalPass('');
            }
          }}
          disabled={modalMode === 'EDIT'}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 sm:py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60"
        >
          {AVAILABLE_EXTERNAL_SYSTEMS.map((sys) => (
            <option key={sys.key} value={sys.key}>
              {sys.name} ({sys.url})
            </option>
          ))}
        </select>
      </div>

      {isSlink && (
        <SlinkConnectionGuide variant="compact" defaultUsername={formData.extUsername || ''} />
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Mã sinh viên trong hệ thống (MaSV)
        </label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => {
            setFormData({ ...formData, username: e.target.value.toUpperCase() });
            setModalTestStatus('IDLE');
            setModalTestError('');
          }}
          disabled={modalMode === 'EDIT'}
          placeholder="Ví dụ: K25DTCN402"
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 sm:py-2 text-sm font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          {isSlink
            ? 'Email sinh viên PTIT (Tùy chọn - tự nhận diện từ Refresh Token)'
            : `Tên đăng nhập trên ${formData.systemName} (Mã SV / Username)`}
        </label>
        <input
          type="text"
          value={formData.extUsername}
          onChange={(e) => {
            setFormData({ ...formData, extUsername: e.target.value });
            if (formData.systemKey !== 'SLINK_PTIT') {
              setModalTestStatus('IDLE');
              setModalTestError('');
            }
          }}
          placeholder={
            isSlink ? 'Để trống để tự động lấy từ Refresh Token' : 'Ví dụ: K25DTCN402'
          }
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 sm:py-2 text-sm font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          required={!isSlink}
        />
      </div>

      {isSlink ? (
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            OAuth Refresh Token (PTIT S-Link) *
          </label>
          <textarea
            rows={3}
            value={formData.refreshToken}
            onChange={(e) => {
              setFormData({ ...formData, refreshToken: e.target.value });
              setModalTestStatus('IDLE');
              setModalTestError('');
              setValidatedModalAccessToken('');
            }}
            placeholder="Dán chuỗi refresh_token (eyJhbGci...) lấy sau khi đăng nhập OAuth trên slink.ptit.edu.vn"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none break-all"
            required
          />
        </div>
      ) : (
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Mật khẩu trên {formData.systemName}
          </label>
          <div className="relative">
            <input
              type={showModalPass ? 'text' : 'password'}
              value={formData.extPassword}
              onChange={(e) => {
                setFormData({ ...formData, extPassword: e.target.value });
                setModalTestStatus('IDLE');
                setModalTestError('');
              }}
              placeholder={`Nhập mật khẩu tài khoản ${
                formData.systemKey === 'LMS_PTTC1' ? 'LMS' : 'QLDTTX'
              }`}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 sm:py-2 pr-10 text-sm font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowModalPass(!showModalPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              {showModalPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
