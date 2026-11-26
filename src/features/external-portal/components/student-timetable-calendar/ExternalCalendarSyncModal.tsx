import React from 'react';
import {
  Sparkles,
  CheckCheck,
  Copy,
  X,
  Globe,
  CalendarPlus,
  Download,
  Smartphone,
} from 'lucide-react';

interface ExternalCalendarSyncModalProps {
  isOpen: boolean;
  username: string;
  copiedIcsUrl: boolean;
  onSetCopiedIcsUrl: (copied: boolean) => void;
  onClose: () => void;
}

export default function ExternalCalendarSyncModal({
  isOpen,
  username,
  copiedIcsUrl,
  onSetCopiedIcsUrl,
  onClose,
}: ExternalCalendarSyncModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 md:p-7 border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <CalendarPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight">
                Đồng Bộ Lịch Lên Google / Apple / Outlook
              </h3>
              <p className="text-xs text-slate-500">
                Tự động đồng bộ thời khóa biểu vào ứng dụng Lịch trên điện thoại & máy tính
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick explanation box */}
        <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-xs text-emerald-900 leading-relaxed space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-emerald-800">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Đồng bộ tự động & Nhắc nhở trước giờ học</span>
          </div>
          <p className="text-emerald-800/90 text-[11px]">
            Khi đăng ký qua URL này, ứng dụng Lịch (Google Calendar, iPhone, Mac, Outlook) sẽ định kỳ tự động quét và cập nhật nếu phòng học hoặc thời gian có thay đổi từ cổng trường.
          </p>
        </div>

        {/* 3 QUICK ACTION BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Google Calendar 1-click */}
          <a
            href={`https://calendar.google.com/calendar/render?cid=${encodeURIComponent(
              (typeof window !== 'undefined' ? window.location.origin : '')
                .replace(/^https?:\/\//i, 'webcal://') +
                `/api/calendar/timetable/${encodeURIComponent(username)}.ics`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50/60 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer group shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Google Calendar</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Thêm bằng 1-Click</div>
            </div>
          </a>

          {/* 2. Apple Calendar (iOS / Mac) */}
          <a
            href={
              (typeof window !== 'undefined' ? window.location.origin : '')
                .replace(/^https?:\/\//i, 'webcal://') +
              `/api/calendar/timetable/${encodeURIComponent(username)}.ics`
            }
            className="p-3.5 bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200/80 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer group shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Apple Calendar</div>
              <div className="text-[10px] text-slate-500 mt-0.5">iPhone, iPad, Mac</div>
            </div>
          </a>

          {/* 3. Tải File .ics */}
          <a
            href={`/api/calendar/timetable/${encodeURIComponent(username)}.ics`}
            download={`timetable_${username}.ics`}
            className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50/60 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer group shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Tải File .ics</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Nhập thủ công</div>
            </div>
          </a>
        </div>

        {/* DIRECT URL BOX WITH COPY BUTTON */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>Đường link đăng ký lịch cá nhân (iCal / WebCal URL):</span>
            {copiedIcsUrl && (
              <span className="text-emerald-600 text-[11px] font-bold flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5" /> Đã sao chép!
              </span>
            )}
          </label>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={
                typeof window !== 'undefined'
                  ? `${window.location.origin}/api/calendar/timetable/${username}.ics`
                  : `/api/calendar/timetable/${username}.ics`
              }
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={() => {
                const fullUrl = `${window.location.origin}/api/calendar/timetable/${username}.ics`;
                navigator.clipboard.writeText(fullUrl);
                onSetCopiedIcsUrl(true);
                setTimeout(() => onSetCopiedIcsUrl(false), 2500);
              }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm active:scale-95"
            >
              {copiedIcsUrl ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedIcsUrl ? 'Đã Chép' : 'Sao Chép'}</span>
            </button>
          </div>
        </div>

        {/* STEP-BY-STEP INSTRUCTIONS ACCORDION */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">
            Hướng dẫn cấu hình từng ứng dụng
          </div>

          <div className="space-y-2 text-slate-600 text-[11px] bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">1</span>
              <span>Google Calendar (Trên máy tính hoặc điện thoại):</span>
            </div>
            <p className="pl-5 text-slate-600">
              Mở Google Calendar trên máy tính ➔ Ở cột bên trái, bấm dấu <strong>+</strong> cạnh mục <em>&quot;Lịch khác&quot;</em> ➔ Chọn <strong>&quot;Từ URL&quot; (From URL)</strong> ➔ Dán link URL ở trên vào và bấm <strong>Thêm lịch</strong>.
            </p>

            <div className="font-bold text-slate-800 flex items-center gap-1.5 pt-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-white text-[10px] flex items-center justify-center">2</span>
              <span>Apple Calendar (iPhone, iPad, MacBook):</span>
            </div>
            <p className="pl-5 text-slate-600">
              Bấm trực tiếp nút <strong>&quot;Apple Calendar&quot;</strong> ở trên, hoặc vào <em>Cài đặt trên iPhone ➔ Lịch ➔ Tài khoản ➔ Thêm tài khoản ➔ Khác ➔ Thêm Lịch đã đăng ký</em> ➔ Dán link vào.
            </p>

            <div className="font-bold text-slate-800 flex items-center gap-1.5 pt-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[10px] flex items-center justify-center">3</span>
              <span>Microsoft Outlook & Notion Calendar:</span>
            </div>
            <p className="pl-5 text-slate-600">
              Trong Outlook Calendar, chọn <strong>Add calendar</strong> ➔ <strong>Subscribe from web</strong> ➔ Dán link URL vào và lưu lại.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
}
