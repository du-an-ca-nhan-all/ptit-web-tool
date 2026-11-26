import React from 'react';
import { FileKey, X, Zap, Copy } from 'lucide-react';
import { ExternalAccountAdminItem } from './types';
import { isSyncMessageError } from './utils';

interface TokenDetailModalProps {
  account: ExternalAccountAdminItem;
  onClose: () => void;
  onRefreshToken: (acc: ExternalAccountAdminItem) => void;
}

export function TokenDetailModal({
  account,
  onClose,
  onRefreshToken,
}: TokenDetailModalProps) {
  const isErrorMsg = account.syncMessage
    ? isSyncMessageError(account.status, account.syncMessage)
    : false;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <FileKey className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">Chi Tiết Access Token</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                {account.hoTen} ({account.username})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Giá trị Bearer Token (Dùng cho API Crawl & Đồng bộ):
            </label>
            <textarea
              readOnly
              value={account.token || 'Chưa có token'}
              rows={4}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-800 break-all outline-none select-all"
            />
          </div>

          {account.systemKey === 'SLINK_PTIT' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-purple-700">
                  OAuth Refresh Token (Tự động gia hạn định kỳ):
                </label>
                {account.refreshToken && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(account.refreshToken || '');
                      alert('Đã sao chép Refresh Token vào clipboard!');
                    }}
                    className="text-[11px] font-bold text-purple-700 hover:underline cursor-pointer"
                  >
                    Sao chép Refresh Token
                  </button>
                )}
              </div>
              <textarea
                readOnly
                value={account.refreshToken || 'Chưa có refresh_token'}
                rows={3}
                className="w-full bg-purple-50/50 border border-purple-200 rounded-xl p-3 text-xs font-mono text-slate-800 break-all outline-none select-all"
              />
              {account.lastTokenRefreshedAt && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Gia hạn gần nhất: {new Date(account.lastTokenRefreshedAt).toLocaleString('vi-VN')}
                  {account.refreshTokenExpiresAt
                    ? ` • Hết hạn dự kiến: ${new Date(account.refreshTokenExpiresAt).toLocaleString('vi-VN')}`
                    : ''}
                </p>
              )}
            </div>
          )}

          {account.syncMessage && (
            <div
              className={`p-3 rounded-xl text-xs ${
                isErrorMsg
                  ? 'bg-rose-50 border border-rose-200 text-rose-800'
                  : 'bg-slate-50 border border-slate-200 text-slate-600'
              }`}
            >
              <span
                className={`font-bold block mb-0.5 ${
                  isErrorMsg ? 'text-rose-900' : 'text-slate-700'
                }`}
              >
                Nhật ký trạng thái:
              </span>
              <span>{account.syncMessage}</span>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onRefreshToken(account)}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-amber-200"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Làm Mới Token Ngay</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  if (account.token) {
                    navigator.clipboard.writeText(account.token);
                    alert('Đã sao chép Token vào clipboard!');
                  }
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-200"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao Chép</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 sm:py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-center"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
