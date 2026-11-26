import React from 'react';
import { Sparkles, Radio } from 'lucide-react';

interface TelegramSetupGuideProps {
  activeBotUsername?: string | null;
  onOpenAutoDetect: () => void;
}

export default function TelegramSetupGuide({
  activeBotUsername,
  onOpenAutoDetect,
}: TelegramSetupGuideProps) {
  return (
    <div className="bg-slate-50 border border-sky-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-2 mb-3.5 sm:mb-4">
        <div className="flex items-center gap-2 text-sky-800 font-black text-xs sm:text-sm">
          <Sparkles className="w-4 h-4 text-sky-600" />
          <span>Hướng Dẫn Lấy Chat ID & Topic ID Dễ Dàng Nhất</span>
        </div>
        <button
          type="button"
          onClick={onOpenAutoDetect}
          className="inline-flex items-center gap-1 px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
        >
          <Radio className="w-3 h-3 animate-pulse" />
          <span>Mở Trợ Lý Bắt ID Tự Động ➜</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs">
        {/* Case 1: Private */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-indigo-100 flex flex-col gap-1.5 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-indigo-900">
            <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[11px] shrink-0 font-bold">1</span>
            <span>Nhận Tin Nhắn Cá Nhân</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px] sm:text-xs">
            Mở bot Telegram <strong className="text-indigo-600">@{activeBotUsername || 'PTIT_EduSync_Bot'}</strong> $\rightarrow$ Bấm <strong>Start</strong> $\rightarrow$ Bấm nút <em>"Trợ Lý Bắt ID"</em> ở dưới để hệ thống tự điền Chat ID.
          </p>
        </div>

        {/* Case 2: Group & Topic */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-100 flex flex-col gap-1.5 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-emerald-900">
            <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[11px] shrink-0 font-bold">2</span>
            <span>Nhóm Lớp & Forum Topic</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px] sm:text-xs">
            Thêm Bot vào nhóm $\rightarrow$ Gửi 1 tin nhắn vào Topic bạn muốn $\rightarrow$ Bấm <em>"Trợ Lý Bắt ID"</em> hoặc chỉ cần <strong>chuột phải vào Topic $\rightarrow$ Copy Link</strong> và dán thẳng vào ô bên dưới.
          </p>
        </div>

        {/* Case 3: Channel */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-100 flex flex-col gap-1.5 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <span className="w-5 h-5 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-[11px] shrink-0 font-bold">3</span>
            <span>Kênh Thông Báo (Channel)</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px] sm:text-xs">
            Thêm Bot làm <strong>Quản trị viên (Admin)</strong> có quyền <em>Đăng bài (Post Messages)</em> $\rightarrow$ Đăng 1 bài lên kênh hoặc dán link Kênh (vd: <code className="bg-slate-100 px-1 py-0.2 rounded font-mono text-amber-800">t.me/c/...</code>) vào ô bên dưới.
          </p>
        </div>
      </div>
    </div>
  );
}
