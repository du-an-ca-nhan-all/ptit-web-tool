'use client';

import React, { useState } from 'react';
import {
  KeyRound,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  X,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

interface SlinkForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUsername?: string;
  defaultEmail?: string;
  onSuccess?: (sentTo: string) => void;
}

export default function SlinkForgotPasswordModal({
  isOpen,
  onClose,
  defaultUsername = '',
  defaultEmail = '',
  onSuccess,
}: SlinkForgotPasswordModalProps) {
  const getInitialIdentifier = () => {
    if (defaultEmail && defaultEmail.includes('@')) return defaultEmail.toLowerCase();
    if (defaultUsername) {
      const clean = defaultUsername.trim();
      return clean.includes('@') ? clean.toLowerCase() : `${clean.toLowerCase()}@stu.ptit.edu.vn`;
    }
    return '';
  };

  const [identifier, setIdentifier] = useState(getInitialIdentifier());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    sentTo: string;
    instructions: string[];
    outlookUrl: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMsg('Vui lòng nhập địa chỉ Email sinh viên PTIT (...@stu.ptit.edu.vn).');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await fetch('/api/slink/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data);
        if (onSuccess) onSuccess(data.sentTo);
      } else {
        setErrorMsg(data.error || 'Gửi yêu cầu đặt lại mật khẩu thất bại. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi mạng khi kết nối máy chủ SSO PTIT');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyIdentifier = () => {
    if (!identifier) return;
    navigator.clipboard.writeText(identifier);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-xs shadow-inner">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Quên / Lấy Lại Mật Khẩu S-Link
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white border border-white/30">
                  Tự Động SSO
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                Gửi yêu cầu tạo mật khẩu mới trực tiếp đến Cổng PTIT S-Link
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full cursor-pointer transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-purple-50/80 border border-purple-200/80 rounded-2xl p-3.5 text-xs text-purple-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-purple-900">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Cách thức hoạt động tự động:</span>
                </div>
                <p className="text-slate-600 text-[11.5px] leading-relaxed">
                  Tên đăng nhập Cổng PTIT S-Link là <strong className="text-purple-900">Email sinh viên PTIT</strong> (...@stu.ptit.edu.vn). Hệ thống sẽ gửi yêu cầu trực tiếp đến Keycloak SSO PTIT, và email chứa liên kết tạo mật khẩu mới sẽ được gửi về Microsoft Outlook của bạn.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" /> Email Sinh Viên PTIT (Tên đăng nhập S-Link):
                  </span>
                  {identifier && (
                    <button
                      type="button"
                      onClick={handleCopyIdentifier}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                  )}
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Ví dụ: b21dcpt001@stu.ptit.edu.vn"
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  disabled={isLoading}
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Nhập địa chỉ Email sinh viên PTIT (hoặc nhập Mã SV để tự động điền đuôi @stu.ptit.edu.vn).
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Lỗi:</strong>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !identifier.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-purple-200 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang Gửi Lệnh Đến SSO...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gửi Yêu Cầu Đặt Lại Mật Khẩu</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              {/* Success Banner */}
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start gap-3">
                <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-emerald-950 text-sm">
                    Đã Gửi Yêu Cầu Reset Mật Khẩu Thành Công!
                  </h4>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    Hệ thống PTIT S-Link đã chấp nhận yêu cầu cho tài khoản{' '}
                    <strong className="font-mono text-emerald-950">{result.sentTo}</strong>.
                  </p>
                </div>
              </div>

              {/* Step checklist */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Các bước tiếp theo cần thực hiện:</span>
                </div>
                <ol className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Mở hòm thư sinh viên{' '}
                      <strong className="text-purple-900">PTIT Microsoft Outlook</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Tìm thư từ <strong>PTIT Slink SSO (slink@ptit.edu.vn)</strong> với tiêu đề{' '}
                      <em>"Reset password"</em>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <span>Nhấp vào liên kết </span>
                      <strong className="text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-200">
                        Link to reset credentials
                      </strong>{' '}
                      <span className="text-amber-700 font-semibold inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> (Hiệu lực 5 phút)
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </span>
                    <span>
                      Nhập mật khẩu mới, sau đó quay lại trang này để <strong>Lưu & Kết Nối</strong>.
                    </span>
                  </li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setErrorMsg('');
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer text-center"
                >
                  Gửi lại cho tài khoản khác
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href="https://outlook.office.com/mail/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-sky-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Mở Hòm Thư Outlook</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Đã Xong
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
