import React from 'react';
import { Lock } from 'lucide-react';

interface NotificationOptionsGridProps {
  isTelegramReady: boolean;
  isQldttxAvailable: boolean;
  isQldttxError: boolean;
  isSlinkAvailable: boolean;
  isSlinkError: boolean;
  notifyExamSchedule: boolean;
  onChangeNotifyExamSchedule: (val: boolean) => void;
  notifyClassSchedule: boolean;
  onChangeNotifyClassSchedule: (val: boolean) => void;
  notifyClassActivity: boolean;
  onChangeNotifyClassActivity: (val: boolean) => void;
  notifyQldtAnnouncements: boolean;
  onChangeNotifyQldtAnnouncements: (val: boolean) => void;
  notifySlinkAnnouncements: boolean;
  onChangeNotifySlinkAnnouncements: (val: boolean) => void;
}

export default function NotificationOptionsGrid({
  isTelegramReady,
  isQldttxAvailable,
  isQldttxError,
  isSlinkAvailable,
  isSlinkError,
  notifyExamSchedule,
  onChangeNotifyExamSchedule,
  notifyClassSchedule,
  onChangeNotifyClassSchedule,
  notifyClassActivity,
  onChangeNotifyClassActivity,
  notifyQldtAnnouncements,
  onChangeNotifyQldtAnnouncements,
  notifySlinkAnnouncements,
  onChangeNotifySlinkAnnouncements,
}: NotificationOptionsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
      {/* Option 1: Exam Schedule */}
      <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-colors ${
        !isTelegramReady
          ? 'bg-slate-100/80 border-slate-200 opacity-60 cursor-not-allowed'
          : 'bg-white border-slate-200 hover:border-sky-300 cursor-pointer'
      }`}>
        <input
          type="checkbox"
          disabled={!isTelegramReady}
          checked={isTelegramReady && notifyExamSchedule}
          onChange={(e) => isTelegramReady && onChangeNotifyExamSchedule(e.target.checked)}
          className="w-4 h-4 mt-0.5 text-sky-600 rounded focus:ring-sky-500 cursor-pointer shrink-0 disabled:cursor-not-allowed"
        />
        <div className="text-xs flex-1">
          <div className="font-bold flex items-center justify-between gap-1">
            <span className={isTelegramReady ? 'text-slate-800' : 'text-slate-500'}>Lịch Thi & Ca Thi</span>
            {!isTelegramReady && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-slate-200 text-slate-600 flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" /> Khóa
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Nhắc trước 1 ngày & 7h sáng hôm thi</div>
        </div>
      </label>

      {/* Option 2: Class Schedule & Timetable (Requires Telegram Ready & QLDTTX) */}
      <div
        className={`p-3 rounded-xl border transition-all ${
          !isTelegramReady || !isQldttxAvailable
            ? 'bg-slate-100/80 border-slate-200 opacity-60 cursor-not-allowed'
            : 'bg-white border-amber-300 bg-amber-50/40 hover:border-amber-400 cursor-pointer'
        }`}
      >
        <label className={`flex items-start gap-2.5 ${!isTelegramReady || !isQldttxAvailable ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            disabled={!isTelegramReady || !isQldttxAvailable}
            checked={isTelegramReady && isQldttxAvailable && notifyClassSchedule}
            onChange={(e) => isTelegramReady && isQldttxAvailable && onChangeNotifyClassSchedule(e.target.checked)}
            className="w-4 h-4 mt-0.5 text-amber-600 rounded focus:ring-amber-500 cursor-pointer shrink-0 disabled:cursor-not-allowed"
          />
          <div className="text-xs flex-1">
            <div className="font-bold flex items-center justify-between gap-1">
              <span className={isTelegramReady && isQldttxAvailable ? 'text-amber-900' : 'text-slate-500'}>
                Lịch Học & Thời Khóa Biểu
              </span>
              {!isTelegramReady ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-slate-200 text-slate-600 flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Khóa
                </span>
              ) : !isQldttxAvailable ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  {isQldttxError ? 'Lỗi xác thực' : 'Chưa liên kết'}
                </span>
              ) : null}
            </div>
            <div className={`text-[10px] mt-0.5 ${isTelegramReady && isQldttxAvailable ? 'text-amber-700' : 'text-slate-400'}`}>
              {!isTelegramReady
                ? 'Yêu cầu cấu hình & test Telegram thành công.'
                : !isQldttxAvailable
                ? isQldttxError
                  ? 'Mật khẩu QLDTTX sai/hết hạn. Cần cập nhật lại.'
                  : 'Yêu cầu liên kết tài khoản Cổng QLDTTX.'
                : 'Tổng hợp sáng 7h-10h & nhắc trước giờ học'}
            </div>
          </div>
        </label>
      </div>

      {/* Option 3: Class Activity */}
      <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-colors ${
        !isTelegramReady
          ? 'bg-slate-100/80 border-slate-200 opacity-60 cursor-not-allowed'
          : 'bg-white border-slate-200 hover:border-sky-300 cursor-pointer'
      }`}>
        <input
          type="checkbox"
          disabled={!isTelegramReady}
          checked={isTelegramReady && notifyClassActivity}
          onChange={(e) => isTelegramReady && onChangeNotifyClassActivity(e.target.checked)}
          className="w-4 h-4 mt-0.5 text-sky-600 rounded focus:ring-sky-500 cursor-pointer shrink-0 disabled:cursor-not-allowed"
        />
        <div className="text-xs flex-1">
          <div className="font-bold flex items-center justify-between gap-1">
            <span className={isTelegramReady ? 'text-slate-800' : 'text-slate-500'}>Biến Động Lớp Học</span>
            {!isTelegramReady && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-slate-200 text-slate-600 flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" /> Khóa
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Phân công nước uống & bù trừ lớp</div>
        </div>
      </label>

      {/* Option 5: QLDTTX Portal Announcements (Requires Telegram Ready & QLDTTX) */}
      <div
        className={`p-3 rounded-xl border transition-all ${
          !isTelegramReady || !isQldttxAvailable
            ? 'bg-slate-100/80 border-slate-200 opacity-60 cursor-not-allowed'
            : 'bg-white border-sky-300 bg-sky-50/40 hover:border-sky-400 cursor-pointer'
        }`}
      >
        <label className={`flex items-start gap-2.5 ${!isTelegramReady || !isQldttxAvailable ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            disabled={!isTelegramReady || !isQldttxAvailable}
            checked={isTelegramReady && isQldttxAvailable && notifyQldtAnnouncements}
            onChange={(e) => isTelegramReady && isQldttxAvailable && onChangeNotifyQldtAnnouncements(e.target.checked)}
            className="w-4 h-4 mt-0.5 text-sky-600 rounded focus:ring-sky-500 cursor-pointer shrink-0 disabled:cursor-not-allowed"
          />
          <div className="text-xs flex-1">
            <div className="font-bold flex items-center justify-between gap-1">
              <span className={isTelegramReady && isQldttxAvailable ? 'text-sky-900' : 'text-slate-500'}>
                Thông Báo Cổng QLDTTX
              </span>
              {!isTelegramReady ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-slate-200 text-slate-600 flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Khóa
                </span>
              ) : !isQldttxAvailable ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  {isQldttxError ? 'Lỗi xác thực' : 'Chưa liên kết'}
                </span>
              ) : null}
            </div>
            <div className={`text-[10px] mt-0.5 ${isTelegramReady && isQldttxAvailable ? 'text-sky-700' : 'text-slate-400'}`}>
              {!isTelegramReady
                ? 'Yêu cầu cấu hình & test Telegram thành công.'
                : !isQldttxAvailable
                ? isQldttxError
                  ? 'Mật khẩu QLDTTX sai/hết hạn. Cần cập nhật lại.'
                  : 'Yêu cầu liên kết tài khoản Cổng QLDTTX.'
                : '/#/xemthongbao (Thông báo mới từ Học viện)'}
            </div>
          </div>
        </label>
      </div>

      {/* Option 6: PTIT S-Link Portal Announcements (Requires Telegram Ready & S-Link) */}
      <div
        className={`p-3 rounded-xl border transition-all ${
          !isTelegramReady || !isSlinkAvailable
            ? 'bg-slate-100/80 border-slate-200 opacity-60 cursor-not-allowed'
            : 'bg-white border-indigo-300 bg-indigo-50/40 hover:border-indigo-400 cursor-pointer'
        }`}
      >
        <label className={`flex items-start gap-2.5 ${!isTelegramReady || !isSlinkAvailable ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            disabled={!isTelegramReady || !isSlinkAvailable}
            checked={isTelegramReady && isSlinkAvailable && notifySlinkAnnouncements}
            onChange={(e) => isTelegramReady && isSlinkAvailable && onChangeNotifySlinkAnnouncements(e.target.checked)}
            className="w-4 h-4 mt-0.5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer shrink-0 disabled:cursor-not-allowed"
          />
          <div className="text-xs flex-1">
            <div className="font-bold flex items-center justify-between gap-1">
              <span className={isTelegramReady && isSlinkAvailable ? 'text-indigo-900' : 'text-slate-500'}>
                Thông Báo PTIT S-Link
              </span>
              {!isTelegramReady ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-slate-200 text-slate-600 flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Khóa
                </span>
              ) : !isSlinkAvailable ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  {isSlinkError ? 'Lỗi xác thực' : 'Chưa liên kết'}
                </span>
              ) : null}
            </div>
            <div className={`text-[10px] mt-0.5 ${isTelegramReady && isSlinkAvailable ? 'text-indigo-700' : 'text-slate-400'}`}>
              {!isTelegramReady
                ? 'Yêu cầu cấu hình & test Telegram thành công.'
                : !isSlinkAvailable
                ? isSlinkError
                  ? 'Refresh Token S-Link hết hạn hoặc không hợp lệ. Cần cập nhật lại.'
                  : 'Yêu cầu liên kết tài khoản PTIT S-Link.'
                : 'slink.ptit.edu.vn (Tự động đánh dấu đã đọc sau khi gửi)'}
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
